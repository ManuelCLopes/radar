# Local Competitor Analyzer

## Overview
A fullstack business intelligence application that helps users analyze their local competition. Users can register their businesses, and the system generates competitor analysis reports using nearby business data and AI-powered insights.

## Current State
- Full-featured production-ready application
- Frontend: React + Vite with Tailwind CSS and shadcn/ui components
- Backend: Express.js with PostgreSQL database persistence (optional for local dev)
- Authentication: Google OAuth + Email/Password
- Google Places API integration (with fallback to mock data)
- OpenAI integration for AI-powered competitor analysis
- Automated weekly report generation via cron scheduler
- Multi-language support (English, Portuguese, Spanish, French, German)

## Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- (Optional) PostgreSQL database for persistent storage

### Installation Steps

1. **Clone the repository**
   ```bash
   cd /path/to/radar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables (optional)**
   
   Create a `.env` file in the root directory:
   ```bash
   # Optional: PostgreSQL database (uses in-memory storage if not set)
   DATABASE_URL=postgresql://user:password@localhost:5432/radar

   # Optional: Google OAuth (required for Google login)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://127.0.0.1:5000/api/auth/google/callback

   # Optional: Google Places API (uses mock data if not set)
   GOOGLE_API_KEY=your_google_api_key

   # Optional: OpenAI API (uses fallback analysis if not set)
   AI_INTEGRATIONS_OPENAI_API_KEY=your_openai_api_key

   # Optional: Session secret (auto-generated if not set)
   SESSION_SECRET=your_session_secret
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open your browser to `http://127.0.0.1:5000`
   - Register a new account at `http://127.0.0.1:5000/register`
   - Or login at `http://127.0.0.1:5000/login`

### Local Development Notes

- **No Database?** The app uses in-memory storage by default. Data will be lost when the server restarts.
- **No Google OAuth?** You can still use email/password authentication.
- **No Google Places API?** The app will use mock competitor data.
- **No OpenAI API?** The app will generate fallback analysis reports.

### Setting Up Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set application type to "Web application"
6. Add authorized redirect URI: `http://127.0.0.1:5000/api/auth/google/callback`
7. Copy the Client ID and Client Secret to your `.env` file

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
│   ├── Dashboard.tsx         # Main dashboard page
│   ├── LandingPage.tsx       # Commercial landing page (Portuguese)
│   ├── LandingPage.css       # Landing page styles
│   ├── LoginPage.tsx         # Login page
│   └── RegisterPage.tsx      # Registration page
├── lib/
│   └── queryClient.ts        # React Query configuration
└── App.tsx                   # Main app with routing
```

### Backend (`server/`)
```
server/
├── index.ts         # Express server entry point
├── routes.ts        # API route definitions
├── auth.ts          # Authentication (Google OAuth + Email/Password)
├── db.ts            # PostgreSQL database connection
├── storage.ts       # Database storage implementation (DB + in-memory)
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

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register with email/password |
| POST | `/api/login` | Login with email/password |
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| POST | `/api/logout` | Logout |
| GET | `/api/auth/user` | Get current user |

### Business & Reports
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

### User
- `id`: Unique identifier (auto-generated)
- `email`: User email (unique, required)
- `passwordHash`: Hashed password (for local auth)
- `provider`: Authentication provider ('local' or 'google')
- `firstName`: User's first name
- `lastName`: User's last name
- `profileImageUrl`: Profile image URL (from Google)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Business
- `id`: Unique identifier (auto-generated)
- `name`: Business name
- `type`: Business type (restaurant, cafe, retail, etc.)
- `latitude`: Location latitude (nullable for pending businesses)
- `longitude`: Location longitude (nullable for pending businesses)
- `address`: Optional street address
- `locationStatus`: Location verification status ('validated' | 'pending')
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
| `DATABASE_URL` | PostgreSQL connection string | No (uses in-memory storage) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No (email/password still works) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL | No |
| `GOOGLE_API_KEY` | Google Places API key | No (uses mock data) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API key | No (uses fallback analysis) |
| `SESSION_SECRET` | Session encryption secret | No (auto-generated) |

## Features

### Authentication
- Email/password registration and login
- Google OAuth integration
- Secure password hashing with bcrypt
- Session-based authentication
- Protected routes

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

- 2025-12-02: Authentication system replacement
  - Replaced Replit Auth with Google OAuth + Email/Password
  - Added login and registration pages
  - Implemented bcrypt password hashing
  - Updated database schema with passwordHash and provider fields
  - Added in-memory storage fallback for local development
  - Auth routes: /login, /register, /api/auth/google, /api/logout

- 2025-12-02: Local development improvements
  - Made database optional (in-memory storage fallback)
  - Made OpenAI API optional (fallback analysis)
  - Made Google Places API optional (mock data)
  - Fixed server binding to work on macOS (127.0.0.1)
  - Added comprehensive local setup documentation

- 2025-11-29: Price level and enhanced AI analysis features
  - Added price level display ($ to $$$$) to competitor cards and HTML reports
  - Enhanced AI analysis with review theme insights (service, price, ambience, speed, quality)
  - AI now provides 3-5 practical recommendations for the next month
  - Mock data generator includes randomized price levels for testing

- 2025-11-29: Commercial landing page in Portuguese
  - Created LandingPage.tsx with 8 sections: Hero, How It Works, Report Features, Sample, Audience, Pricing, FAQ, CTA
  - Landing page is now the default route ("/")
  - Dashboard moved to "/dashboard" route
  - Mobile-responsive design with custom CSS styling

## User Preferences
- Clean, professional interface following Linear-style design
- Inter font for modern typography
- Blue primary color scheme (HSL 217)
- Dark mode support
- No emojis in UI (uses text/icons only)
