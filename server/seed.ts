import { storage } from "./storage";
import bcrypt from "bcrypt";

export async function seed() {
    try {
        console.log("Seeding: Starting rich data generation...");

        // Helper to get random date in last X days
        const randomDate = (daysAgo: number) => {
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
            // Random time
            date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
            return date;
        };

        // Helper to get random item
        const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

        // 1. Create Users
        const usersToCreate = [
            { email: "teste@teste.pt", plan: "free", firstName: "Teste", lastName: "User", role: "user" },
            { email: "admin@example.com", plan: "free", role: "admin", firstName: "Admin", lastName: "User" }
        ];

        // Add 50 random users distributed over 30 days
        for (let i = 0; i < 50; i++) {
            usersToCreate.push({
                email: `user${i}@example.com`,
                plan: "free",
                role: "user",
                firstName: `User${i}`,
                lastName: "Generated",
                createdAt: randomDate(30) // This needs support in upsertUser or we just let it be now() and manual update?
                // upsertUser uses ...userData, so if we pass createdAt (which is in UpsertUser type), it should work if we cast or ensure type
            } as any);
        }

        let mainUser;
        const password = "123123";
        const hashedPassword = await bcrypt.hash(password, 10);

        for (const u of usersToCreate) {
            let user = await storage.getUserByEmail(u.email);
            if (!user) {
                user = await storage.upsertUser({
                    email: u.email,
                    passwordHash: hashedPassword,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    plan: u.plan,
                    role: u.role || "user",
                    provider: "local",
                    createdAt: (u as any).createdAt || new Date()
                } as any);
                if (u.email === "teste@teste.pt" || u.email === "admin@example.com") {
                    console.log(`Seeding: Created ${u.role} ${u.email}`);
                }
            }
            if (u.email === "admin@example.com") mainUser = user;
        }

        const adminUser = mainUser!;

        // 2. Create Searches (Historical data for charts)
        // We need to bypass trackSearch if it doesn't allow overriding createdAt,
        // but trackSearch takes InsertSearch. InsertSearch (schema) has createdAt defaultNow().
        // We can pass it if we cast or if schema allows.
        // Let's assume storage.trackSearch pushes to DB directly.
        // We will mock searches directly via db insert if available, or just use storage with a trick.
        // Since we can't easily access db directly efficiently here without imports, we'll try to use storage methods
        // assuming they pass the full object.
        // Wait, DatabaseStorage.trackSearch implementation likely uses `values(search)`.

        const locations = ["Lisbon", "Porto", "Faro", "Coimbra", "Braga", "Aveiro", "Lagos"];
        const types = ["restaurant", "gym", "cafe", "retail", "hotel"];

        console.log("Seeding: Generating searches...");
        if (storage.trackSearch) {
            for (let i = 0; i < 150; i++) {
                const date = randomDate(30);
                await storage.trackSearch({
                    userId: adminUser.id,
                    type: randomItem(types),
                    address: randomItem(locations),
                    radius: 1000,
                    latitude: 38.7 + (Math.random() - 0.5),
                    longitude: -9.1 + (Math.random() - 0.5),
                    competitorsFound: Math.floor(Math.random() * 20),
                    createdAt: date // We'll try passing this
                } as any);
            }
        }

        // 3. Create Reports
        console.log("Seeding: Generating reports...");
        for (let i = 0; i < 40; i++) {
            const date = randomDate(30);
            const type = randomItem(types);
            await storage.createReport({
                userId: adminUser.id,
                businessName: `${type} in ${randomItem(locations)}`,
                competitors: [],
                aiAnalysis: "Generated historical analysis...",
                generatedAt: date
            } as any);
        }

        console.log("Seeding: Completed!");

    } catch (error) {
        console.error("Seeding failed:", error);
    }
}
