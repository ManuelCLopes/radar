import type { Express } from "express";
import { storage } from "../storage";
import { runReportForBusiness } from "../reports";
import { isAuthenticated } from "../auth";
import { type User as AppUser } from "@shared/schema";
import { searchPlacesByAddress, hasGoogleApiKey } from "../googlePlaces";
import { getPlanLimits } from "../limits";

export function registerReportRoutes(app: Express) {
    app.post("/api/reports/save-existing", isAuthenticated, async (req, res) => {
        try {
            const { businessId, report } = req.body;

            if (!report) {
                return res.status(400).json({ error: "Missing report data" });
            }

            // Save report linked to the current user
            const savedReport = await storage.createReport({
                userId: (req.user as any).id,
                businessId,
                businessName: report.businessName,
                competitors: report.competitors,
                aiAnalysis: report.aiAnalysis,
                html: report.html || "",
            });

            res.json(savedReport);
        } catch (error) {
            console.error("Error saving existing report:", error);
            res.status(500).json({ error: "Failed to save report" });
        }
    });

    app.post("/api/run-report/:id", isAuthenticated, async (req, res) => {
        try {
            const businessId = req.params.id;
            const { email, language } = req.body;
            const reportLanguage = language || "en";

            const business = await storage.getBusiness(businessId);
            if (!business) {
                return res.status(404).json({ error: "Business not found" });
            }

            // Verify ownership
            if (business.userId && business.userId !== (req.user as AppUser).id) {
                return res.status(403).json({ error: "Unauthorized access to this business" });
            }

            // Verify account status
            if ((req.user as AppUser).verificationToken && !(req.user as AppUser).isVerified) {
                return res.status(403).json({ error: "Please verify your email address to generate reports" });
            }

            // Check report limits
            const limits = getPlanLimits((req.user as AppUser).plan);
            const currentUsage = await storage.countReportsCurrentMonth((req.user as AppUser).id);

            if (limits.maxMonthlyReports !== Infinity && currentUsage >= limits.maxMonthlyReports) {
                return res.status(403).json({
                    error: "Report limit reached",
                    message: `Your current plan allows for ${limits.maxMonthlyReports} reports per month. Please upgrade to create more reports.`
                });
            }

            const report = await runReportForBusiness(businessId, language, undefined, (req.user as AppUser).id);
            res.json(report);
        } catch (error) {
            console.error("Error generating report:", error);
            res.status(500).json({ error: "Failed to generate report" });
        }
    });

    app.post("/api/reports/:id/email", isAuthenticated, async (req, res) => {
        try {
            const { email, language } = req.body;
            const reportId = req.params.id;

            if (!email) {
                return res.status(400).json({ error: "Email is required" });
            }

            const report = await storage.getReport(reportId);
            if (!report) {
                return res.status(404).json({ error: "Report not found" });
            }

            // Verify ownership
            if (report.userId && report.userId !== (req.user as AppUser).id) {
                return res.status(403).json({ error: "Unauthorized access to this report" });
            }

            const { emailService } = await import("../email");
            // Use the provided language or user preference, normalized to 2 characters
            const requestedLang = language || (req.user as AppUser).language || "en";
            const normalizedLang = requestedLang.substring(0, 2).toLowerCase();

            const success = await emailService.sendAdHocReport(email, report, normalizedLang);

            if (success) {
                res.json({ message: "Email sent successfully" });
            } else {
                res.status(500).json({ error: "Failed to send email" });
            }
        } catch (error) {
            console.error("Error sending report email:", error);
            res.status(500).json({ error: "Failed to send email" });
        }
    });

    app.get("/api/reports/business/:businessId", isAuthenticated, async (req, res) => {
        try {
            const business = await storage.getBusiness(req.params.businessId);
            if (!business) {
                return res.status(404).json({ error: "Business not found" });
            }

            if (business.userId && business.userId !== (req.user as AppUser).id) {
                return res.status(403).json({ error: "Unauthorized access to this business" });
            }

            const reports = await storage.getReportsByBusinessId(req.params.businessId);
            res.json(reports);
        } catch (error) {
            console.error("Error getting reports:", error);
            res.status(500).json({ error: "Failed to get reports" });
        }
    });

    app.get("/api/reports", isAuthenticated, async (req, res) => {
        try {
            const reports = await storage.getReportsByUserId((req.user as AppUser).id);
            res.json(reports);
        } catch (error) {
            console.error("Error listing reports:", error);
            res.status(500).json({ error: "Failed to list reports" });
        }
    });

    // Get User's Report History
    app.get("/api/reports/history", async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        const reports = await storage.getReportsByUserId((req.user as AppUser).id);
        res.json(reports);
    });

    app.get("/api/reports/:id", isAuthenticated, async (req, res) => {
        try {
            const report = await storage.getReport(req.params.id);

            if (!report) {
                return res.status(404).json({ error: "Report not found" });
            }

            // Verify ownership
            if (report.userId && report.userId !== (req.user as AppUser).id) {
                return res.status(403).json({ error: "Unauthorized access to this report" });
            }

            res.json(report);
        } catch (error) {
            console.error("Error getting report:", error);
            res.status(500).json({ error: "Failed to get report" });
        }
    });

    app.delete("/api/reports/:id", isAuthenticated, async (req, res) => {
        try {
            const report = await storage.getReport(req.params.id);

            if (!report) {
                return res.status(404).json({ error: "Report not found" });
            }

            // Verify ownership
            if (report.userId && report.userId !== (req.user as AppUser).id) {
                return res.status(403).json({ error: "Unauthorized access to this report" });
            }

            await storage.deleteReport(req.params.id);
            res.json({ message: "Report deleted successfully" });
        } catch (error) {
            console.error("Error deleting report:", error);
            res.status(500).json({ error: "Failed to delete report" });
        }
    });

    // Authenticated Address Analysis
    app.post("/api/analyze-address", async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);

        // Verify account status
        if ((req.user as AppUser).verificationToken && !(req.user as AppUser).isVerified) {
            return res.status(403).json({ error: "Please verify your email address to generate reports" });
        }

        const limits = getPlanLimits((req.user as AppUser).plan);

        // Check report limits
        const currentUsage = await storage.countReportsCurrentMonth((req.user as AppUser).id);
        if (limits.maxMonthlyReports !== Infinity && currentUsage >= limits.maxMonthlyReports) {
            return res.status(403).json({
                error: "Report limit reached",
                message: `Your current plan allows for ${limits.maxMonthlyReports} reports per month. Please upgrade to create more reports.`
            });
        }

        try {
            const { address, type, radius, language = 'en', latitude, longitude } = req.body;

            // Require either address OR coordinates
            if ((!address && (!latitude || !longitude)) || !type || !radius) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            // Check radius limit
            if (radius > limits.maxRadius) {
                return res.status(403).json({
                    error: "Radius limit reached",
                    message: `Your current plan allows for a maximum radius of ${limits.maxRadius / 1000}km. Please upgrade to analyze larger areas.`
                });
            }

            // Search for coordinates OR use provided
            let coordinates = null;

            if (latitude && longitude) {
                coordinates = { latitude, longitude };
            } else if (hasGoogleApiKey() && address) {
                const searchResults = await searchPlacesByAddress(address);
                if (searchResults && searchResults.length > 0) {
                    coordinates = {
                        latitude: searchResults[0].latitude,
                        longitude: searchResults[0].longitude
                    };
                }
            }

            if (!coordinates) {
                return res.status(400).json({ error: "Location not found" });
            }

            // Create temp business object
            const tempBusiness = {
                id: 'analysis-' + Date.now(),
                name: address.split(',')[0],
                type,
                address,
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                locationStatus: 'validated' as const,
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: null, // Temp business has no user
                rating: null,
                userRatingsTotal: null
            };

            // Generate report
            const report = await runReportForBusiness(tempBusiness.id, language, tempBusiness, (req.user as AppUser).id, radius);

            // Save report with userId
            const { id: _tempId, generatedAt: _tempGenAt, ...reportData } = report;

            const savedReport = await storage.createReport({
                ...reportData,
                executiveSummary: reportData.executiveSummary || undefined,
                swotAnalysis: reportData.swotAnalysis as any || undefined,
                marketTrends: reportData.marketTrends as any || undefined,
                targetAudience: reportData.targetAudience as any || undefined,
                marketingStrategy: reportData.marketingStrategy as any || undefined,
                customerSentiment: reportData.customerSentiment as any || undefined,
                html: reportData.html || undefined,
                userId: (req.user as AppUser).id,
                businessId: null, // Explicitly set to null for ad-hoc analysis
                radius: reportData.radius || undefined
            });

            res.json({
                ...savedReport,
                latitude: tempBusiness.latitude,
                longitude: tempBusiness.longitude
            });
        } catch (error) {
            console.error("Analysis error details:", error);
            res.status(500).json({ error: "Failed to run analysis" });
        }
    });
}
