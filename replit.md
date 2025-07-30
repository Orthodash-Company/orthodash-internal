# ORTHODASH Analytics Platform

## Overview

ORTHODASH is a comprehensive analytics dashboard application for orthodontic practices. It provides practice owners with detailed insights into patient acquisition costs, referral sources, conversion rates, and operational metrics. The system is fully production-ready with complete live Greyfinch API integration, eliminating all mock/dummy data. Features include dynamic multi-period comparisons, waterfall visualization building, comprehensive reports management with PDF export, and mobile-optimized design.

## Recent Changes (January 2025)

- **PRODUCTION READY**: Eliminated all mock/dummy data throughout the system
- **Live API Integration**: Full Greyfinch API integration with proper error handling for production use
- **Enhanced Visualization System**: Waterfall building interface with plus buttons and mobile-optimized modal
- **Reports Management**: Complete template saving and PDF export functionality with backend storage
- **Error Handling**: Production-grade error states and API connection validation
- **TypeScript Compliance**: All compilation errors resolved, fully type-safe codebase
- **Column Editing**: Added modal-based editing for published analytics periods
- **Date Picker Fix**: Completely rebuilt date selection with proper event handling and clickability
- **API Endpoint Update**: Updated Greyfinch API to correct endpoint (https://api.greyfinch.com/v1/graphql)
- **Schema Introspection**: Added GraphQL schema exploration endpoint (/api/greyfinch/schema) for interactive API development
- **Query Structure Fix**: Corrected GraphQL queries to match actual Greyfinch schema (primaryLocation.id as UUID, removed non-existent fields)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state, React hooks for local state
- **Charts**: Syncfusion EJ2 React Charts for data visualization
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Structure**: RESTful endpoints with proper error handling
- **Session Management**: Express sessions with PostgreSQL store

### Key Design Decisions
- **Monorepo Structure**: Shared schema and types between client and server
- **Type Safety**: Full TypeScript coverage with Zod validation
- **Component Library**: shadcn/ui for consistent, accessible UI components
- **Caching Strategy**: Database-level caching for expensive analytics queries

## Key Components

### Database Schema
- **users**: User authentication and management
- **locations**: Practice locations with Greyfinch integration
- **acquisitionCosts**: Manual cost tracking per referral type and period
- **analyticsCache**: Query result caching for performance optimization

### API Endpoints
- `GET /api/locations` - Fetch all practice locations
- `POST /api/locations` - Create new practice location
- `GET /api/analytics` - Fetch analytics data with date range filtering
- `POST /api/acquisition-costs` - Save acquisition cost data
- `GET /api/test-greyfinch` - Test Greyfinch API connectivity

### Frontend Components
- **Dashboard**: Enhanced main analytics view with dynamic multi-period comparisons
- **PeriodColumn**: Reusable component for displaying analytics data with period-to-period comparison
- **CostManagement**: Interface for managing acquisition costs
- **Charts**: Specialized chart components (Pie, Column, Spline, StackedColumn)
- **Header**: Navigation and branding component
- **Multi-Period Interface**: Dynamic period addition/removal with horizontal scrolling

## Data Flow

### Analytics Data Pipeline
1. **Data Collection**: Greyfinch API provides patient and appointment data
2. **Data Processing**: Server transforms raw data into analytics metrics
3. **Caching**: Results stored in database cache for performance
4. **Visualization**: Frontend renders charts and comparison views

### User Interactions
1. **Dynamic Period Management**: Add/remove multiple time periods for comparison
2. **Location Selection**: Filter analytics by specific practice locations per period
3. **Flexible Date Ranges**: Independent date range selection for each period
4. **Horizontal Navigation**: Swipe/scroll through multiple period columns
5. **Period Customization**: Rename periods and configure individual settings
6. **Cost Management**: Input acquisition costs for accurate ROI calculations
7. **Real-time Updates**: Data refreshes based on user interactions

## External Dependencies

### Third-Party Services
- **Greyfinch API**: Practice management system integration
- **Neon Database**: Serverless PostgreSQL hosting
- **Syncfusion Charts**: Advanced charting library

### Key Libraries
- **Drizzle ORM**: Type-safe database operations
- **TanStack Query**: Server state management and caching
- **Radix UI**: Accessible component primitives
- **Zod**: Runtime type validation
- **Date-fns**: Date manipulation utilities

## Deployment Strategy

### Development Environment
- **Replit Integration**: Optimized for Replit development workflow
- **Hot Reload**: Vite development server with HMR
- **Error Handling**: Runtime error overlay for debugging

### Production Build
- **Client Build**: Vite builds optimized static assets
- **Server Build**: ESBuild compiles Node.js application
- **Database Migrations**: Drizzle Kit manages schema changes

### Environment Configuration
- **Database Connection**: Uses DATABASE_URL environment variable
- **API Keys**: Greyfinch credentials stored securely
- **Session Storage**: PostgreSQL-backed session management

### Performance Optimizations
- **Query Caching**: Database-level caching reduces API calls
- **Code Splitting**: Vite automatically splits bundles
- **Asset Optimization**: Tailwind CSS purging and compression
- **Database Pooling**: Connection pooling for efficient resource usage