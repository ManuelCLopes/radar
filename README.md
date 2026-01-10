<div align="center">
  <img src="client/public/logo-dark.png" alt="Competitor Watcher Logo" width="200" />
</div>

# 🎯 Competitor Watcher

**AI-powered local competitor analysis platform**

Competitor Watcher helps businesses understand their competitive landscape by analyzing nearby competitors using Google Places data and AI-driven insights. Register your business, generate comprehensive reports, and make data-driven decisions to stay ahead of the competition.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

---

## ✨ Features

### 🔍 Competitor Analysis
- **Real-time competitor discovery** using Google Places API
- **Detailed competitor profiles** with ratings, reviews, and contact information
- **Geographic visualization** of competitors on interactive maps
- **Advanced AI insights** including SWOT Analysis, Market Trends, Target Audience Persona, and Marketing Strategy

### 🎨 Modern User Experience
- **Beautiful, responsive UI** with dark mode support
- **Multi-language support** (English, Portuguese, Spanish, French, German)
- **Real-time updates** and interactive dashboards
- **High-fidelity Export** (HTML with Tailwind CSS, PDF) for professional reports

### 🔐 Flexible Authentication
- **Email/Password authentication** with secure bcrypt hashing
- **Google OAuth integration** for seamless sign-in
- **Session management** with PostgreSQL or in-memory storage
- **User profiles** with customizable settings

### 📊 Business Management
- **Multiple business registration** with location verification
- **Report history tracking** for trend analysis
- **Business type categorization** (restaurants, cafes, retail, etc.)
- **Address validation** using Google Geocoding API

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** (optional - uses in-memory storage by default)
- **Google Places API key** (optional - uses mock data by default)

### Installation

```bash
# Clone the repository
git clone https://github.com/ManuelCLopes/radar.git
cd radar

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development server
npm run dev
```

The application will be available at `http://127.0.0.1:5000`

### First Steps

1. **Create an account** at `/register`
2. **Register your business** with name, type, and address
3. **Generate a report** to see nearby competitors
4. **Explore insights** and export your analysis

---

## 🛠️ Configuration

All environment variables are **optional**. The application works out-of-the-box with sensible defaults.

### Essential Configuration

For real competitor data, configure Google Places API:

```bash
# .env
GOOGLE_PLACES_API_KEY=your_api_key_here
```

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed setup instructions.

### Full Configuration

```bash
# Google Places API (for real competitor data)
GOOGLE_PLACES_API_KEY=

# OpenAI API (for AI-powered analysis)
OPENAI_API_KEY=

# Database (for data persistence)
DATABASE_URL=postgresql://user:password@localhost:5432/competitor_watcher

# Google OAuth (for "Sign in with Google")
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://127.0.0.1:5000/api/auth/google/callback

# Session Secret (for secure sessions)
SESSION_SECRET=
```

---

## 📁 Project Structure

```
competitor-watcher/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and helpers
│   │   └── i18n/          # Internationalization
├── server/                # Express backend
│   ├── auth.ts           # Authentication logic
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # Data persistence layer
│   ├── ai.ts             # AI analysis engine
│   └── index.ts          # Server entry point
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema (Drizzle ORM)
└── db/                   # Database migrations
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/register` - Create new account
- `POST /api/login` - Email/password login
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/logout` - End session
- `GET /api/auth/user` - Get current user

### Business Management
- `GET /api/businesses` - List user's businesses
- `POST /api/businesses` - Register new business
- `DELETE /api/businesses/:id` - Delete business

### Reports
- `POST /api/run-report/:businessId` - Generate competitor analysis
- `GET /api/reports/business/:businessId` - Get report history

---

## 🏗️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TanStack Query** for data fetching and caching
- **Wouter** for lightweight routing
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **i18next** for internationalization

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Drizzle ORM** for database operations
- **Passport.js** for authentication
- **PostgreSQL** for data persistence
- **OpenAI API** for AI analysis
- **Google Places API** for competitor data

### Development
- **ESLint** for code linting
- **Prettier** for code formatting
- **tsx** for TypeScript execution

---

## 🧪 Development

### Running Locally

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Check TypeScript types
npm run check
```

### Running Tests

```bash
# Run all tests
npm test

# Run speicific test file
npm test client/src/components/__tests__/ReportView.test.tsx

### End-to-End (E2E) Tests

We use **Playwright** for E2E testing.

```bash
# Install Playwright browsers (first run only)
npx playwright install

# Run all E2E tests non-interactively
npx playwright test

# Run E2E tests with UI mode (great for debugging)
npx playwright test --ui

# Run specific E2E test file
npx playwright test e2e/seo-accessibility.spec.ts
```
```

### Database Setup

```bash
# Install PostgreSQL (Mac)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb competitor_watcher

# Add to .env
DATABASE_URL=postgresql://your_username@localhost:5432/competitor_watcher
```

### Environment Modes

The application adapts based on available configuration:

- **Minimal** (no config): In-memory storage, mock data, email/password auth
- **Standard** (Places API): Real competitor data, in-memory storage
- **Full** (all APIs + DB): Complete feature set with persistence

---

## 🌍 Internationalization

Competitor Watcher supports 5 languages:

- 🇬🇧 English (EN)
- 🇵🇹 Portuguese (PT)
- 🇪🇸 Spanish (ES)
- 🇫🇷 French (FR)
- 🇩🇪 German (DE)

Language files are located in `client/src/i18n/locales/`.

---

## 📚 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Detailed setup instructions
- **[.env.example](./.env.example)** - Environment variables reference

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Places API** for competitor data
- **OpenAI** for AI-powered analysis
- **shadcn/ui** for beautiful UI components
- **Drizzle ORM** for type-safe database operations

---

## 📞 Support

For issues, questions, or suggestions:

- 📧 Open an issue on [GitHub](https://github.com/ManuelCLopes/radar/issues)
- 📖 Check the [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- 🔍 Review existing issues and discussions

---

<div align="center">
  <strong>Built with ❤️ for local businesses</strong>
</div>
