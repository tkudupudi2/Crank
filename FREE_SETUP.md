# Free Services Setup Guide

This guide will help you set up Crank using completely free services:
- **Plaid Sandbox** (Free) - Bank account simulation
- **Auth0** (Free) - Authentication
- **Supabase** (Free) - PostgreSQL database
- **Vercel** (Free) - Hosting

## 🆓 Free Services Overview

| Service | Free Tier | Limits |
|---------|-----------|---------|
| **Plaid Sandbox** | Unlimited | Test data only |
| **Auth0** | 7,000 users | Full features |
| **Supabase** | 500MB DB | 2GB bandwidth |
| **Vercel** | Unlimited | 100GB bandwidth |

## 🏗️ Step-by-Step Setup

### 1. Supabase Database (Free PostgreSQL)

1. **Create Account**
   - Go to [supabase.com](https://supabase.com)
   - Click "Start your project"
   - Sign up with GitHub/Google

2. **Create Project**
   - Click "New Project"
   - Choose organization
   - Enter project name: `new-finance`
   - Generate strong password
   - Select region closest to you
   - Click "Create new project"

3. **Get Database URL**
   - Go to Settings → Database
   - Copy the connection string
   - Update your `.env.local`:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key_here"
```

### 2. Auth0 Authentication (Free Developer Account)

1. **Create Auth0 Account**
   - Go to [auth0.com](https://auth0.com)
   - Click "Start Free Account"
   - Complete signup process

2. **Create Application**
   - In Auth0 dashboard, go to Applications
   - Click "Create Application"
   - Name: `Crank`
   - Select "Regular Web Applications"
   - Click Create

3. **Configure Application**
   - Go to Settings tab
   - Allowed Callback URLs:
     - `http://localhost:3000/api/auth/callback/auth0` (development)
     - `https://your-app.vercel.app/api/auth/callback/auth0` (production)
   - Allowed Logout URLs:
     - `http://localhost:3000` (development)
     - `https://your-app.vercel.app` (production)
   - Allowed Web Origins:
     - `http://localhost:3000under` (development)
     - `https://your-app.vercel.app` (production)
   - Click "Save Changes"

4. **Get Credentials**
   - Copy Domain, Client ID, and Client Secret
   - Note your Auth0 domain (e.g., `your-domain.auth0.com`)

5. **Update Environment Variables**
```env
AUTH0_CLIENT_ID="your_client_id_here"
AUTH0_CLIENT_SECRET="your_client_secret_here"
AUTH0_ISSUER_BASE_URL="https://your-domain.auth0.com"
AUTH0_BASE_URL="https://your-app.vercel.app"
AUTH0_SECRET="your_random_secret_here"
```

### 3. Plaid Sandbox (Free Test Environment)

1. **Create Plaid Account**
   - Go to [plaid.com](https://plaid.com)
   - Click "Get API Keys"
   - Create developer account

2. **Get Sandbox Keys**
   - In Plaid dashboard, go to API Keys
   - Copy your sandbox credentials
   - Update environment variables:

```env
PLAID_CLIENT_ID="your_sandbox_client_id"
PLAID_SECRET="your_sandbox_secret"
PLAID_ENV="sandbox"
```

3. **Test Credentials**
   - Use Plaid's test credentials for development
   - Test users are provided in Plaid dashboard

### 4. Vercel Deployment (Free Hosting)

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project**
   - Push your code to GitHub
   - In Vercel, click "Import Project"
   - Connect your GitHub repository

3. **Configure Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add all variables from your `.env.local`
   - Make sure to use production URLs for Okta redirects

4. **Deploy**
   - Click "Deploy"
   - Your app will be live at `https://your-app.vercel.app`

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp env.example .env.local
# Edit .env.local with your credentials

# 3. Set up database
npm run db:generate
npm run db:push

# 4. Start development server
npm run dev

# 5. Deploy to production
npm run deploy:vercel
```

## 🧪 Testing with Sandbox Data

### Plaid Sandbox Features
- **Test Banks**: Chase, Wells Fargo, Bank of America
- **Test Credit Cards**: Visa, Mastercard, American Express
- **Test Transactions**: Pre-loaded transaction data
- **Test Users**: Use `user_good` / `pass_good` for login

### Auth0 Test Users
- Create test users in Auth0 dashboard
- Use any email address (doesn't need to be real)
- Enable social connections (Google, GitHub, etc.)
- Set up test profiles for development

## 🔧 Environment Variables Template

Create `.env.local` with these variables:

```env
# Database (Supabase - Free)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON_KEY]"

# Plaid (Sandbox - Free)
PLAID_CLIENT_ID="[SANDBOX_CLIENT_ID]"
PLAID_SECRET="[SANDBOX_SECRET]"
PLAID_ENV="sandbox"

# Auth0 (Free)
AUTH0_CLIENT_ID="[AUTH0_CLIENT_ID]"
AUTH0_CLIENT_SECRET="[AUTH0_CLIENT_SECRET]"
AUTH0_ISSUER_BASE_URL="https://[YOUR-DOMAIN].auth0.com"
AUTH0_BASE_URL="https://your-app.vercel.app"
AUTH0_SECRET="[RANDOM_SECRET]"

# NextAuth
NEXTAUTH_SECRET="[GENERATE_RANDOM_STRING]"
NEXTAUTH_URL="https://your-app.vercel.app"

# App
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

## 🎯 Testing Your Setup

### 1. Test Database Connection
```bash
npm run db:studio
```
This opens Prisma Studio to view your database.

### 2. Test Authentication
1. Go to `/auth/signin`
2. Click "Sign in with Okta"
3. Complete Okta login
4. Should redirect to dashboard

### 3. Test Plaid Integration
1. Go to dashboard
2. Click "Connect Accounts"
3. Use Plaid sandbox credentials
4. Should connect test accounts

## 🆘 Troubleshooting

### Database Issues
- Check Supabase project is active
- Verify connection string format
- Ensure database password is correct

### Auth0 Issues
- Check callback URLs match exactly
- Verify client ID and secret
- Ensure Auth0 application is active
- Check allowed origins are configured

### Plaid Issues
- Confirm using sandbox credentials
- Check webhook URL is accessible
- Verify environment is set to 'sandbox'

### Deployment Issues
- Check all environment variables are set in Vercel
- Verify URLs use HTTPS for production
- Check Vercel build logs for errors

## 📊 Free Tier Limits

### Supabase (500MB DB)
- 500MB database storage
- 2GB bandwidth per month
- 50MB file storage
- 2GB database egress

### Auth0 (7,000 users)
- Up to 7,000 active users
- Unlimited API calls
- Full feature access
- Social connections
- Community support

### Plaid Sandbox (Unlimited)
- Unlimited API calls
- Test data only
- No real bank connections
- Full feature testing

### Vercel (100GB bandwidth)
- Unlimited deployments
- 100GB bandwidth per month
- Automatic SSL
- Global CDN

## 🚀 Scaling Beyond Free Tiers

When you're ready to scale:

1. **Supabase Pro** - $25/month for more storage
2. **Auth0 Essentials** - $23/month for more users and features
3. **Plaid Production** - Pay per transaction for real banks
4. **Vercel Pro** - $20/month for more bandwidth

Your app is now running on completely free services! 🎉

## 📞 Support

- **Supabase**: [Discord Community](https://discord.supabase.com)
- **Auth0**: [Community](https://community.auth0.com)
- **Plaid**: [Documentation](https://plaid.com/docs)
- **Vercel**: [Community](https://github.com/vercel/vercel/discussions)
