# 🚀 Setup Guide - Radar Local

This guide helps you configure the application to test with real data.

## 📋 Table of Contents

1. [Quick Setup (Recommended)](#quick-setup)
2. [Google Places API](#google-places-api)
3. [OpenAI API (Optional)](#openai-api)
4. [PostgreSQL Database (Optional)](#postgresql-database)
5. [Google OAuth (Optional)](#google-oauth)
6. [Testing with Real Businesses](#testing-with-real-businesses)

---

## Quick Setup

**Minimum required for real competitor data:**

### 1. Copy environment file
```bash
cp .env.example .env
```

### 2. Get Google Places API Key

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: "Radar Local" (or your choice)
4. Click "Create"

#### Step 2: Enable Required APIs
1. In the sidebar, go to **APIs & Services** → **Library**
2. Search and enable:
   - **Places API** (click "Enable")
   - **Geocoding API** (click "Enable")

#### Step 3: Create API Key
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **API key**
3. Copy the generated API key
4. (Recommended) Click "RESTRICT KEY":
   - **Application restrictions**: None (for local development)
   - **API restrictions**: Restrict key
   - Select: Places API, Geocoding API
   - Click "Save"

#### Step 4: Add to .env
Open the `.env` file and add:
```bash
GOOGLE_PLACES_API_KEY=your_api_key_here
```

### 3. Restart the Server
```bash
npm run dev
```

✅ **Done!** You can now test with real businesses.

---

## Google Places API

### Costs
- **Free**: $200 monthly credits
- **Places API**: ~$17 per 1000 searches
- **Geocoding API**: ~$5 per 1000 geocodes

With the free $200, you can make **~10,000 searches/month** at no cost!

### Configure Billing Alerts
1. In Google Cloud Console, go to **Billing** → **Budgets & alerts**
2. Create a budget of $10-20
3. Set alerts for 50%, 90%, 100%

---

## OpenAI API

For advanced AI analysis of competitors.

### 1. Get API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account (if you don't have one)
3. Go to **API keys** → **Create new secret key**
4. Copy the key (you won't be able to see it again!)

### 2. Add to .env
```bash
OPENAI_API_KEY=sk-...
```

### Costs
- **GPT-4o-mini**: ~$0.15 per 1M input tokens
- **Typical analysis**: ~$0.01 per report

**Without OpenAI**: The app uses basic automatic analysis (free).

---

## PostgreSQL Database

For data persistence (optional - without this, data is lost on restart).

### Mac (Homebrew)

#### 1. Install PostgreSQL
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### 2. Create Database
```bash
createdb radar
```

#### 3. Add to .env
```bash
DATABASE_URL=postgresql://your_username@localhost:5432/radar
```

### Verify Connection
```bash
psql radar
# If it connects successfully, type \q to exit
```

### Alternative: Docker
```bash
docker run --name radar-postgres \
  -e POSTGRES_DB=radar \
  -e POSTGRES_PASSWORD=radar123 \
  -p 5432:5432 \
  -d postgres:15

# .env
DATABASE_URL=postgresql://postgres:radar123@localhost:5432/radar
```

---

## Google OAuth

To enable "Sign in with Google".

### 1. Configure OAuth Consent Screen
1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** → Create
3. Fill in:
   - App name: "Radar Local"
   - User support email: your_email@example.com
   - Developer contact: your_email@example.com
4. Click "Save and Continue"
5. Scopes: Leave empty → "Save and Continue"
6. Test users: Add your email → "Save and Continue"

### 2. Create OAuth Client ID
1. Go to **APIs & Services** → **Credentials**
2. **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Application type: **Web application**
4. Name: "Radar Local Web Client"
5. **Authorized redirect URIs**: Add:
   ```
   http://127.0.0.1:5000/api/auth/google/callback
   ```
6. Click "Create"
7. Copy **Client ID** and **Client Secret**

### 3. Add to .env
```bash
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://127.0.0.1:5000/api/auth/google/callback
```

---

## Testing with Real Businesses

### Example 1: Restaurant in Lisbon

1. **Create account**:
   - Go to `http://127.0.0.1:5000/register`
   - Create an account with email/password

2. **Register business**:
   - Name: "Pastéis de Belém"
   - Type: Restaurant
   - Address: "R. de Belém 84-92, 1300-085 Lisboa"

3. **Generate report**:
   - Click "Generate Report"
   - You'll see real nearby competitors!

### Example 2: Café in Porto

1. **Register business**:
   - Name: "Majestic Café"
   - Type: Cafe
   - Address: "Rua de Santa Catarina 112, 4000-442 Porto"

2. **Generate report**:
   - You'll see nearby cafés and bakeries
   - Google ratings and reviews
   - Market analysis

### Example 3: Use Current Location

1. **Register business**:
   - Name: "My Business"
   - Type: Retail
   - Click "Use Current Location"
   - Allow location access

2. **Generate report**:
   - You'll see competitors in your area!

---

## 🔧 Troubleshooting

### Error: "API key not valid"
- Check if you copied the key correctly
- Confirm you enabled Places API and Geocoding API
- Wait 1-2 minutes after creating the key

### Error: "This API project is not authorized"
- In API key restrictions, add Places API and Geocoding API
- Temporarily remove restrictions to test

### No competitors found
- Check if the address is correct
- Try a more specific address
- Confirm there are businesses of that type in the area

### Database connection error
- Check if PostgreSQL is running: `brew services list`
- Test connection: `psql radar`
- Verify DATABASE_URL in .env

---

## 📊 Recommended Configurations

### Local Development
```bash
GOOGLE_PLACES_API_KEY=your_key     # ✅ Required for real data
OPENAI_API_KEY=                    # ❌ Optional (uses fallback)
DATABASE_URL=                      # ❌ Optional (uses in-memory)
GOOGLE_CLIENT_ID=                  # ❌ Optional (uses email/password)
```

### Full Production
```bash
GOOGLE_PLACES_API_KEY=your_key     # ✅ Required
OPENAI_API_KEY=your_key            # ✅ Recommended
DATABASE_URL=postgresql://...      # ✅ Required
GOOGLE_CLIENT_ID=your_id           # ✅ Recommended
GOOGLE_CLIENT_SECRET=your_secret   # ✅ Recommended
SESSION_SECRET=random_string       # ✅ Required
```

---

## 🎯 Next Steps

1. ✅ Configure Google Places API (essential)
2. 🧪 Test with 2-3 real businesses
3. 💡 Add OpenAI for AI analysis (optional)
4. 💾 Configure PostgreSQL for persistence (optional)
5. 🔐 Configure Google OAuth (optional)

---

## 📞 Support

If you encounter issues:
1. Check server logs in the terminal
2. Consult the [README.md](./README.md)
3. Check API documentation:
   - [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
   - [OpenAI API](https://platform.openai.com/docs)

Good luck! 🚀
