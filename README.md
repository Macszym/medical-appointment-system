# Medical Appointment System

Full-stack web application for managing medical visit scheduling. Built as a project for AGH's **Programowanie Aplikacji Webowych** (Web Application Programming) course.

## Features

- Registration and login with JWT
- Three roles: **patient**, **doctor**, **admin**
- Weekly calendar view of appointments
- Patients can browse doctors and book appointments
- Doctors manage their availability
- Doctor rating system
- Appointment shopping cart (book several visits at once)
- Admin panel

## Tech stack

**Frontend** — React 19.2 · TypeScript · Material UI 7.3 · React Router · Axios · RxJS · `date-fns` · Vite

**Backend** — Node.js · Express · MongoDB · Mongoose · JWT · bcryptjs

## Setup

### Prerequisites
- Node.js 20+
- A MongoDB instance (local or Atlas free tier)

### Backend

```bash
cd backend
cp .env.example .env   # then fill in your own MongoDB URI and JWT secrets
npm install
npm run dev
```

### Frontend (in a separate terminal, from the repo root)

```bash
npm install
npm run dev
```

Backend listens on `http://localhost:3001`, frontend on `http://localhost:5173`.

## Project structure

```
medical-appointment-system/
├── backend/
│   ├── models/        # Mongoose schemas (User, Doctor, Appointment, …)
│   ├── controllers/   # Business logic
│   ├── routes/        # API endpoints
│   ├── middleware/    # Auth middleware
│   └── server.js      # Entry point
└── src/
    ├── components/    # Reusable UI components
    ├── contexts/      # React context providers
    ├── pages/         # Route pages
    ├── services/      # API client
    └── utils/         # Helpers
```

## A note

Course project — solid as a learning piece, but production deployment would still need: refresh-token rotation, rate limiting, proper email verification, an audit log, and JWT secrets moved to a managed secrets provider.
