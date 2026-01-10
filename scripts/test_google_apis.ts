
import * as dotenv from "dotenv";
import path from "path";
import fetch from "node-fetch";

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function testGoogleApis() {
    console.log("-----------------------------------------");
    console.log("🗺️  Testing Google API Connection");
    console.log("-----------------------------------------");

    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        console.error("❌ Error: GOOGLE_API_KEY not set in .env");
        process.exit(1);
    }

    console.log(`API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);

    // 1. Test Static Maps API
    console.log("\nTesting Static Maps API...");
    const center = "40.65,-7.91"; // Viseu, Portugal
    const url = `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=14&size=600x400&scale=2&maptype=roadmap&key=${apiKey}`;

    try {
        const response = await fetch(url);

        if (response.ok) {
            console.log("✅ Static Maps API: Success (200 OK)");
            console.log(`   Content-Type: ${response.headers.get("content-type")}`);
            console.log(`   Size: ${response.headers.get("content-length")} bytes`);
        } else {
            console.error(`❌ Static Maps API: Failed (${response.status} ${response.statusText})`);
            const text = await response.text();
            console.error(`   Response: ${text}`);
        }

    } catch (error: any) {
        console.error("❌ Static Maps API: Network Error");
        console.error(error);
    }

    // 2. Test Places API (Text Search) - simpler check
    console.log("\nTesting Places API (Text Search)...");
    try {
        const placesUrl = "https://places.googleapis.com/v1/places:searchText";
        const placesResponse = await fetch(placesUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": "places.displayName"
            },
            body: JSON.stringify({
                textQuery: "Pingo Doce Viseu",
                maxResultCount: 1
            })
        });

        if (placesResponse.ok) {
            console.log("✅ Places API: Success (200 OK)");
            const data = await placesResponse.json();
            console.log("   Result:", JSON.stringify(data, null, 2));
        } else {
            console.error(`❌ Places API: Failed (${placesResponse.status} ${placesResponse.statusText})`);
            const text = await placesResponse.text();
            console.error(`   Response: ${text}`);
        }
    } catch (error: any) {
        console.error("❌ Places API: Network Error");
        console.error(error);
    }

    console.log("-----------------------------------------");
}

testGoogleApis();
