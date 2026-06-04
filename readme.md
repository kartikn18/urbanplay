# TurfBook — Turf Booking Platform

A full-stack turf booking application with real-time slot management, Razorpay payment integration, background job processing, and location-based search. Built with Node.js, TypeScript, React, PostgreSQL, and Redis.

---

## Tech Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (via Kysely query builder)
- **Cache / Locks**: Redis (ioredis + Upstash)
- **Queue**: BullMQ (background jobs)
- **Payments**: Razorpay
- **Email**: Resend
- **File Storage**: Cloudinary
- **Auth**: JWT (access + refresh token rotation)
- **Validation**: Zod
- **Geocoding**: Nominatim (OpenStreetMap)

### Frontend
- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **HTTP**: Axios (with interceptors)
- **3D Hero**: React Three Fiber + Drei
- **Toasts**: Sonner

---

## Features

### Authentication
- JWT-based auth with short-lived access tokens (15m) and rotating refresh tokens (7d)
- Refresh tokens stored hashed in PostgreSQL
- Automatic token rotation on 401 via Axios response interceptor
- OTP-based forgot password flow with 10-minute expiry and bcrypt hashing
- Role-based access control (user / admin)
- Rate limiting on login, OTP requests, and OTP verification attempts

### Turf Search
- Location-based turf search using the **Haversine formula** in SQL
- Geocodes city names to coordinates via Nominatim
- Filter by city (required), turf name (optional), and radius in km (default 10km)
- Multiple images per turf stored in `turf_images` table

### Slot Booking & Payments
- Slots soft-locked in Redis for 10 minutes on order creation (prevents double booking)
- Razorpay order created server-side; amount never trusted from client
- Payment signature verified server-side using HMAC-SHA256
- Order context (amount, userId, slotId, turfId) stored in Redis for tamper detection
- Idempotent payment verification (duplicate `razorpay_payment_id` returns existing booking)
- Atomic DB transaction: mark slot booked → create booking → record payment
- PDF receipt generated with PDFKit and uploaded to Cloudinary on successful payment

### Background Jobs (BullMQ + Redis)
- OTP emails queued with 3 retries and exponential backoff
- Booking confirmation email sent asynchronously after payment
- Failed payment email triggered on signature failure, slot conflict, or amount mismatch
- Admin notification email sent to the turf owner on each successful booking

### Admin
- Create turfs with up to 5 images (multipart upload via Multer → Cloudinary)
- Geocoding runs on address at creation time (lat/lng stored in DB)
- Create slots with overlap detection
- Delete turfs and slots
- All admin routes protected by JWT + role check middleware

### User Dashboard
- Booking history with turf name, slot time, amount paid, payment status
- Download PDF receipt per booking
- Soft-locked slots hidden from slot picker in real time (polled every 8 seconds)

---

## Project Architecture

```
src/
├── config/             # DB, Redis, Cloudinary, Razorpay, Multer
├── db/                 # Kysely schema types
├── middlewares/        # Auth, role check, Zod validation, rate limiting
├── modules/
│   └── auth/
│       ├── auth.*      # Signup, login, OTP, password reset, token rotation
│       ├── admin/      # Turf & slot management
│       └── user/       # Search, slots, dashboard
├── payments/           # Order creation, payment verification
├── queues/             # BullMQ queue definitions
├── utils/              # JWT, geocode, Cloudinary upload, PDF receipt
├── workers/            # OTP, booking email, failed payment, admin notification
└── index.ts            # App entry point

frontend/
├── src/
│   ├── api/            # Axios instance + token store
│   ├── components/     # Navbar, SlotPicker, CountdownTimer, TurfCard, etc.
│   ├── context/        # AuthContext (token in memory, decoded from JWT)
│   ├── pages/          # Landing, Login, Signup, Search, TurfDetail, Payment, etc.
│   └── types/          # Shared TypeScript types + Razorpay global declarations
```

---

## Key Design Decisions

**Double booking prevention** — When a user starts checkout, the slot ID is locked in Redis with a 10-minute TTL (`SETEX`). Any concurrent request for the same slot returns "already reserved". After payment is confirmed the key is deleted; if payment is abandoned the key expires automatically.

**No client-trusted amounts** — The payment amount is taken from the Razorpay order stored in Redis at order creation time, not from the incoming verify request. This prevents a client from sending a modified amount.

**Token security** — Refresh tokens are bcrypt-hashed before storage. The raw token is only ever sent in an `httpOnly` cookie. Access tokens are stored in memory (React context + module-level variable), never in `localStorage`.

**Atomic booking** — The slot update, booking insert, and payment insert all run inside a single Kysely transaction. If any step fails, the entire operation rolls back.

**Async emails** — All email sending (OTP, confirmation, failed payment, admin alert) runs through BullMQ workers with retry logic so API response times are not affected by email delivery latency.

---

## Getting Started

### Prerequisites
- Node.js >= 18
- PostgreSQL 15
- Redis 7

### Backend Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in values (see Environment Variables section)

# Create database tables
# Run the SQL in src/migrations/tables.sql against your PostgreSQL database

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:5000`.

---

## Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/turf

# JWT
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Redis (local ioredis for workers)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Redis (Upstash for app-level operations)
REDIS_URL=https://your-upstash-url
REDIS_TOKEN=your_upstash_token

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Resend
RESEND_API_KEY=re_xxxx
```

---

## API Reference

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/signup` | — | Register with email, password, role |
| POST | `/api/auth/login` | — | Login, returns access token + sets refresh cookie |
| POST | `/api/auth/forgot-password` | — | Send OTP to email |
| POST | `/api/auth/verify-otp` | — | Verify OTP |
| POST | `/api/auth/reset-password` | — | Reset password |
| POST | `/api/auth/rotate-token` | Cookie | Rotate refresh token |

### User
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/user/turfs/search` | — | Search turfs by city, name, radius |
| GET | `/api/user/turfs/:turfId/slots` | — | Get available slots for a turf |
| GET | `/api/user/dashboard` | ✅ | Booking history with receipts |

### Payments
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/turf/:turfId/slots/:slotId/orders` | ✅ | Create Razorpay order + reserve slot |
| POST | `/api/payments/verify` | ✅ | Verify payment + confirm booking |

### Admin
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/admin/turf` | ✅ Admin | Create turf (multipart, up to 5 images) |
| POST | `/api/admin/slot` | ✅ Admin | Create slot |
| POST | `/api/admin/deleteturf` | ✅ Admin | Delete turf |
| POST | `/api/admin/deleteslot` | ✅ Admin | Delete slot |

---

## Payment Flow

```
1. User selects a slot on the turf detail page
2. Frontend calls POST /api/turf/:turfId/slots/:slotId/orders
   → Slot locked in Redis for 10 minutes
   → Razorpay order created server-side
   → Order context saved to Redis
3. Frontend opens Razorpay checkout modal
4. User completes payment in modal
5. Razorpay returns { razorpay_order_id, razorpay_payment_id, razorpay_signature }
6. Frontend calls POST /api/payments/verify
   → Redis reservation validated
   → HMAC signature verified
   → Amount validated against Redis order context
   → DB transaction: slot booked, booking created, payment recorded, receipt generated
   → Redis keys cleaned up
   → Confirmation email queued
7. Frontend redirects to /booking-confirmation
```

---

## Background Job Queues

| Queue | Worker | Retries | Trigger |
|-------|--------|---------|---------|
| `otpQueue` | `worker.otps.ts` | 3 (exponential) | Forgot password |
| `bookingEmailQueue` | `worker.booking.ts` | 1 | Payment confirmed |
| `failedPaymentQueue` | `worker.booking.ts` | 3 (exponential) | Payment failure |
| `adminNotificationQueue` | `adminnotification.ts` | 3 (exponential) | Payment confirmed |

---

## Database Schema

```
users               — id, email, password (bcrypt), role, created_at
otps                — id, email, otp (bcrypt), expires_at
refresh_tokens      — id, user_id, token (bcrypt), role, expires_at
turfinfo            — id, name, location, description, lat, lng, price_per_hour, image_url, created_by
turf_images         — id, turf_id, url, sort_order
slots               — id, turf_id, start_time, end_time, is_booked
bookings            — booking_id, user_id, slot_id, turf_id, status
payments            — id, booking_id, user_id, razorpay_order_id, razorpay_payment_id, amount, payment_status, recipts_url
```

---

## License

MIT