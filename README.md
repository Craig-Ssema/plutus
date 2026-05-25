# PLUTUS

### Real-Time Trading Platform

**Craig Ssemakula**

**COMP 3326 - Web Application Development**  
North American University  
Fall 2025

---

## 1. Project Title & Description

### Project Name

**Plutus** - Named after the Greek god of wealth

### What It Does

Plutus is a comprehensive full-stack web application that simulates a real-time trading platform for cryptocurrencies and stocks. The platform provides users with an immersive trading experience featuring live market data from multiple APIs, interactive candlestick charts with multiple timeframes, paper trading capabilities with virtual balance, portfolio tracking, and a vibrant community hub with real-time chat.

### Why I Built It

This project was developed as a final project for COMP 3326 - Web Application Development. The goal was to create a modern, feature-rich web application that demonstrates proficiency in full-stack development, real-time data handling, user authentication, responsive design, and integration with external APIs. The trading platform domain was chosen because it presents interesting technical challenges including real-time data updates, complex UI interactions, and state management.

---

## 2. Tech Stack Used

### Frontend Technologies

- **React 18.2** - UI framework with hooks and functional components
- **Vite 7.2** - Fast build tool and development server
- **Tailwind CSS 3.3** - Utility-first CSS framework for styling
- **Radix UI** - Accessible, unstyled UI component primitives
- **Recharts 2.8** - Composable charting library for data visualization
- **Framer Motion 10** - Animation library for smooth transitions
- **React Router DOM 6** - Client-side routing
- **Lucide React** - Modern icon library

### Backend Technologies

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework for API endpoints
- **CORS** - Cross-origin resource sharing middleware
- **dotenv** - Environment variable management

### Database & Authentication

- **Supabase** - Backend-as-a-Service platform

![Supabase Logo](screenshots/supabase-logo.png)

- **PostgreSQL** - Relational database (via Supabase)
- **Supabase Auth** - User authentication & session management

![Supabase Auth](screenshots/supabase-auth.png)

![Supabase Database](screenshots/supabase-database.png)

![Supabase RLS](screenshots/supabase-rls.png)

- **Row Level Security (RLS)** - Database security policies

### External APIs

- **CoinGecko API** - Real-time cryptocurrency market data
- **Finnhub API** - Stock market quotes and data
- **Alpha Vantage API** - Historical chart data
- **Twelve Data API** - Real-time stock data (fallback)

---

## 3. Features

### Authentication & User Management

- User Registration - Create account with email/password or username
- Secure Login - Session-based authentication via Supabase
- Profile Management - Edit profile, upload avatar, delete account
- Protected Routes - Secure access to user-specific pages

### Market Data & Trading

- Real-Time Market Data - Live prices for 15+ cryptocurrencies and 18+ stocks
- Interactive Trading Charts - Candlestick/line charts with timeframes (1D, 5D, 1M, 3M, 1Y, 5Y)
- Paper Trading - Simulated buy/sell orders with virtual balance
- Portfolio Tracking - Track holdings, profit/loss, and performance
- Order Book Visualization - Bid/ask spread display

### Trading Tools

- Watchlist - Save and monitor favorite assets
- Price Alerts - Set notifications when prices reach targets
- Stop-Loss Orders - Automatic sell orders to limit losses
- Take-Profit Orders - Automatic sell orders to lock in gains
- Transaction History - Complete record of all trades

### Notifications System

- Toast Notifications - Real-time alerts and confirmations
- Achievement Notifications - Unlock badges for trading milestones
- Price Alert Notifications - Triggered when assets hit target prices
- Auto-Order Notifications - Alerts when stop-loss/take-profit orders execute
- Notification Center - Centralized view of all notifications

### Community Hub

- Real-Time Chat - Live community messaging with multiple channels
- Direct Messages - Private user-to-user communication
- Market News Feed - Latest financial news and updates
- Online Users - See who's currently active in the community

### User Experience

- Multiple Themes - Dark, Light, and Gradient display modes
- Responsive Design - Mobile-first design that works on all devices
- Market Ticker - Scrolling live price updates banner
- Rocket Loader - Custom animated loading screen

### Accessibility Features

- ADHD-Friendly Mode - Reduced visual distractions
- Seizure-Safe Mode - Reduced animations and flashing
- Reading Mask - Focus aid for reading content
- Keyboard Navigation - Full keyboard support

### Gamification

- Achievement System - Unlock badges for trading milestones
- Points System - Earn points for activities and trades
- Account Tiers - Progress through Bronze, Silver, Gold, Platinum levels

---

## 4. How to Run the Project

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- Supabase account (for database & authentication)

### Installation Steps

1. **Extract the Project:** Unzip the plutus folder to your location
2. **Install Frontend Dependencies:** Open terminal and run: `npm install`
3. **Install Backend Dependencies:** Navigate to server folder and run: `cd server && npm install`
4. **Configure Environment Variables:** Create .env files with Supabase and API credentials
5. **Set Up Supabase Database:** Run database-setup.sql in Supabase SQL Editor
6. **Start Backend Server:** Run: `npm run server` (or use start-backend.bat on Windows)
7. **Start Frontend Server:** Run: `npm run dev`

> **Note:** Steps 4-5 may not be necessary - the project will likely still be linked to the Supabase platform on another PC.

### Access the Application

- **Frontend:** http://localhost:3003

![Frontend Terminal](screenshots/frontend-terminal.png)

- **Backend API:** http://localhost:3001

![Backend Server](screenshots/backend-server.png)

*(Backend server actively fetching data with the help of API keys: Finnhub, CoinGecko)*

### Demo Link

Not yet published, but you can access the source code, run the server backend, then frontend. This is the URL link likely to appear:

![URL Link](screenshots/url-link.png)

---

## 5. Screenshots

### Sign In / Sign Up Page

| Sign In | Sign Up |
|---------|---------|
| ![Sign In](screenshots/signin-page.png) | ![Sign Up](screenshots/signup-page.png) |

### Dashboard / Home Page

![Dashboard](screenshots/dashboard.png)

### Markets Page

![Markets Page](screenshots/markets-page.png)

### Trading Page with Charts

![Trading Chart](screenshots/trading-chart.png)

| Mobile Trading View 1 | Mobile Trading View 2 |
|-----------------------|-----------------------|
| ![Trading Mobile 1](screenshots/trading-mobile-1.png) | ![Trading Mobile 2](screenshots/trading-mobile-2.png) |

### Community Hub

![Community Hub 1](screenshots/community-hub-1.png)

![Community Hub 2](screenshots/community-hub-2.png)

![Community Hub 3](screenshots/community-hub-3.png)

### Profile Page

![Profile Page](screenshots/profile-page.png)

### Notifications

![Notifications](screenshots/notifications.png)

### Mobile Responsive View

![Mobile Responsive](screenshots/mobile-responsive.png)

### Accessibility Feature

![Accessibility](screenshots/accessibility.png)

---

## 6. Team Members

| Name | Role | Contributions |
|------|------|---------------|
| **Craig Ssemakula** | Full-Stack Developer | Frontend UI/UX, Backend API, Database Design, Authentication, Charts, Community Features, Notifications |

---

## 7. Challenges & Learning

### Technical Challenges Faced

- **API Rate Limiting:** External APIs (CoinGecko, Finnhub) have strict rate limits. Solved by implementing request deduplication, caching with TTL, and a queue system with exponential backoff retry logic.

- **Real-Time Data Management:** Keeping market data fresh without overwhelming APIs. Implemented smart caching with configurable duration and automatic fallback to mock data when APIs fail.

- **Supabase Authentication:** Managing session state across multiple components. Created a custom AuthContext provider with proper session persistence and protected route handling.

- **Chart Performance:** Rendering large datasets smoothly without lag. Optimized by limiting data points per timeframe and using efficient Recharts configurations.

- **Responsive Trading UI:** Making complex trading interfaces work on mobile devices. Used Tailwind's responsive utilities and created mobile-specific component layouts.

### What I Learned

- Modern React patterns including Context API, custom hooks, and component composition
- Backend API design with RESTful endpoints, middleware chains, and error handling
- Database design with PostgreSQL schemas, Row Level Security policies, and real-time subscriptions
- Third-party API integration strategies including rate limiting, caching, and fallback mechanisms
- Authentication flows including session management, protected routes, and security best practices
- UI/UX design principles including accessibility, responsive design, and user experience optimization
- State management patterns for complex applications with multiple data sources

---

## 8. Future Improvements

If I had more time, I would add the following features:

1. **Social Trading:** Allow users to copy successful traders' strategies
2. **Advanced Technical Indicators:** Add RSI, MACD, Bollinger Bands to charts
3. **Portfolio Analytics:** Detailed performance metrics, reports, and export options
4. **Mobile App:** React Native version for iOS and Android
5. **WebSocket Integration:** True real-time price updates instead of polling
6. **Two-Factor Authentication:** Enhanced account security
7. **Email Notifications:** Price alerts delivered via email
8. **AI-Powered Insights:** Machine learning for price predictions
9. **Multi-Language Support:** Internationalization (i18n) for global users
10. **Cryptocurrency Wallet Integration:** Connect real wallets (read-only)

---

<p align="center">
  <b>Craig Ssemakula</b><br>
  North American University | COMP 3326 | Fall 2025
</p>
