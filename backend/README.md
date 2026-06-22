# ⚙️ ChefOS Backend: The Engine of Restaurant Intelligence

Welcome to the **ChefOS Backend**, a high-performance, real-time API and server ecosystem designed to handle the complex operations of a modern, data-driven restaurant.

This backend isn't just a database wrapper—it's a multi-service engine that coordinates AI-driven guest interactions, real-time kitchen synchronization, secure financial transactions, and predictive analytics.

---

## 🏛 Architectural Overview

The backend is built as a **decoupled, service-oriented Node.js/Express architecture**. 

### Core Tech Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Caching**: Redis (High-speed session & API caching)
- **Real-Time**: Socket.io (Room-based synchronization)
- **AI Engine**: Google Generative AI (Gemini)
- **Security**: Passport.js + JWT + Helmet

---

## 🚀 Key Technical Domains

### 🤖 Chef AI: Intelligent Contextual RAG
Located in `controllers/ai.controller.js`, our AI engine leverages Google's Gemini models. Unlike generic chatbots, Chef AI uses a **"RAG-lite" (Retrieval-Augmented Generation)** approach:
- **Dynamic Context**: On every query, the system fetches the specific restaurant's menu data and description.
- **Context Injection**: The AI is fed real-time availability and descriptions to ensure it never recommends a dish that isn't currently available.
- **Constraint-Based Logic**: Strictly enforced guidelines prevent the AI from hallucinations regarding pricing or dietary safety.

### 📡 LiveSync: Real-Time Operational Rooms
Using Socket.io, we implement a **Room-Based Topology**:
- **`restaurant:id` Rooms**: Kitchen staff and waiters stay in sync with live order state changes instantly across all devices.
- **`order:id` Rooms**: Customers receive live updates on their specific meal's progression from "Preparing" to "Ready".

### 🔐 Scalable RBAC & Security
Security is baked into the routing layer:
- **Role-Based Access Control (RBAC)**: Custom middleware (`checkRole.js`, `checkPermission.js`) ensures that a waiter cannot access financial analytics and a kitchen staff member cannot modify pricing.
- **Passport.js Integration**: Multi-strategy authentication (Local + Google OAuth).
- **Security Middleware**: Automated protection via Helmet, Rate Limiting, and CORS sanitization.

### 💳 Financial Fidelity
Integration with **Razorpay & Stripe** ensures secure transactions.
- **Webhook Integrity**: `payment.controller.js` implements cryptographic signature verification to prevent spoofing.
- **Subscription Management**: Automated lifecycle management for restaurant plans (Basic/Pro/Enterprise).

---

## 📁 Project Structure

```bash
├── config/             # DB, Redis, Passport, and Cloudinary configs
├── controllers/        # Business logic handlers (MVC)
├── middleware/         # Auth, RBAC, Error Handling, Rate Limiting
├── models/             # Mongoose schemas (Unified Domain Models)
├── routes/             # API endpoint definitions
├── services/           # External integrations (AI, Email, Payments)
├── utils/              # Shared logic, Loggers, Environment validators
└── server.js           # Server entry point & Socket.io orchestration
```

---

## 🛠 Setup & Development

### 1. Prerequisites
- **Node.js**: v18 or later
- **MongoDB**: Local instance or Atlas URI
- **Redis**: Required for caching features
- **Gemini AI Key**: For Chef AI functionality

### 2. Installation
```bash
npm install
```

### 3. Configuration
Copy `.env.example` to `.env` and populate the required keys.

### 4. Running
```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

---

## 📈 Monitoring & Health
The server includes a built-in health monitoring system:
- **Endpoint**: `GET /health`
- **Logging**: Integrated with **Winston** for structured JSON logging across different environments.
- **Error Handling**: Standardized `errorHandler.js` that masks stack traces in production while providing detailed logs.

---

© 2026 **ChefOS Intelligence**. Engineered for the modern culinary industry.
