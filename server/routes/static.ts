import type { Express } from "express";

export function registerStaticRoutes(app: Express) {
    // Proxy for Google Static Maps to avoid exposing API key
    app.get("/api/static-map", async (req, res) => {
        const { center, markers } = req.query;
        const apiKey = process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            return res.status(500).send("Google API Key not configured");
        }

        if (!center) {
            return res.status(400).send("Center is required");
        }

        // Construct the Google Static Maps URL
        // Size: 600x400 (standard for PDF)
        // Scale: 2 (for high DPI)
        // Maptype: roadmap
        let url = `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=14&size=600x400&scale=2&maptype=roadmap&key=${apiKey}`;

        // Add main business marker (blue)
        url += `&markers=color:blue|${center}`;

        // Add competitor markers (red)
        if (markers) {
            const markerList = (markers as string).split('|');
            markerList.forEach(marker => {
                url += `&markers=color:red|size:small|${marker}`;
            });
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Google Maps API error: ${response.statusText}`);
            }

            const buffer = await response.arrayBuffer();
            res.setHeader("Content-Type", "image/png");
            res.send(Buffer.from(buffer));
        } catch (error) {
            console.error("Error fetching static map:", error);
            res.status(500).send("Failed to fetch map");
        }
    });

    // Debug Endpoint for Connectivity with strict timeout
    app.get("/api/debug-connectivity", async (req, res) => {
        const net = await import("net");
        const results: any[] = [];
        const targets = [
            { host: "smtp.gmail.com", port: 587 },
            { host: "smtp.gmail.com", port: 465 },
            { host: "google.com", port: 443 }
        ];

        for (const target of targets) {
            const start = Date.now();
            try {
                await new Promise<void>((resolve, reject) => {
                    const socket = new net.Socket();
                    socket.setTimeout(3000); // 3s timeout

                    socket.on("connect", () => {
                        const time = Date.now() - start;
                        results.push({ ...target, status: "success", time: `${time}ms` });
                        socket.destroy();
                        resolve();
                    });

                    socket.on("timeout", () => {
                        results.push({ ...target, status: "timeout", time: ">3000ms" });
                        socket.destroy();
                        resolve(); // Don't fail the whole request
                    });

                    socket.on("error", (err) => {
                        results.push({ ...target, status: "error", error: err.message });
                        socket.destroy();
                        resolve();
                    });

                    socket.connect(target.port, target.host);
                });
            } catch (err) {
                results.push({ ...target, status: "failed", error: String(err) });
            }
        }

        res.json({
            timestamp: new Date(),
            results,
            env: {
                NODE_ENV: process.env.NODE_ENV,
                EMAIL_HOST: process.env.EMAIL_HOST || process.env.SMTP_HOST || "not set"
            }
        });
    });

    // SEO Endpoints
    app.get("/robots.txt", (req, res) => {
        res.type("text/plain");
        res.send(`User-agent: *
Allow: /
Allow: /auth
Allow: /login
Allow: /register
Disallow: /dashboard
Disallow: /api/

Sitemap: https://competitorwatcher.pt/sitemap.xml
    `);
    });

    app.get("/sitemap.xml", (req, res) => {
        res.type("application/xml");
        res.send(`<? xml version = "1.0" encoding = "UTF-8" ?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" >
      <url>
      <loc>https://competitorwatcher.pt/</loc>
  <changefreq>weekly </changefreq>
    < priority > 1.0 </priority>
    </url>
    < url >
    <loc>https://competitorwatcher.pt/login</loc>
  <changefreq>monthly </changefreq>
    < priority > 0.8 </priority>
    </url>
    < url >
    <loc>https://competitorwatcher.pt/register</loc>
  <changefreq>monthly </changefreq>
    < priority > 0.8 </priority>
    </url>
    </urlset>
      `);
    });
}
