# Cloud Deployment Guide

This guide will help you deploy Crank to the cloud with all services running online.

## 🚀 Quick Deploy to Vercel

### 1. Database Setup (Choose One)

#### Option A: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your Supabase dashboard, go to Settings > Database
3. Copy the connection string and update your `.env.local`:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   ```

#### Option B: Neon
1. Go to [neon.tech](https://neon.tech) and create a new project
2. Copy the connection string and update your `.env.local`:
   ```env
   DATABASE_URL="postgresql://[username]:[password]@[host]/[database]?sslmode=require"
   DIRECT_URL="postgresql://[username]:[password]@[host]/[database]?sslmode=require"
   ```

### 2. Plaid Setup
1. Go to [plaid.com](https://plaid.com) and create an account
2. Create a new application in the Plaid dashboard
3. Get your Client ID and Secret
4. Update your `.env.local`:
   ```env
   PLAID_CLIENT_ID=your_plaid_client_id
   PLAID_SECRET=your_plaid_secret
   PLAID_ENV=development  # Use 'production' for live data
   ```

### 3. Deploy to Vercel
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `PLAID_CLIENT_ID`
   - `PLAID_SECRET`
   - `PLAID_ENV`
   - `NEXTAUTH_SECRET` (generate a strong secret)
   - `NEXTAUTH_URL` (your Vercel domain)
   - `NEXT_PUBLIC_APP_URL` (your Vercel domain)

4. Deploy!

### 4. Initialize Database
After deployment, run these commands to set up your database:
```bash
npx prisma generate
npx prisma db push
```

## 🔧 Environment Variables for Production

Create a `.env.local` file with these variables:

```env
# Database
DATABASE_URL="your_cloud_database_url"
DIRECT_URL="your_cloud_database_url"

# Plaid Configuration
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=production

# NextAuth Configuration
NEXTAUTH_SECRET=your_strong_production_secret_here
NEXTAUTH_URL=https://your-app.vercel.app

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 📊 Database Setup Commands

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Seed database
npx prisma db seed
```

## 🔒 Security Checklist

- [ ] Strong NEXTAUTH_SECRET (32+ characters)
- [ ] Production Plaid environment
- [ ] SSL-enabled database connection
- [ ] Environment variables secured in Vercel
- [ ] CORS properly configured

## 🌐 Domain Configuration

### Custom Domain (Optional)
1. In Vercel dashboard, go to your project settings
2. Add your custom domain
3. Update environment variables with your domain
4. Update Plaid webhook URL if using custom domain

### SSL Certificate
Vercel automatically provides SSL certificates for all deployments.

## 📱 Mobile App Considerations

The app is responsive and works on mobile browsers. For a native mobile app:
1. Consider using React Native or Flutter
2. Implement deep linking for authentication
3. Use secure storage for sensitive data

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to your main branch:
1. Push code to GitHub
2. Vercel builds and deploys automatically
3. Database migrations run automatically (if configured)

## 🐛 Troubleshooting

### Database Connection Issues
- Check your DATABASE_URL format
- Ensure your database allows connections from Vercel IPs
- Verify SSL is enabled

### Plaid Integration Issues
- Confirm PLAID_ENV matches your Plaid dashboard environment
- Check webhook URL is accessible
- Verify client ID and secret are correct

### Authentication Issues
- Ensure NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Verify redirect URLs in Plaid dashboard

## 📈 Monitoring and Analytics

### Vercel Analytics
- Enable Vercel Analytics in your dashboard
- Monitor performance and errors

### Database Monitoring
- Use Supabase/Neon dashboard for database metrics
- Set up alerts for connection issues

### Error Tracking
Consider adding Sentry or similar service for error tracking.

## 🚀 Production Checklist

- [ ] Database migrated and seeded
- [ ] Environment variables configured
- [ ] Plaid webhook URL updated
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Error monitoring set up
- [ ] Backup strategy in place
- [ ] Performance monitoring enabled

## 🔄 Updates and Maintenance

### Regular Updates
- Keep dependencies updated
- Monitor security advisories
- Update Plaid integration as needed

### Database Maintenance
- Regular backups
- Performance monitoring
- Index optimization

Your Crank app is now ready for production use with cloud infrastructure! 🎉

