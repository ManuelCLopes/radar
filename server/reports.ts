import { randomUUID } from "crypto";
import { storage } from "./storage";
import { searchNearby } from "./googlePlaces";
import { analyzeCompetitors } from "./ai";
import type { Report, Business, InsertReport } from "@shared/schema";

export async function runReportForBusiness(businessId: string, language: string = "en"): Promise<Report> {
  const business = await storage.getBusiness(businessId);
  
  if (!business) {
    throw new Error(`Business with ID ${businessId} not found`);
  }

  const competitors = await searchNearby(
    business.latitude,
    business.longitude,
    business.type,
    1500
  );

  const aiAnalysis = await analyzeCompetitors(business, competitors, language);

  const html = generateReportHTML(business, competitors, aiAnalysis);

  const insertReport: InsertReport = {
    businessId: business.id,
    businessName: business.name,
    competitors,
    aiAnalysis,
    html,
  };

  const report = await storage.saveReport(insertReport);

  return report;
}

function generateReportHTML(
  business: Business,
  competitors: { name: string; address: string; rating?: number; userRatingsTotal?: number }[],
  aiAnalysis: string
): string {
  const competitorRows = competitors
    .map(
      (c) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${c.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${c.address}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${c.rating ? c.rating.toFixed(1) : 'N/A'}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${c.userRatingsTotal || 'N/A'}</td>
      </tr>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Competitor Analysis Report - ${business.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      padding: 40px 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 40px;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 8px;
    }
    .header p {
      opacity: 0.9;
      font-size: 14px;
    }
    .content {
      padding: 40px;
    }
    .section {
      margin-bottom: 32px;
    }
    .section h2 {
      font-size: 20px;
      color: #1f2937;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #2563eb;
    }
    .stat-card .label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    th {
      background: #f9fafb;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
    }
    .analysis-box {
      background: #eff6ff;
      border-left: 4px solid #2563eb;
      padding: 24px;
      border-radius: 0 8px 8px 0;
      white-space: pre-wrap;
      font-size: 14px;
      line-height: 1.8;
    }
    .footer {
      text-align: center;
      padding: 24px;
      background: #f9fafb;
      color: #6b7280;
      font-size: 12px;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Competitor Analysis Report</h1>
      <p>${business.name} | ${business.type.charAt(0).toUpperCase() + business.type.slice(1)} | Generated: ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="content">
      <div class="section">
        <h2>Overview</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="value">${competitors.length}</div>
            <div class="label">Competitors Found</div>
          </div>
          <div class="stat-card">
            <div class="value">${competitors.filter(c => c.rating).length > 0 
              ? (competitors.filter(c => c.rating).reduce((sum, c) => sum + (c.rating || 0), 0) / competitors.filter(c => c.rating).length).toFixed(1)
              : 'N/A'}</div>
            <div class="label">Avg. Rating</div>
          </div>
          <div class="stat-card">
            <div class="value">${competitors.reduce((sum, c) => sum + (c.userRatingsTotal || 0), 0).toLocaleString()}</div>
            <div class="label">Total Reviews</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Nearby Competitors</h2>
        ${competitors.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th style="text-align: center;">Rating</th>
              <th style="text-align: center;">Reviews</th>
            </tr>
          </thead>
          <tbody>
            ${competitorRows}
          </tbody>
        </table>
        ` : '<p style="color: #6b7280;">No competitors found in the nearby area.</p>'}
      </div>

      <div class="section">
        <h2>AI Analysis</h2>
        <div class="analysis-box">${aiAnalysis}</div>
      </div>
    </div>

    <div class="footer">
      <p>Generated by Local Competitor Analyzer | ${new Date().toISOString()}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
