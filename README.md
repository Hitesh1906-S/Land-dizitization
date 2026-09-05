# BhoomiSetu (भूमि सेतु)
### Intelligent Land Record Digitization and Validation System
*Smart India Hackathon (SIH) Production-Grade Architecture*

---

## 🏛️ System Overview

BhoomiSetu is an end-to-end, multi-tier intelligent land record digitization, validation, and dispute management platform. It transforms legacy paper land records (e.g. Jamabandi, 7/12 extracts, and Title Deeds) into cryptographically verifiable, geo-referenced digital cadastral parcels.

### 🌟 Key Pillars

1. **Role-Based Portals**:
   - **Citizen**: Search registry, review owned parcels, apply for mutation / digitization, track application pipelines.
   - **Revenue Officer**: Audit OCR extractions side-by-side with original scanned documents, resolve spatial boundary overlaps, approve mutations.
   - **Administrator**: Inspect immutable audit trails, manage officer jurisdictions, configure OCR fallback thresholds.
2. **AI & Multimodal OCR Pipeline**:
   - Asynchronous document processing with SHA-256 tamper-proof checksum verification.
   - Multimodal Gemini 2.5 Flash / Tesseract OCR adapters for bilingual & vernacular land records.
3. **Multi-Tier Validation Engine**:
   - **Syntactic**: Khasra / Khatauni / ULPIN format rules.
   - **Arithmetic**: $\sum \text{Owner Shares} == 100\%$.
   - **Cadastral & Spatial Consistency**: Turf.js / PostGIS boundary overlap and deed vs GIS area deviation tolerance.
4. **Cadastral GIS Engine**:
   - Interactive Leaflet-based geo-referenced parcel map with status overlays (🟢 Verified, 🟡 Under Review, 🔴 Disputed/Overlapping).

---

## 📂 Architecture & Project Structure

```
land-digitization/
├── client/                     # Frontend Application (Vite + React + TS + Tailwind + Leaflet)
│   ├── src/
│   │   ├── components/         # Common buttons, badges, stat cards, layouts, and Leaflet map
│   │   ├── context/            # AuthContext (JWT + LocalStorage session)
│   │   ├── pages/              # Citizen, Officer, Admin, Public Registry & GIS maps
│   │   ├── routes/             # Protected and Role-Based AppRoutes
│   │   └── services/           # Axios client with request & response interceptors
├── server/                     # Backend API (Node.js + Express + TypeScript + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma       # 10 core entities, relations, indexes & enums
│   │   └── seed.ts             # Initial default users (Admin, Officer, Citizen) & sample parcel
│   ├── src/
│   │   ├── config/             # Zod-validated environment config and Prisma singleton
│   │   ├── controllers/        # Express REST controllers
│   │   ├── middleware/         # JWT auth, RBAC, jurisdiction enforcement, upload & error handlers
│   │   ├── routes/             # Versioned API routes (/api/v1/*)
│   │   ├── services/           # Domain services (Auth, Record, Document, OCR, Validation, GIS, Workflow, Audit)
│   │   └── utils/              # AppError hierarchy, responseFormatter, crypto hashing
└── shared/                     # Shared TypeScript domain types, DTOs, Enums, and GeoJSON schemas
```

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Check `server/.env` (configured with default values for local development).

### 3. Generate Prisma Client & Database
```bash
npm run prisma:generate
# To push schema to PostgreSQL:
npm run prisma:push
# To seed demo users:
npm run prisma:seed
```

### 4. Run Development Servers
```bash
# Run both Frontend & Backend concurrently:
npm run dev

# Or independently:
npm run dev:server   # API Server on http://localhost:5000/api/v1
npm run dev:client   # Vite App on http://localhost:5173
```

---

## 🔑 Default Seed Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@bhoomisetu.gov.in` | `Password@123` |
| **Revenue Officer** | `officer.jaipur@bhoomisetu.gov.in` | `Password@123` |
| **Citizen** | `citizen@example.com` | `Password@123` |

---

## 📡 Core API Boundaries (`/api/v1`)

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/api/v1/health` | `GET` | Public | System status and uptime |
| `/api/v1/auth/register` | `POST` | Public | Register new citizen or officer account |
| `/api/v1/auth/login` | `POST` | Public | Authenticate user & issue JWT |
| `/api/v1/records` | `GET` | Public | Filtered land record search |
| `/api/v1/records/:id` | `GET` | Public | Retrieve land parcel details and geometry |
| `/api/v1/records` | `POST` | Officer/Admin | Create new land record |
| `/api/v1/documents/upload` | `POST` | Auth | Upload document with SHA-256 hash |
| `/api/v1/ocr/process` | `POST` | Auth | Queue AI/OCR field extraction job |
| `/api/v1/ocr/job/:jobId` | `GET` | Auth | Query OCR extraction status |
| `/api/v1/validation/verify` | `POST` | Auth | Run multi-tier validation checks |
| `/api/v1/gis/parcels` | `GET` | Public | GeoJSON cadastral layer for village |
| `/api/v1/workflows` | `GET` | Auth | List mutation & digitization applications |
| `/api/v1/workflows` | `POST` | Citizen | Submit new mutation application |
| `/api/v1/workflows/:id/stage`| `PATCH` | Officer/Admin | Progress mutation application stage |
| `/api/v1/audit` | `GET` | Officer/Admin | Query tamper-proof audit trail logs |
