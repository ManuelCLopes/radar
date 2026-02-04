import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { type User as AppUser } from "@shared/schema";

export function registerTrendRoutes(app: Express) {
    app.get("/api/trends/:businessId", isAuthenticated, async (req, res) => {
        try {
            const businessId = req.params.businessId;
            const user = req.user as AppUser;

            // 1. Verify Business Ownership
            const business = await storage.getBusiness(businessId);
            if (!business) {
                return res.status(404).json({ error: "Business not found" });
            }

            if (business.userId && business.userId !== user.id) {
                return res.status(403).json({ error: "Unauthorized access to this business" });
            }

            // 2. Enforce Pro Plan
            // We allow fetching data, but the frontend will handle the "Locked" UI. 
            // However, to be strict, we could limit the data returned for free users if we wanted.
            // For now, let's return the data so the "Preview" could potentially work, 
            // or we can strictly block it. 
            // Decision: Strictly block to prevent bypassing the paywall via API.
            if (user.plan !== "pro") {
                return res.status(403).json({
                    error: "Plan Restricted",
                    message: "Trends are available only for Pro users",
                    code: "PRO_REQUIRED"
                });
            }

            // 3. Aggregate Data
            const reports = await storage.getReportsByBusinessId(businessId);

            // Sort by date ascending
            const sortedReports = reports.sort((a, b) =>
                new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime()
            );

            const trends = sortedReports.map(report => {
                const competitors = report.competitors || [];
                const ratings = competitors
                    .map(c => c.rating || 0)
                    .filter(r => r > 0);

                const avgRating = ratings.length > 0
                    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                    : 0;

                // Attempt to find the business's own rating within the competitors list
                // This assumes the business was found in the search results
                const matchingCompetitor = competitors.find(c =>
                    c.name.toLowerCase().trim() === business.name.toLowerCase().trim() ||
                    (c.address && business.address && c.address.toLowerCase().includes(business.address.toLowerCase()))
                );

                if (!matchingCompetitor) {
                    // Log for debugging (optional, remove later if noisy)
                    console.log(`[Trends] Business '${business.name}' not found in report ${report.id}. Competitors: ${competitors.map(c => c.name).join(", ")}`);
                }

                const businessRating = report.businessRating || matchingCompetitor?.rating || business.rating || null;

                return {
                    id: report.id,
                    date: report.generatedAt,
                    competitorCount: competitors.length,
                    avgRating: Number(avgRating.toFixed(2)),
                    businessRating: businessRating ? Number(businessRating) : null,
                    minRating: ratings.length > 0 ? Math.min(...ratings) : 0,
                    maxRating: ratings.length > 0 ? Math.max(...ratings) : 0
                };
            });

            res.json(trends);

        } catch (error) {
            console.error("Error fetching trends:", error);
            res.status(500).json({ error: "Failed to fetch trends" });
        }
    });
}
