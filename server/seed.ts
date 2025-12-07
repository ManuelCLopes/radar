import { storage } from "./storage";
import bcrypt from "bcrypt";

export async function seed() {
    try {
        const email = "teste@teste.pt";
        const password = "123123";

        // 1. Create Users
        const usersToCreate = [
            { email: "teste@teste.pt", plan: "professional", firstName: "Teste", lastName: "User" }, // Keeping original as professional for backward compat or update it
            { email: "professional@teste.pt", plan: "professional", firstName: "Pro", lastName: "User" },
            { email: "agency@teste.pt", plan: "agency", firstName: "Agency", lastName: "User" },
            { email: "essential@teste.pt", plan: "essential", firstName: "Essential", lastName: "User" }
        ];

        let mainUser;

        for (const u of usersToCreate) {
            let user = await storage.getUserByEmail(u.email);
            if (!user) {
                console.log(`Seeding: Creating user ${u.email}...`);
                const hashedPassword = await bcrypt.hash(password, 10);
                user = await storage.upsertUser({
                    email: u.email,
                    passwordHash: hashedPassword,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    plan: u.plan,
                    provider: "local"
                });
                console.log(`Seeding: User ${u.email} created`);
            } else {
                console.log(`Seeding: User ${u.email} already exists`);
            }
            if (u.email === "teste@teste.pt") mainUser = user;
        }

        const user = mainUser!; // Keep reference for reports below

        // 2. Create Business
        const businessData = {
            name: "Restaurante Teste",
            type: "restaurant" as const,
            address: "Av. da Liberdade, Lisboa",
            latitude: 38.7191,
            longitude: -9.1438,
            locationStatus: "validated" as const
        };

        const businesses = await storage.listBusinesses();
        let business = businesses.find(b => b.name === businessData.name);

        if (!business) {
            console.log("Seeding: Creating test business...");
            business = await storage.addBusiness(businessData);
            console.log("Seeding: Business created");
        } else {
            console.log("Seeding: Test business already exists");
        }

        // 3. Create Reports (only if none exist for this business/user to avoid spamming on every restart)
        const userReports = await storage.getReportsByUserId(user.id);
        if (userReports.length === 0) {
            console.log("Seeding: Creating test reports...");

            const report1 = {
                businessId: business.id,
                businessName: business.name,
                userId: user.id,
                competitors: [
                    { name: "Competitor A", address: "Nearby St 1", rating: 4.5, userRatingsTotal: 100, priceLevel: "$$" },
                    { name: "Competitor B", address: "Nearby St 2", rating: 4.0, userRatingsTotal: 50, priceLevel: "$" }
                ],
                aiAnalysis: "Test analysis for business. The location is great and competitors are few.",
                html: "<h1>Test Report</h1><p>Content</p>"
            };
            await storage.createReport(report1);

            const report2 = {
                businessId: null,
                businessName: "Rua Augusta, Lisboa",
                userId: user.id,
                competitors: [
                    { name: "Cafe Central", address: "Rua Augusta 10", rating: 4.8, userRatingsTotal: 200, priceLevel: "$$" }
                ],
                aiAnalysis: "Ad-hoc analysis for Rua Augusta. High foot traffic area.",
                html: "<h1>Ad-hoc Report</h1><p>Content</p>"
            };
            await storage.createReport(report2);
            console.log("Seeding: Reports created");
        } else {
            console.log("Seeding: Reports already exist");
        }

    } catch (error) {
        console.error("Seeding failed:", error);
    }
}
