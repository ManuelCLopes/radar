# Local Competitor Analyzer

## Overview
A fullstack business intelligence application that helps users analyze their local competition. Users can register their businesses, and the system generates competitor analysis reports using nearby business data and AI-powered insights.

## Current State
- MVP complete with all core features implemented
- Frontend: React + Vite with Tailwind CSS and shadcn/ui components
- Backend: Express.js with in-memory storage
- Mock Google Places API integration (ready for real API key)
- Mock AI analysis (ready for real AI service integration)

## Project Architecture

### Frontend (`client/`)
```
client/src/
├── components/
│   ├── BusinessForm.tsx    # Business registration form
│   ├── BusinessList.tsx    # List of registered businesses with actions
│   ├── ReportView.tsx      # Modal dialog for viewing reports
│   └── ThemeToggle.tsx     # Dark/light mode toggle
├── pages/
│   └── Dashboard.tsx       # Main dashboard page
├── lib/
│   └── queryClient.ts      # React Query configuration
└── App.tsx                 # Main app with routing
```

### Backend (`server/`)
```
server/
├── index.ts         # Express server entry point
├── routes.ts        # API route definitions
├── storage.ts       # In-memory storage implementation
├── googlePlaces.ts  # Google Places API integration (mock)
├── ai.ts            # AI analysis function (mock)
└── reports.ts       # Report generation logic
```

### Shared (`shared/`)
```
shared/
└── schema.ts        # TypeScript types and Zod schemas
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/businesses` | List all registered businesses |
| POST | `/api/businesses` | Register a new business |
| GET | `/api/businesses/:id` | Get a specific business |
| DELETE | `/api/businesses/:id` | Delete a business |
| POST | `/api/run-report/:id` | Generate competitor report |
| GET | `/api/reports/:businessId` | Get reports for a business |

## Data Models

### Business
- `id`: Unique identifier
- `name`: Business name
- `type`: Business type (restaurant, cafe, retail, etc.)
- `latitude`: Location latitude
- `longitude`: Location longitude
- `address`: Optional street address
- `createdAt`: Creation timestamp

### Report
- `id`: Unique identifier
- `businessId`: Associated business ID
- `businessName`: Business name
- `competitors`: Array of competitor data
- `aiAnalysis`: AI-generated analysis text
- `generatedAt`: Generation timestamp
- `html`: Full HTML report for download

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_API_KEY` | Google Places API key | No (uses mock data if not set) |

## Recent Changes
- 2025-11-29: Initial MVP implementation
  - Dashboard with business registration and listing
  - Report generation with competitor analysis
  - Dark/light theme support
  - Responsive design for all screen sizes

## User Preferences
- Clean, professional interface following Linear-style design
- Inter font for modern typography
- Blue primary color scheme (HSL 217)
- Dark mode support
