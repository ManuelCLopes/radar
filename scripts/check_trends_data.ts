
import "dotenv/config";
import { db } from "../server/db";
import { businesses, reports } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Checking trends data matching...");

    const allBusinesses = await db.select().from(businesses).limit(5);

    for (const business of allBusinesses) {
        console.log(`\nBusiness: ${business.name} (ID: ${business.id})`);

        const businessReports = await db.select().from(reports).where(eq(reports.businessId, business.id));
        console.log(`Found ${businessReports.length} reports.`);

        for (const report of businessReports) {
            const competitors = report.competitors as any[];
            const match = competitors.find(c =>
                c.name.toLowerCase().trim() === business.name.toLowerCase().trim() ||
                (c.address && business.address && c.address.toLowerCase().includes(business.address.toLowerCase()))
            );

            if (match) {
                console.log(`  [MATCH FOUND] Report ${report.id.slice(0, 8)}: Rating ${match.rating}`);
            } else {
                console.log(`  [NO MATCH] Report ${report.id.slice(0, 8)}. Competitors: ${competitors.map(c => c.name).join(", ")}`);
            }
        }
    }
    process.exit(0);
}

main().catch(console.error);
