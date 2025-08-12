# ORTHODASH Analytics Platform

A comprehensive orthodontic practice analytics dashboard providing detailed insights into patient acquisition costs, referral sources, conversion rates, and operational metrics.

## 🚀 Features

- **Real-time Analytics**: Live integration with Greyfinch API for practice management data
- **Multi-Period Comparison**: Compare performance across different time periods and locations
- **Interactive Visualizations**: Comprehensive charts and graphs powered by Syncfusion
- **Cost Management**: Track acquisition costs with automated API integrations
- **AI-Powered Insights**: OpenAI integration for intelligent analytics summaries
- **PDF Reports**: Beautiful report generation with jsPDF
- **Secure Sharing**: Link and email sharing with access controls
- **Mobile Optimized**: Responsive design for all devices

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** with shadcn/ui components
- **TanStack Query** for server state management
- **Wouter** for lightweight routing
- **Syncfusion EJ2** for advanced charting
- **Vite** for fast development and builds

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **Neon Database** (serverless PostgreSQL)
- **Session-based authentication**
- **RESTful API design**

### External Integrations
- **Greyfinch API** - Practice management system
- **OpenAI API** - AI-powered analytics insights
- **Meta/Google Ads APIs** - Automated cost tracking

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Orthodash/orthodash-internal.git
   cd orthodash-analytics
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   Create a `.env` file with the following variables:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=your_session_secret
   GREYFINCH_API_KEY=your_greyfinch_api_key
   GREYFINCH_API_SECRET=your_greyfinch_api_secret
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Database setup**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🚀 Deployment

### Replit Deployment (Recommended)
1. Import the repository into Replit
2. Configure environment variables in the Secrets tab
3. Run the application using the "Start application" workflow

### Manual Deployment
1. Build the application:
   ```bash
   npm run build
   ```
2. Deploy to your preferred hosting platform
3. Ensure environment variables are configured

## 📱 Usage

### Getting Started
1. **Authentication**: Register or login with your team orthodontics email
2. **Location Setup**: Configure your practice locations
3. **Period Configuration**: Create analysis periods for comparison
4. **Data Integration**: Connect Greyfinch API and external advertising platforms
5. **Analytics**: View real-time insights and generate reports

### Key Workflows
- **Multi-Period Analysis**: Add multiple time periods for side-by-side comparison
- **Cost Tracking**: Input or automatically sync acquisition costs
- **Report Generation**: Export beautiful PDF reports with charts and data
- **AI Insights**: Generate intelligent summaries and recommendations

## 🔧 Development

### Project Structure
```
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utility functions
├── server/              # Express backend
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic
│   └── storage/         # Database operations
├── shared/              # Shared types and schemas
└── docs/                # Documentation
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Apply database schema changes
- `npm run type-check` - Run TypeScript checks

### Key Components
- **Dashboard**: Main analytics interface
- **PeriodColumn**: Individual period analysis display
- **CostManagement**: Acquisition cost tracking
- **ShareModal**: Report sharing functionality
- **MobileFriendlyControls**: Mobile-optimized navigation

## 🔐 Security

- Session-based authentication with PostgreSQL store
- Secure API key management through environment variables
- HTTPS enforcement in production
- Input validation with Zod schemas

## 📊 Analytics Features

### Metrics Tracked
- Patient acquisition costs by source
- Conversion rates and ROI
- Referral source performance
- Location-based comparisons
- Time-period trends

### Visualization Types
- Pie charts for source distribution
- Column charts for period comparison
- Spline charts for trend analysis
- Stacked charts for category breakdowns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏥 About Team Orthodontics

ORTHODASH is built specifically for orthodontic practices to optimize patient acquisition and improve operational efficiency through data-driven insights.

## 📞 Support

For support and questions:
- Create an issue in this repository
- Contact: support@teamorthodontics.com

---

**Built with ❤️ for orthodontic practices everywhere**