# Local Competitor Analyzer

## Overview
A fullstack business intelligence application that helps users analyze their local competition. Users can register their businesses, and the system generates competitor analysis reports using nearby business data and AI-powered insights.

## Current State
- Full-featured production-ready application
- Frontend: React + Vite with Tailwind CSS and shadcn/ui components
- Backend: Express.js with PostgreSQL database persistence
- Google Places API integration (with fallback to mock data)
- OpenAI integration for AI-powered competitor analysis (via Replit AI Integrations)
- Automated weekly report generation via cron scheduler
- Multi-language support (English, Portuguese, Spanish, French, German)

## Project Architecture

### Frontend (`client/`)
```
client/src/
├── components/
│   ├── BusinessForm.tsx      # Business registration form
│   ├── BusinessList.tsx      # List of registered businesses with actions
│   ├── ReportView.tsx        # Modal dialog for viewing/exporting reports
│   ├── ReportHistory.tsx     # Dialog for viewing past reports
│   ├── ThemeToggle.tsx       # Dark/light mode toggle
│   └── LanguageSelector.tsx  # Language selection dropdown
├── i18n/
│   ├── index.ts              # i18n configuration
│   └── locales/
│       ├── en/common.json    # English translations
│       ├── pt/common.json    # Portuguese translations
│       ├── es/common.json    # Spanish translations
│       ├── fr/common.json    # French translations
│       └── de/common.json    # German translations
├── pages/
│   └── Dashboard.tsx         # Main dashboard page
├── lib/
│   └── queryClient.ts        # React Query configuration
└── App.tsx                   # Main app with routing
```

### Backend (`server/`)
```
server/
├── index.ts         # Express server entry point
├── routes.ts        # API route definitions
├── db.ts            # PostgreSQL database connection
├── storage.ts       # Database storage implementation
├── googlePlaces.ts  # Google Places API integration
├── ai.ts            # OpenAI competitor analysis
├── reports.ts       # Report generation logic
└── scheduler.ts     # Cron job for automated reports
```

### Shared (`shared/`)
```
shared/
└── schema.ts        # TypeScript types, Zod schemas, and Drizzle ORM models
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/businesses` | List all registered businesses |
| POST | `/api/businesses` | Register a new business |
| GET | `/api/businesses/:id` | Get a specific business |
| DELETE | `/api/businesses/:id` | Delete a business |
| POST | `/api/run-report/:id` | Generate competitor report |
| GET | `/api/reports/business/:businessId` | Get reports for a business |
| GET | `/api/scheduler/status` | Get scheduler status |
| POST | `/api/scheduler/trigger` | Manually trigger scheduled reports |

## Data Models

### Business
- `id`: Unique identifier (auto-generated)
- `name`: Business name
- `type`: Business type (restaurant, cafe, retail, etc.)
- `latitude`: Location latitude
- `longitude`: Location longitude
- `address`: Optional street address
- `createdAt`: Creation timestamp

### Report
- `id`: Unique identifier (auto-generated)
- `businessId`: Associated business ID
- `businessName`: Business name
- `competitors`: Array of competitor data (JSON)
- `aiAnalysis`: AI-generated analysis text
- `generatedAt`: Generation timestamp
- `html`: Full HTML report for download

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `GOOGLE_API_KEY` | Google Places API key | No (uses mock data if not set) |

## Features

### Core Features
- Business registration with location coordinates
- Competitor discovery via Google Places API
- AI-powered competitive analysis
- Interactive report viewing with competitor cards
- Report history with past report access

### Export Options
- Download as HTML file
- Print / Save as PDF (browser print dialog)
- Email report summary (opens email client)

### Automation
- Weekly scheduled reports (runs every Monday at 6 AM)
- Manual trigger endpoint for on-demand scheduling
- Status endpoint to monitor scheduler health

## Recent Changes
- 2025-11-29: Address-driven registration with geolocation fallback
  - Replaced manual lat/lng entry with address search powered by Google Places API
  - Added interactive address validation with multiple result selection modal
  - When Places API unavailable, browser geolocation provides valid coordinates
  - Backend enforces coordinate validation (valid ranges, non-zero, finite numbers)
  - Clear error messages and guidance when location methods fail
  - All 16 business types properly translated across 5 languages
  - Note: If both address validation and geolocation fail, users must retry with a more specific address or enable location permissions

- 2025-11-29: Multi-language support (i18n) implementation
  - Added react-i18next for internationalization
  - Created translation files for 5 languages (EN, PT, ES, FR, DE)
  - Language selector in header with language code abbreviations
  - AI analysis generated in user's selected language
  - All UI text uses translation keys for consistent localization
  - Language preference persisted in localStorage

- 2025-11-29: Full feature implementation
  - PostgreSQL database persistence for all data
  - OpenAI integration via Replit AI Integrations
  - Google Places API with location-based competitor search
  - Report history UI for viewing past reports
  - Automated weekly report generation (cron scheduler)
  - Export dropdown with HTML, PDF, and email options

## User Preferences
- Clean, professional interface following Linear-style design
- Inter font for modern typography
- Blue primary color scheme (HSL 217)
- Dark mode support
- No emojis in UI (uses text/icons only)
