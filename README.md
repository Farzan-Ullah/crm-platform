# NexusCRM - Enterprise Multi-Tenant CRM Platform

> A production-ready CRM platform built with the MERN stack (JavaScript ES6+ exclusively), featuring multi-tenancy, granular RBAC, dual-token JWT authentication, and responsive modern SaaS architecture.

---

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Zustand, TanStack Query, React Hook Form, Zod, React Hot Toast, date-fns, Axios.
- **Backend**: Node.js, Express.js (ES6 Modules), MongoDB 7, Mongoose 8, JWT (HTTP-Only Cookies), bcryptjs, Zod, Winston, Helmet, CORS, express-rate-limit.
- **Testing**: Jest, Supertest.

---

## Getting Started

### Prerequisites
- **Node.js**: v20+ LTS
- **MongoDB**: v7+ running on `localhost:27017`

### 1. Installation
Install all dependencies across root, server, and client with:

```bash
# In the workspace root:
npm install

# In server directory:
cd server && npm install

# In client directory:
cd ../client && npm install
```

### 2. Environment Configuration
The `.env` files are already configured for development.

- `server/.env`
  ```env
  NODE_ENV=development
  PORT=5000
  CLIENT_URL=http://localhost:5173
  MONGO_URI=mongodb://127.0.0.1:27017/crm_platform
  JWT_SECRET=super_secret_crm_jwt_access_key_min_32_characters_long_12345
  JWT_REFRESH_SECRET=super_secret_crm_jwt_refresh_key_min_32_characters_long_67890
  JWT_ACCESS_EXPIRES_IN=15m
  JWT_REFRESH_EXPIRES_IN=7d
  ```

### 3. Database Seeding
Seed the initial enterprise tenant and test accounts:

```bash
npm run seed
```

This creates:
- **Tenant**: Acme Enterprise Solutions (`acme`)
- **Admin**: `admin@crm.io` | `Password123!`
- **Sales Manager**: `manager@crm.io` | `Password123!`
- **Sales Executive 1**: `rep1@crm.io` | `Password123!`
- **Sales Executive 2**: `rep2@crm.io` | `Password123!`
- **Sales Executive 3**: `rep3@crm.io` | `Password123!`
- **Support Agent**: `support@crm.io` | `Password123!`
- **Sales Teams**: Inbound Velocity Team, Strategic Enterprise Outbound
- **Sample Leads**: 20 pre-scored and assigned prospective leads

### 4. Running the Platform
Run both backend API (:5000) and frontend SPA (:5173) concurrently:

```bash
npm run dev
```

Or run them individually:
- Backend: `npm run server` (starts on `http://localhost:5000`)
- Frontend: `npm run client` (starts on `http://localhost:5173`)

### 5. Running Automated Tests
Run the backend test suite:

```bash
npm run test:server
```

---

## Phase 1 & Phase 2 Capabilities

- **Multi-Tenancy & Security**: Tenant context (`tenantId`) auto-attached and enforced across users, leads, and sessions.
- **Dual-Token Authentication**:
  - `accessToken`: 15-minute validity, stored in HTTP-only cookie.
  - `refreshToken`: 7-day validity, hashed and stored in database session with token rotation.
  - Automatic silent refresh via Axios response interceptors.
- **Granular RBAC**: Four roles (`ADMIN`, `SALES_MANAGER`, `SALES_EXECUTIVE`, `SUPPORT_AGENT`) with permission guards.
- **Leads Management**:
  - Full CRUD with server pagination, search, status, source, and score range filters.
  - Bulk actions: bulk status update, bulk assignment, and bulk delete.
  - Configurable Lead Scoring Engine (+10 email, +10 phone, +10 company, +20 website inquiry, +15 executive designation, +25 referral).
  - Categorical score badges: Very Hot (80-100), Hot (60-79), Warm (30-59), Cold (0-29).
  - Automated workload-balanced Round-Robin assignment across active sales reps.
  - Public Web-to-Lead endpoint (`POST /api/v1/public/leads`) with rate limiting and anti-spam honeypot.
  - User and Team administration interface in Settings.
