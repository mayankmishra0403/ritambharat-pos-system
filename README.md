<h1 align="center">🍽️ ChefOS</h1>

<p align="center">
  <strong>Smart QR-Based 3D Menu, Real-time Ordering & Kitchen Display System</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101" alt="Socket.io" />
</p>

---

## 📖 Project Description

**ChefOS** is a comprehensive, production-grade MERN stack SaaS application tailored for restaurants, cafes, and modern dining establishments. Designed to streamline operations, it offers an end-to-end QR-based digital menu experience with interactive 3D models while seamlessly connecting customers to a robust real-time ordering and kitchen display system. Through its diverse sets of features, including multi-tenant support for restaurant owners, AI-driven dish recommendations, inventory tracking, analytics, and secure payment processing, ChefOS empowers modern dining businesses to rapidly digitize and scale their infrastructure.

## 🔗 Live Demo & Repository
> **Live Deployment:** [https://chefos.pro](https://chefos.pro)  
> **GitHub Repository:** [https://github.com/Asim12312/ChefOS.git](https://github.com/Asim12312/ChefOS.git)

## 📸 Screenshots

Here is a glimpse of the ChefOS platform across different modules:

### Landing Page
![Landing Page](./snips/landing.PNG)

### Authentication
**Login**  
![Login](./snips/login.PNG)

**Registration**  
![Signup](./snips/signup.PNG)

### Owner/Admin Interface
**Dashboard Analytics**  
![Dashboard](./snips/dashboard.PNG)

**Order Management System**  
![Orders](./snips/orders.PNG)

**QR Code Management**  
![QR Management](./snips/qr%20management.PNG)

**Team Management**  
![Team Management](./snips/team%20mangement.PNG)

**Business Timings Configuration**  
![Timing Configuration](./snips/timing.PNG)

**Settings & Configuration**  
![Settings](./snips/settings.PNG)

**Chef AI Insights**  
![AI Integration](./snips/AI.PNG)

### Invoicing & Billing
**Customer Bill**  
![Customer Bill](./snips/customer%20bill.PNG)

**Detailed Invoice**  
![Bill Invoice](./snips/bill.PNG)

## ✨ Features

- **Multi-Role Authentication & Authorization:** Secure, role-based access for Admins, Restaurant Owners, Staff, and Customers using JWT and Google OAuth.
- **Smart QR & 3D Interactive Menus:** Customers can scan a unique QR code per table, browse dynamic digital menus, and engage with `@react-three/fiber` driven 3D visualizations.
- **Real-Time Order & Kitchen Display System:** Lightning-fast WebSocket (`socket.io`) powered synchronization across the customer app and kitchen displays.
- **Secure Payments & Subscriptions:** Full checkout processing seamlessly integrated with multiple payment gateways (Razorpay & Stripe).
- **AI-Powered Recommendations:** Leverage `Google Generative AI` to offer tailored dish suggestions and automated interactive workflows.
- **Advanced Inventory & Menu Management:** Owners can track real-time stock levels, manage item listings, handle categories, and receive automated inventory alerts.
- **Analytics & Dashboard Reporting:** Deep insights for owners covering daily sales trajectories, trending orders, and customer sentiment analytics.
- **Omnichannel Communication:** Pre-integrated WhatsApp and Voice route APIs for modernized automated restaurant communications.
- **Responsive UI:** A fully optimized, mobile-first design leveraging Tailwind CSS and Framer Motion for beautiful micro-interactions.

## 🛠️ Tech Stack

### **Frontend**
- **Library:** React.js (v19)
- **Styling:** Tailwind CSS (v4)
- **Data Fetching:** Axios
- **State Management & Routing:** React Router v6
- **Real-time Client:** Socket.io-client

### **Backend**
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Caching/Rate-Limiting:** Redis
- **Security & Integrity:** Helmet, CORS, Express-Validator, BcryptJS
- **Authentication:** JWT, Passport.js (Google OAuth20)
- **File Uploads:** Cloudinary, Multer
- **Real-time Engine:** Socket.io
- **AI Integration:** `@google/generative-ai`

## 🏗️ System Architecture Overview

ChefOS utilizes a robust Model-View-Controller (MVC) approach on the backend combined with a reactive, component-driven frontend. 
- The **Client Layer** communicates securely via RESTful APIs for transactional data (e.g. Auth, Crud Ops) and WebSocket channels for instant, bidirectional real-time events (Orders, Status Updates).
- The **Service Layer** integrates third-party pipelines such as Stripe for payments, Cloudinary for static assets, and Google Generative AI for recommendation models.
- The **Data Layer** guarantees ACID-like structures through MongoDB & Redis for high-performant cache delivery and real-time locking mechanisms to prevent double orders.

## 📂 Folder Structure

```text
ChefOS/
├── backend/
│   ├── config/           # Environment & DB connection settings
│   ├── controllers/      # Route handlers & core business logic
│   ├── models/           # Mongoose schemas (User, Order, Menu etc.)
│   ├── routes/           # Express API route endpoints
│   ├── utils/            # Helper functions, middleware, custom validators
│   ├── package.json      # Backend dependencies & metadata
│   └── server.js         # Express Server Bootstrapper
│
├── src/                  # React Frontend Source View
│   ├── assets/           # Static images, icons, and 3D models
│   ├── components/       # Reusable React UI Components
│   ├── context/          # State Context Providers
│   ├── hooks/            # Custom reusable hooks
│   ├── pages/            # View Pages (Auth, Customer Cart, Owner Dashboard)
│   ├── App.jsx           # Main component & Routing configuration
│   └── main.jsx          # React DOM mounting entry point
│
├── public/               # Publicly served static files
├── package.json          # Frontend dependencies & metadata
└── tailwind.config.js    # Tailwind Utility Definitions
```

## 🔌 API Endpoints Documentation

A concise look at standard application APIs (Bearer Authentication required for protected routes):

### Authentication
- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Authenticate & receive JWT
- `GET /api/auth/me` - Fetch authenticated user profile

### Role: Owner/Admin
- `POST /api/restaurant/create` - Initialize restaurant profile
- `GET /api/menu/:restaurantId` - Comprehensive menu fetch
- `POST /api/inventory/update` - Update item stock details
- `GET /api/analytics/dashboard` - Retrieve aggregated reporting

### Role: Customer
- `GET /api/table/:tableId` - Scan & activate specific table session
- `POST /api/order/create` - Dispatch new active order
- `POST /api/payment/checkout` - Create Stripe Payment Intent

### AI Integrations
- `POST /api/ai/recommend` - Query Google Generative AI for customized suggestions

## 🚀 Installation and Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or Atlas URI)
- [Redis](https://redis.io/) (for caching layers)
- [Git](https://git-scm.com/)

### 1. Clone the repository
```bash
git clone https://github.com/Asim12312/ChefOS.git
cd ChefOS
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

### 3. Frontend Setup
Navigate back to the frontend (root directory) and install UI dependencies:
```bash
npm install --legacy-peer-deps
```

## 🔐 Environment Variables (.env example)

Create a `.env` file in the root backend configuration (`backend/`) overriding default settings:

```env
# Backend Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Connection
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chefos

# Authentication Flags
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_secret

# External Integrations
STRIPE_SECRET_KEY=sk_test_123456789
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_google_generative_ai_key
REDIS_URL=redis://localhost:6379
```

Also configure environment variables natively for the Frontend (`.env` in the root directory):
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_STRIPE_PUBLIC_KEY=your_stripe_key
```

## 🏃‍♂️ Running the Application

To experience the system functionally in a development environment, initiate both servers concurrently.

**Start the Backend Server (Express/Socket.io)**
```bash
cd backend
npm run dev
```
*The backend should default to `http://localhost:5000`*

**Start the Frontend Server (Vite Development)**
*(In a new terminal)*
```bash
npm run dev
```
*The frontend should typically default to `http://localhost:5173`*

## 🧪 Testing

Comprehensive end-to-end testing and unit testing coverage using Jest (Backend) and React Testing Library (Frontend):

```bash
# Backend Automated Teardowns
cd backend
npm run test

# Run ESLint validation locally
npm run lint
```

## 🌐 Deployment

ChefOS operates seamlessly using scaling providers like Vercel and Render:

1. **Frontend**: Simply link the Github repository natively via Vercel. Pushing the `main` branch to Vercel builds the Vite-based output.
2. **Backend**: Utilize Docker, Render Web Services, or AWS EC2. Remember to set `.env` environmental properties natively on the deployment server host.
3. **Database**: We highly advise MongoDB Atlas for multi-AZ clusters globally scoped.

## 🚀 Future Improvements

- [ ] Complete Multi-language localization configuration (i18n)
- [ ] Migrate component state to robust custom Server-Sent Events architecture for fallbacks where Sockets are disabled
- [ ] Extend AI capabilities towards automated predictive inventory restocking formulas
- [ ] Implement deeper WebRTC functionalities for instant-call staff options from Tables
- [ ] Incorporate comprehensive end-to-end testing workflows via Cypress

## 👨‍💻 Author

**Muhammad Asim**  
*MERN Stack Architect / Full Stack Engineer*  
- [GitHub Profile](https://github.com/Asim12312)

## 📄 License

This project is licensed under the **ISC License**. Refer to the underlying backend initialization flags or package instructions for comprehensive terms regarding open-source usage.
