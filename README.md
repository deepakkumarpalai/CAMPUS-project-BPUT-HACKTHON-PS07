# Smart Campus — Unified Campus Information & Service Platform

A full-stack web application for students, faculty, and administrators. Campus notices, attendance, leave, complaints, certificates, gate pass, and service requests live in one internet-connected platform.

The system uses MongoDB Atlas as the only database. There is no offline mode, IndexedDB, PWA sync, or browser-local database.

## 1. Project overview

Students and faculty should not need separate departmental systems for everyday campus services. This platform provides:

- Role-based access (STUDENT, FACULTY, ADMIN)
- JWT authentication
- Request workflows with human review
- AI-assisted complaint classification and priority **recommendations** (never irreversible automatic decisions)
- Admin analytics from real database records
- Exam timetables and student results
- Campus problem sharing with phone and WhatsApp contact links
- Event and college-holiday announcements with student/faculty notifications
- Student course-fee balances and Razorpay test-mode checkout

## 2. Features

**Students:** sign in with registration number and administrator-set date of birth; profile, notices, event hub, exam timetable and marks, attendance, leave, complaints, campus problem interactions, course-fee balances and payment history, certificates, gate pass, campus services, notifications.

**Faculty:** profile, notices, event hub, exam timetable, attendance marking, leave review, complaint/service handling, campus problem interactions, notifications.

**Administrators:** dashboards, user management, notices, event and holiday publishing, exam schedules and results, course-fee management, attendance, complaints with AI review, leave, certificates, gate pass, services, analytics, notifications.

Student DOB sign-in is enabled from Admin → Students → Set DOB login. The date is stored only as a bcrypt hash. Faculty/admin sign-in remains email and password. Imported academic registration numbers match a student account's `Student ID`; add or update that ID in the student account before expecting the student to see imported results.

## 3. Technology stack

**Frontend:** React, Vite, React Router DOM, Axios, Context API, Lucide React, Tailwind CSS, Recharts.

**Backend:** Node.js, Express, MongoDB Atlas, Mongoose, JWT, bcryptjs, dotenv, CORS, Helmet, express-rate-limit, Multer.

**AI:** Backend-only AI service with OpenAI-compatible API when `AI_API_KEY` is set, plus a rule-based fallback when the provider is unavailable.

## 4. Folder structure

```
campus project/
├── backend/     Express API, Mongoose models, AI service
├── frontend/    React SPA
└── README.md
```

Backend follows MVC: `models/`, `controllers/`, `routes/`, `middleware/`, `services/`, `validators/`.

Frontend uses `pages/`, `layouts/`, `components/`, `services/`, `context/`.

## 5. MongoDB Atlas setup

1. Create a cluster and database user in MongoDB Atlas.
2. Allow network access (your IP or `0.0.0.0/0` for a hackathon demo).
3. Put the connection string in `backend/.env` as `MONGO_URI`.
4. Use a database name such as `smart-campus`.

The React app never connects to MongoDB.

## 6. Environment variables

`backend/.env`

```
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=<YOUR_MONGODB_ATLAS_CONNECTION_STRING>
JWT_SECRET=<YOUR_STRONG_JWT_SECRET>
JWT_EXPIRES_IN=7d
AI_API_KEY=<YOUR_AI_API_KEY>
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
DEMO_ADMIN_PASSWORD=<SET_A_UNIQUE_DEMO_PASSWORD>
DEMO_FACULTY_PASSWORD=<SET_A_UNIQUE_DEMO_PASSWORD>
DEMO_STUDENT_PASSWORD=<SET_A_UNIQUE_DEMO_PASSWORD>
```

`frontend/.env`

```
VITE_API_URL=http://localhost:5000/api
```

Never put `MONGO_URI`, `JWT_SECRET`, `AI_API_KEY`, or `RAZORPAY_KEY_SECRET` in the frontend. Payments are restricted to Razorpay test keys (`rzp_test_...`) so this setup cannot take live charges.

## 7. Backend installation

```bash
cd backend
npm install
```

## 8. Frontend installation

```bash
cd frontend
npm install
```

## 9. Running the application

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Open http://localhost:5173

The API health check is http://localhost:5000/api/health

## 10. Seed demo data

Demo records are labeled `DEMO` / `isDemo: true` and are intended for hackathon walkthroughs, not production users.

```bash
cd backend
npm run seed
```

| Role | Email | Password setting |
| --- | --- | --- |
| Admin | admin@campus.edu | `DEMO_ADMIN_PASSWORD` in `backend/.env` |
| Faculty | faculty@campus.edu | `DEMO_FACULTY_PASSWORD` in `backend/.env` |
| Student | student@campus.edu | `DEMO_STUDENT_PASSWORD` in `backend/.env` |

Set unique demo passwords in `backend/.env` before running the seed command. The seed script clears previous demo users and sample collections, then inserts clearly labeled sample notices, attendance, complaints (including related water complaints), leave, certificates, gate pass, and service requests.

## 11. API documentation

Base URL: `http://localhost:5000/api`

Authenticated routes require `Authorization: Bearer <token>`.

| Method | Path | Access |
| --- | --- | --- |
| POST | /auth/register | Public |
| POST | /auth/login | Public |
| GET | /auth/me | Authenticated |
| GET/PUT/DELETE | /users, /users/:id | Role-restricted |
| GET | /users/stats/dashboard | Admin |
| CRUD | /notices | View: all roles; write: admin |
| GET/POST/PUT/DELETE | /attendance | Student view; faculty/admin write |
| GET | /attendance/summary | Authenticated |
| GET/POST/PUT | /leave | Student create; faculty/admin review |
| GET/POST/PUT/DELETE | /complaints | Student/faculty create; faculty/admin update |
| GET | /complaints/analytics/summary | Admin |
| GET/POST/PUT | /certificates | Student create; admin update |
| GET/POST/PUT | /gate-pass | Student create; faculty/admin update |
| GET/POST/PUT | /campus-requests | Student/faculty create; staff update |
| GET | /notifications | Authenticated |
| GET | /notifications/unread-count | Authenticated |
| PUT | /notifications/:id/read | Authenticated |
| PUT | /notifications/read-all | Authenticated |
| GET/POST/PUT/DELETE | /events | View: authenticated; manage: admin |
| GET/POST/PUT/DELETE | /exams | View: authenticated; manage: admin |
| PUT | /exams/:id/results | Admin |
| GET | /academics | Students see the record matching their Student ID; faculty/admin see imported records |
| POST | /academics/import | Admin; multipart `.xlsx` workbook, 5 MB limit |
| GET | /faculty-assignments | Admin; imported teaching directory (does not create login accounts) |
| GET/POST/PUT/DELETE | /interactions | View: authenticated; create: student/faculty |
| GET/POST | /payments/fees | Student view; admin manage |
| GET | /payments | Student or admin |
| POST | /payments/orders, /payments/verify | Student, Razorpay test mode |

For payment testing, create Razorpay **test-mode** API keys and put them only in `backend/.env`. Admins assign a course fee from the Payments section; students can view the remaining balance, pay through Razorpay checkout, and see the recorded payment method and history. Use test-mode payment details supplied by Razorpay, not real card details.

Academic workbook imports are available from the Exams section to admins. The workbook must include `8 Semester Course Marks` and `Student Academic Summary` sheets with registration numbers, semester/course data, marks, and GPA columns. Add an optional `Date of Birth` column to the summary sheet to set DOB sign-in credentials when the workbook is imported. Dates are validated and stored only as bcrypt hashes on matching student accounts; raw dates are not stored in academic records. Student accounts must have a `Student ID` that exactly matches the workbook's `Regd No`. Imports are upserted by registration number; re-importing replaces that student's imported academic record. Workbook notes identifying sample/demo values are stored and shown with the record; missing numeric marks remain blank. The provided B.Tech workbook contains student data only, not faculty data.

Faculty teaching assignment records are listed in Admin → Faculty. The supplied teacher list does not include email addresses, so it is stored as an admin-only directory and does not create portal login accounts.

## 12. AI configuration

AI runs only on the backend (`backend/services/aiService.js`).

1. Optional: set `AI_API_KEY` (OpenAI-compatible chat completions).
2. On complaint or campus-request create, the API:
   - Classifies category, priority, keywords, department, summary
   - Detects possible related/duplicate complaints by text similarity
   - Stores `AIAnalysis` and copies **recommended** priority onto the record
3. If the AI provider is down or the key is empty, the same fields are filled by **Rule-Based Analysis**.
4. The UI labels the source as **AI Analysis** or **Rule-Based Analysis**.
5. Admins can change `finalPriority`, status, assignment, and remarks. AI never auto-approves, auto-rejects, or deletes complaints.

## 13. Postman testing

Import these against `http://localhost:5000/api` after the backend is running.

### Register

`POST /auth/register`

```json
{
  "name": "Ada Student",
  "email": "ada@campus.edu",
  "password": "<YOUR_STRONG_PASSWORD>",
  "role": "STUDENT",
  "phone": "9876543210",
  "department": "Computer Science",
  "studentId": "STU-1001"
}
```

Response (201): `{ "success": true, "token": "<jwt>", "user": { "role": "STUDENT", ... } }`

### Login

`POST /auth/login`

```json
{
  "email": "admin@campus.edu",
  "password": "<DEMO_ADMIN_PASSWORD>"
}
```

Response (200): `{ "success": true, "token": "<jwt>", "user": { "role": "ADMIN", ... } }`

### Get current user

`GET /auth/me`  
Header: `Authorization: Bearer <token>`  
Response: `{ "success": true, "user": { ... } }`

### Create notice

`POST /notices` (admin)

```json
{
  "title": "Library hours extended",
  "description": "The central library will remain open until 10 PM this week.",
  "category": "LIBRARY",
  "targetAudience": "STUDENTS",
  "priority": "MEDIUM"
}
```

### Get notices

`GET /notices`

### Create complaint

`POST /complaints` (student or faculty)

```json
{
  "title": "No water in Hostel Block B",
  "description": "The water supply has stopped in Hostel Block B since morning and many students are affected.",
  "location": "Hostel Block B"
}
```

Response includes `aiAnalysis` with `analysisMode` `AI` or `RULE_BASED`, recommended priority, summary, keywords, and possible related complaints.

### Get complaints

`GET /complaints`

### Update complaint

`PUT /complaints/:id` (faculty/admin)

```json
{
  "status": "IN_PROGRESS",
  "finalPriority": "HIGH",
  "priority": "HIGH",
  "adminRemarks": "Plumbing team assigned. AI recommendation reviewed."
}
```

### Create leave request

`POST /leave` (student)

```json
{
  "leaveType": "SICK",
  "fromDate": "2026-10-05",
  "toDate": "2026-10-07",
  "reason": "Medical appointment"
}
```

### Update leave request

`PUT /leave/:id` (faculty/admin)

```json
{ "status": "APPROVED", "remarks": "Approved for two days." }
```

### Create certificate request

`POST /certificates` (student)

```json
{
  "certificateType": "BONAFIDE",
  "reason": "Internship application"
}
```

### Create gate pass

`POST /gate-pass` (student)

```json
{
  "destination": "City Hospital",
  "reason": "Medical checkup",
  "departureDate": "2026-10-03T09:00:00.000Z",
  "returnDate": "2026-10-03T18:00:00.000Z",
  "emergencyContact": "9876543210"
}
```

### Create campus service request

`POST /campus-requests`

```json
{
  "title": "Broken classroom chair",
  "description": "Two chairs in CS-101 are unsafe.",
  "category": "Furniture",
  "location": "CS-101"
}
```

### Get notifications

`GET /notifications`

Error examples: invalid credentials `{ "success": false, "message": "Invalid email or password." }`; expired token `{ "success": false, "message": "Session expired. Please log in again." }`.

## 14. Production deployment

1. Rotate Atlas credentials, JWT secret, and any AI keys that were shared during development.
2. Set `CLIENT_URL` to the real frontend origin.
3. Host backend (Render, Railway, Azure, etc.) with Node 18+.
4. Host frontend static build (`npm run build` in `frontend`) on Netlify, Vercel, or a university server.
5. Set `VITE_API_URL` to the public API URL at build time.
6. Keep Atlas IP allowlist restricted in production.
7. Do not enable automatic AI decisions.

## Architecture

```
React (Vite)  --Axios-->  Express API  -->  MongoDB Atlas
                                  \
                                   --> AI service (optional cloud model)
                                        or rule-based fallback
```

Frontend never talks to MongoDB or the AI provider.

## Authentication flow

1. Register or login.
2. Backend hashes passwords with bcrypt and returns a JWT plus user role.
3. Axios stores the token and sends `Authorization: Bearer`.
4. `AuthContext` loads `/auth/me` on refresh.
5. `ProtectedRoute` / `RoleRoute` send students, faculty, and admins to their dashboards only.

## AI workflow

Submit complaint/service → backend `analyzeRequest` → store `AIAnalysis` → copy recommended priority → admin reviews, may change priority/status, may link related complaints. Nothing is auto-deleted or auto-rejected.

## Security

JWT, bcrypt, Helmet, CORS, rate limiting, input validation, generic error messages, secrets only in backend env.
