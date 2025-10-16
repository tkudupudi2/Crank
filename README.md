# Crank - Personal Finance Manager

A comprehensive web application for managing all your credit cards and bank accounts in one place. Built with Next.js, TypeScript, and integrated with Plaid for secure bank connections.

## 🌟 Features

### 🏦 Account Management
- Connect multiple bank accounts (checking, savings, investment)
- Link all your credit cards
- Real-time balance updates via Plaid webhooks
- Secure bank-level encryption

### 💳 Payment Management
- Schedule credit card payments
- Track payment history
- Set up recurring payments
- Payment reminders and notifications

### 📊 Transaction Analytics
- Automatic transaction categorization
- Spending insights and trends
- Monthly and yearly reports
- Budget tracking and alerts

### 🔒 Security
- Bank-level security with 256-bit encryption
- NextAuth.js authentication
- Secure API connections via Plaid
- Data privacy protection

## 🚀 Quick Cloud Deployment

### Option 1: One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/new-finance)

### Option 2: Manual Deployment

1. **Fork this repository**
2. **Set up cloud database** (Supabase or Neon)
3. **Configure Plaid** (get API keys)
4. **Deploy to Vercel** with environment variables
5. **Initialize database** with Prisma

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase/Neon)
- **Authentication**: NextAuth.js with Auth0
- **Bank Integration**: Plaid API
- **Deployment**: Vercel
- **UI Components**: Custom components with Lucide React icons

## 📋 Prerequisites

- Node.js 18+
- Cloud PostgreSQL database (Supabase/Neon)
- Auth0 account for authentication
- Plaid account for bank connections
- Vercel account for deployment

## ⚡ Quick Start

### 1. Clone and Install
```bash
git clone https://github.com/yourusername/new-finance.git
cd new-finance
npm install
```

### 2. Set up Cloud Services

#### Database (Supabase - Recommended)
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get database URL from Settings > Database

#### Auth0 Authentication
1. Create account at [auth0.com](https://auth0.com)
2. Create new application (Regular Web Application)
3. Get Domain, Client ID, and Client Secret

#### Plaid Integration
1. Create account at [plaid.com](https://plaid.com)
2. Create new application
3. Get Client ID and Secret

### 3. Environment Configuration
```bash
cp env.example .env.local
```

Fill in your cloud service credentials:
```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Auth0
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_BASE_URL=https://your-app.vercel.app
AUTH0_SECRET=your_auth0_secret

# Plaid
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=development

# NextAuth
NEXTAUTH_SECRET=your_strong_secret_here
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 4. Database Setup
```bash
npm run deploy:setup
```

### 5. Deploy to Vercel
```bash
npm run deploy:vercel
```

## 📁 Project Structure

```
new-finance/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── plaid/         # Plaid integration
│   │   └── payments/      # Payment management
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── dashboard/         # Dashboard components
│   ├── landing/           # Landing page components
│   └── ui/                # Reusable UI components
├── lib/                   # Utility libraries
│   ├── auth.ts            # NextAuth configuration
│   ├── prisma.ts          # Prisma client
│   ├── plaid.ts           # Plaid client configuration
│   └── utils.ts           # Utility functions
├── prisma/                # Database schema
│   └── schema.prisma      # Prisma schema file
└── public/                # Static assets
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Plaid Integration
- `POST /api/plaid/link_token` - Create Plaid link token
- `POST /api/plaid/exchange_token` - Exchange public token
- `POST /api/plaid/transactions` - Fetch transactions
- `POST /api/plaid/webhook` - Plaid webhook handler

### Payments
- `GET /api/payments` - Get user payments
- `POST /api/payments` - Create new payment

## 🗄 Database Schema

The application uses the following main entities:

- **User**: User accounts and authentication
- **Account**: Connected bank accounts and credit cards
- **Transaction**: Transaction history and details
- **Payment**: Scheduled and completed payments
- **PlaidItem**: Plaid integration metadata

## 🔒 Security Features

- ✅ Encrypted data storage
- ✅ Secure API authentication
- ✅ Environment variable protection
- ✅ Password hashing with bcrypt
- ✅ Bank-level security via Plaid
- ✅ SSL/HTTPS enforcement
- ✅ CORS protection
- ✅ SQL injection prevention

## 🌐 Cloud Infrastructure

### Database Options
- **Supabase**: Full-featured with real-time capabilities
- **Neon**: Serverless PostgreSQL with branching
- **PlanetScale**: MySQL-compatible with branching

### Deployment Options
- **Vercel**: Recommended for Next.js apps
- **Netlify**: Alternative with good Next.js support
- **Railway**: Full-stack deployment platform

## 📱 Mobile Support

The application is fully responsive and works on:
- 📱 Mobile browsers (iOS Safari, Chrome Mobile)
- 📱 Tablet browsers (iPad, Android tablets)
- 💻 Desktop browsers (Chrome, Firefox, Safari, Edge)

## 🔄 Real-time Updates

- **Plaid Webhooks**: Automatic transaction updates
- **Balance Sync**: Real-time balance updates
- **Payment Notifications**: Instant payment status updates

## 📊 Analytics & Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Error Tracking**: Comprehensive error logging
- **Database Monitoring**: Query performance tracking

## 🚀 Performance Optimizations

- **Static Generation**: Pre-rendered pages where possible
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic bundle splitting
- **Caching**: Strategic caching for API responses

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@newfinance.com
- 💬 Discord: [Join our community](https://discord.gg/newfinance)
- 📖 Documentation: [docs.newfinance.com](https://docs.newfinance.com)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/new-finance/issues)

## 🗺 Roadmap

- [ ] Mobile app (React Native)
- [ ] Investment portfolio tracking
- [ ] Bill reminder system
- [ ] Family/shared account management
- [ ] Advanced analytics and reporting
- [ ] Integration with more financial institutions
- [ ] AI-powered spending insights
- [ ] Cryptocurrency support
- [ ] International bank support

## 🙏 Acknowledgments

- [Plaid](https://plaid.com) for secure bank connections
- [Next.js](https://nextjs.org) for the amazing framework
- [Tailwind CSS](https://tailwindcss.com) for beautiful styling
- [Vercel](https://vercel.com) for seamless deployment

---

**Ready to take control of your finances?** 🚀

[Deploy Now](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/new-finance) | [View Demo](https://newfinance.vercel.app) | [Read Docs](./DEPLOYMENT.md)
