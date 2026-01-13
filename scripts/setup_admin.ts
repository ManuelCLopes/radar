
import "dotenv/config";
import { storage } from "../server/storage";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq, inArray } from "drizzle-orm";
import bcrypt from "bcrypt";

async function main() {
    console.log("Starting security cleanup and admin setup...");

    // 1. Delete insecure test users
    const usersToDelete = [
        "teste@teste.pt",
        "professional@teste.pt",
        "agency@teste.pt",
        "essential@teste.pt"
    ];

    console.log(`Deleting users: ${usersToDelete.join(", ")}`);

    // Note: storage.deleteUser is available but deletes one by one and cascades. 
    // We can use it to ensure clean deletion.
    for (const email of usersToDelete) {
        const user = await storage.getUserByEmail(email);
        if (user) {
            await storage.deleteUser(user.id);
            console.log(`Deleted user: ${email}`);
        } else {
            console.log(`User not found: ${email}`);
        }
    }

    // 2. Create/Update Admin User
    const adminEmail = "admin@example.com";
    console.log(`Setting up admin user: ${adminEmail}`);

    let adminUser = await storage.getUserByEmail(adminEmail);
    const tempPassword = "password123"; // Temporary password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    if (adminUser) {
        // Update existing user to be admin
        console.log("User exists. Updating role to admin...");
        // Direct DB update to ensure role (since upsert might not update role if I blindly call it without changing logic)
        // Actually upsertUser in storage.ts updates everything if we pass it.
        // But let's verify if upsertUser allows updating role. 
        // Looking at storage.ts, upsertUser uses ...userData.

        await storage.upsertUser({
            ...adminUser,
            role: "admin",
            passwordHash: hashedPassword, // Resetting password to ensure access
        });
        console.log(`Admin user updated. Password set to: ${tempPassword}`);
    } else {
        // Create new admin user
        console.log("Creating new admin user...");
        await storage.upsertUser({
            email: adminEmail,
            passwordHash: hashedPassword,
            role: "admin",
            plan: "free",
            firstName: "Admin",
            lastName: "User",
            provider: "local",
            language: "en"
        });
        console.log(`Admin user created. Password: ${tempPassword}`);
    }

    console.log("Done.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
