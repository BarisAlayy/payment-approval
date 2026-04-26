# Payment Approval System

A web-based payment approval workflow for small and mid-sized companies. Finance teams create payment requests, managers approve or reject them, and finance staff completes the transfer with proof of payment — all tracked in one place.

The application is **brand-agnostic**: company name, logo, favicon and footer text can be customized from inside the system, so any organization can adopt the project without touching the source code.

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Material--UI](https://img.shields.io/badge/MUI-007FFF?logo=mui&logoColor=white)

---

## Features

- **Payment workflow**: pending → approved → completed, with a separate rejected list
- **Role-based access control** with four roles: admin, owner, finance, purchaser
- **Bilingual UI** (English / Turkish) — switchable on the fly, ~475 translation keys per language
- **File uploads**: invoice attachments and proof-of-payment receipts (PDF, JPEG, PNG)
- **Suppliers and Employees** modules with banking details to speed up payment entry
- **Customizable branding**: logo, favicon, company name, footer text — managed from the admin UI
- **Turkish IBAN validation**, positive amount checks and required-field validation server-side
- **JWT authentication** with bcrypt-hashed passwords
- **Responsive design** that works on phone, tablet and desktop
- **Optional notifications**: e-mail (Nodemailer) and SMS (NetGSM) — disabled by default

## Tech Stack

| Layer       | Technology                                                              |
|-------------|-------------------------------------------------------------------------|
| Backend     | Node.js, Express 4, Mongoose 8, Multer, bcrypt, jsonwebtoken            |
| Frontend    | React 18, Vite 6, Material-UI 6, Axios, react-router-dom 7, i18next     |
| Database    | MongoDB                                                                 |
| Deployment  | Apache / LiteSpeed reverse proxy via included `.htaccess`               |

---

## Quick Start

### Prerequisites

- Node.js 18 or newer
- MongoDB running locally on `mongodb://127.0.0.1:27017` (or any reachable URI)
- npm

### 1. Clone

```bash
git clone <repository-url>
cd payment-approval-mvg
```

### 2. Backend

```bash
cd backend
cp .env.example .env       # then edit .env (see Configuration below)
npm install
npm run setup              # creates default admin + payment types
npm run dev                # starts on http://localhost:5000
```

The `setup` script creates a default admin user:

| Field    | Value             |
|----------|-------------------|
| Username | `admin`           |
| Email    | `admin@example.com` |
| Password | `admin123`        |

> **Change this password after the first login** from the *Change Password* page.

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev                # starts on http://localhost:5174
```

Open <http://localhost:5174> and sign in with the default credentials. After logging in, head to **Branding** to upload your own logo and set the company name.

---

## Configuration

All backend configuration lives in `backend/.env`. A template is provided at `backend/.env.example`.

| Variable          | Default                                            | Description                                               |
|-------------------|----------------------------------------------------|-----------------------------------------------------------|
| `MONGO_URI`       | `mongodb://127.0.0.1:27017/payment-approval`       | MongoDB connection string                                 |
| `SECRET_KEY`      | *(required)*                                       | JWT signing secret — use a long random string             |
| `PORT`            | `5000`                                             | Backend HTTP port                                         |
| `NODE_ENV`        | `development`                                      | `development` or `production`                             |
| `ALLOWED_ORIGINS` | *(empty)*                                          | Comma-separated production origins for CORS               |
| `FRONTEND_URL`    | `http://localhost:5174`                            | Used in password-reset links sent by e-mail               |
| `MAIL_ENABLED`    | `false`                                            | Toggle Nodemailer for password reset / notifications      |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` | —                          | SMTP credentials (only when `MAIL_ENABLED=true`)          |
| `SMS_ENABLED`     | `false`                                            | Toggle SMS notifications                                  |
| `NETGSM_USERCODE`, `NETGSM_PASSWORD`, `NETGSM_MSGHEADER`, `NETGSM_BOSS_PHONES` | — | NetGSM credentials (only when `SMS_ENABLED=true`)        |

The Vite dev server proxies `/api` and `/uploads` to the backend, so the frontend has no separate config file.

---

## Roles and Permissions

| Role        | Can do                                                                          |
|-------------|---------------------------------------------------------------------------------|
| `admin`     | Manage users, branding, suppliers, employees, payment types, full payment view  |
| `owner`     | Approve / reject payments, view all payments                                    |
| `finance`   | Create payment requests, mark approved payments as completed, upload receipts   |
| `purchaser` | Create payment requests, view own and shared records                            |

Permissions are enforced both on the front end (menu visibility, button states) and on the back end through a `checkRole` middleware, so calling an API directly with the wrong role is also rejected with a `403`.

---

## Project Structure

```
payment-approval-mvg/
├── backend/
│   ├── controllers/        # Route handlers (auth, payments, users, etc.)
│   ├── middlewares/        # auth, role check, error handler, file uploads
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express routers
│   ├── scripts/            # createAdmin, createDefaultPaymentTypes
│   ├── services/           # smsService (NetGSM)
│   ├── utils/              # AppError, validators, i18n message catalog
│   ├── uploads/            # Branding logos and invoice files (gitignored)
│   ├── server.js           # Express entry point
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/     # Layout, Header, Footer, ErrorBoundary
│   │   ├── context/        # Auth, Branding, Language, Notification
│   │   ├── i18n/           # tr.json, en.json
│   │   ├── pages/          # Login, Dashboard, PaymentEntry, etc. (15 pages)
│   │   ├── routes/         # ProtectedRoute
│   │   ├── utils/          # axios instance, i18n error helper
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── vite.config.js
│   └── package.json
└── .htaccess               # Production reverse proxy for Apache / LiteSpeed
```

---

## API Overview

All endpoints live under `/api`. Authentication is via `Authorization: Bearer <token>` header (except for login, register, and password-reset endpoints).

| Method       | Endpoint                              | Description                            |
|--------------|---------------------------------------|----------------------------------------|
| `POST`       | `/api/auth/login`                     | Sign in, returns JWT                   |
| `POST`       | `/api/auth/register`                  | Create a new user (admin only)         |
| `GET`        | `/api/auth/verify`                    | Validate the current token             |
| `GET/POST`   | `/api/payments`                       | List / create payment requests         |
| `PATCH`      | `/api/payments/:id/approve`           | Approve a pending payment              |
| `PATCH`      | `/api/payments/:id/reject`            | Reject a pending payment               |
| `PATCH`      | `/api/payments/:id/complete`          | Mark approved payment as completed     |
| `POST`       | `/api/payments/:id/upload-invoice`    | Attach an invoice file                 |
| `GET`        | `/api/payments/:id/download-invoice`  | Download the invoice                   |
| `GET`        | `/api/payments/:id/download-proof`    | Download the proof of payment          |
| `CRUD`       | `/api/suppliers`                      | Supplier management                    |
| `CRUD`       | `/api/employees`                      | Employee management                    |
| `CRUD`       | `/api/users`                          | User management (admin)                |
| `CRUD`       | `/api/payment-types`                  | Payment-type management                |
| `GET/PUT`    | `/api/branding`                       | Read or update branding settings       |
| `POST`       | `/api/branding/logo`, `/favicon`      | Upload logo or favicon                 |

The server inspects the `Accept-Language` header and returns localized error messages (Turkish or English) along with a stable `errorCode` field.

---

## Production Deployment

A working `.htaccess` is included for Apache or LiteSpeed servers. It serves the built front-end static files from `frontend/dist/` and reverse-proxies any `/api/*` request to the Node backend on port `5000`.

Typical production steps:

```bash
# Build the frontend
cd frontend && npm run build

# Run the backend with a process manager
cd ../backend
NODE_ENV=production npm install --omit=dev
pm2 start server.js --name payment-approval
```

Remember to set `ALLOWED_ORIGINS` to your production domain so CORS allows browser requests from it.

---

## Scripts

### Backend

| Command                         | Description                                  |
|---------------------------------|----------------------------------------------|
| `npm run dev`                   | Start with `nodemon` (auto-reload)           |
| `npm start`                     | Start with plain `node`                      |
| `npm run create-admin`          | Create the default admin user                |
| `npm run create-payment-types`  | Seed eight default payment categories        |
| `npm run setup`                 | Run both seed scripts in order               |

### Frontend

| Command            | Description                       |
|--------------------|-----------------------------------|
| `npm run dev`      | Start Vite dev server             |
| `npm run build`    | Production build into `dist/`     |
| `npm run preview`  | Serve the production build locally |
| `npm run lint`     | Run ESLint                        |

---

## License

Released under the ISC License. See `package.json` for details.
