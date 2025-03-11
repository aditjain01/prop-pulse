# PropPulse - Real Estate Investment Tracker

PropPulse is a comprehensive real estate investment tracking application that provides instant insights on your property investments, upcoming listings, market valuations, and more.

![PropPulse](./generated-icon.png)

## 🏢 Overview

PropPulse helps you track and analyze your real estate investments with powerful tools for monitoring property performance, loan management, payment tracking, and financial insights.

### Key Features

- **Property Management**: Track property details, status, and valuations
- **Purchase Tracking**: Monitor acquisition costs and investment timeline
- **Loan Management**: Manage multiple loans with payment schedules
- **Financial Analysis**: Get insights on ROI, costs, and investment performance
- **Payment Tracking**: Monitor all expenses related to your properties
- **Market Insights**: Stay updated on market trends and property valuations

## 🛠️ Tech Stack

PropPulse is built using modern technologies:

- **Frontend**: React with Vite, TailwindCSS, shadcn/ui components
- **Backend**: FastAPI with SQLAlchemy ORM
- **Database**: PostgreSQL
- **Containerization**: Docker with Docker Compose for orchestration
- **Web Server**: Nginx as reverse proxy

## 🚀 Architecture

The application follows a modern three-tier architecture:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│             │      │             │      │             │
│  React UI   │─────▶│  FastAPI    │─────▶│ PostgreSQL  │
│  (Nginx)    │◀─────│  Backend    │◀─────│ Database    │
│             │      │             │      │             │
└─────────────┘      └─────────────┘      └─────────────┘
```

- **Frontend**: React SPA served by Nginx
- **API Gateway**: Nginx reverse proxy routes API requests to backend services
- **Backend**: FastAPI service for business logic and data access
- **Database**: PostgreSQL for persistent storage

## 🏗️ Installation & Setup

### Prerequisites

- Node.js (with npm or yarn), Python (with uv) and Postgres for local deployment
- Docker Compose for production deployment
   
### Local Development 

-  Or install dependencies and run the development servers:

1. Install dependencies:
   ```bash
   cd server && uv sync
   cd client && npm ci
   ```
2. Run the development servers:
   ```bash
   psql -U postgres -d postgres -W postgres
   cd server && uv run uvicorn src.main:app --reload
   cd client && npm run dev
   ```

### Production Development

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/proppulse.git
   cd proppulse
   ```

2. Start the development environment:
   ```bash
   docker compose up -d
   ```

3. Access the application:
   - Frontend: http://localhost:80
   - Backend API: http://localhost:80/api

### Production Deployment with Docker Swarm

1. Initialize Docker Swarm if not already done:
   ```bash
   docker swarm init
   ```

2. Deploy the stack:
   ```bash
   docker stack deploy -c compose.yaml proppulse
   ```

3. Scale services as needed:
   ```bash
   docker service scale proppulse_prop-pulse-backend=5
   ```

## 🔄 Application Components

### Frontend (React/Vite)

The frontend is a single-page application built with React and Vite, using TailwindCSS for styling. Key frontend components:

- **Pages**: Property list, purchase details, loan management, payment tracking
- **State Management**: React Query for data fetching and caching
- **Routing**: Wouter for lightweight routing
- **UI Components**: shadcn/ui component library

### Backend (FastAPI)

The backend provides RESTful API endpoints for managing real estate data:

- **Routes**: Modular API endpoints for properties, purchases, loans, payments
- **ORM**: SQLAlchemy for database interactions
- **Models**: Data models for properties, purchases, loans, payments
- **Views**: Database views for complex analytics queries

### Database (PostgreSQL)

PostgreSQL stores all application data with:

- **Tables**: Properties, purchases, loans, payments, users
- **Views**: Custom views for financial analytics
- **Relationships**: Foreign key constraints for data integrity

### Nginx (Reverse Proxy)

Nginx serves the built frontend assets and routes API requests to the backend:

- **Static Files**: Serves the React application
- **API Proxy**: Routes /api requests to the FastAPI backend
- **Security Headers**: Adds security headers to all responses

## 📊 Data Flow

1. User interacts with the React frontend
2. Frontend makes API requests through Nginx
3. Nginx routes requests to the appropriate backend service
4. Backend processes requests and interacts with the database
5. Results flow back through the same path to the user

## 🔒 Security Considerations

- CORS is configured on the backend
- Nginx adds security headers
- Protected routes in the frontend application
- Database credentials managed via environment variables

## 🧪 Testing

- Backend unit tests can be run with pytest
- Frontend tests use Vitest and React Testing Library

## 🗺️ Future Roadmap

### Q2 2025
- **AI-Powered Market Analysis**: Implement machine learning models for property valuation prediction
- **Mobile Application**: Develop companion mobile apps for iOS and Android
- **Document Management**: Add storage for property-related documents

### Q3 2025
- **Portfolio Optimization**: Add tools to optimize investment portfolio
- **Multi-user Collaboration**: Allow teams to collaborate on property management
- **Advanced Analytics Dashboard**: Enhanced data visualization and reporting

### Q4 2025
- **Integration with Property Listing APIs**: Real-time market data
- **Tenant Management**: Add features for managing rental properties
- **Tax Planning Tools**: Help investors optimize tax strategies

### 2026 and Beyond
- **International Markets Support**: Expand to support multiple currencies and regional regulations
- **Blockchain Integration**: Explore blockchain for property title tracking
- **VR/AR Property Visualization**: Virtual tours of properties in portfolio

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgements

- All open-source libraries used in this project
- The real estate investment community for feedback and suggestions