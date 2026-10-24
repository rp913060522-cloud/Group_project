# CareerSetu Backend API

Backend architecture for CareerSetu using **Node.js**, **Express**, **Mongoose** (MongoDB Atlas), **bcryptjs**, and **JWT**.

---

## 1. Quick Start

### 1. Configure Environment Variables
Ensure `.env` in the project root is configured:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/careersetu?retryWrites=true&w=majority
JWT_SECRET=your_long_random_jwt_secret_here
JWT_EXPIRES_IN=7d
DNS_SERVERS=1.1.1.1,8.8.8.8
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

### 2. Start the Server
```bash
# Start in production mode:
npm start

# Start in development mode (with hot-reload):
npm run dev
```

The server listens on `http://localhost:5000` and automatically serves the static frontend from `frontend/`.

---

## 2. API Endpoints

### Health & System
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Server uptime, version, and database connection state |
| `GET` | `/*` | Public | Static frontend pages |

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new student account (hashes password with bcrypt) |
| `POST` | `/api/auth/login` | Public | Authenticate student & return signed JWT token |
| `GET` | `/api/auth/me` | Protected (`Bearer <token>`) | Get safe public profile of authenticated student |

#### Example: Register (`POST /api/auth/register`)
Request Body:
```json
{
  "name": "Aarav Patel",
  "email": "aarav.patel@example.com",
  "password": "SecurePassword123"
}
```
Response (`201 Created`):
```json
{
  "status": "success",
  "message": "Account registered successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "student": {
    "_id": "67098e9f...",
    "email": "aarav.patel@example.com",
    "personalInfo": {
      "fullName": "Aarav Patel"
    },
    "profileComplete": false,
    "educationComplete": false,
    "interestComplete": false,
    "createdAt": "2026-10-11T18:30:00.000Z"
  }
}
```

#### Example: Login (`POST /api/auth/login`)
Request Body:
```json
{
  "email": "aarav.patel@example.com",
  "password": "SecurePassword123"
}
```
Response (`200 OK`):
```json
{
  "status": "success",
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "student": {
    "_id": "67098e9f...",
    "email": "aarav.patel@example.com",
    "personalInfo": {
      "fullName": "Aarav Patel"
    }
  }
}
```

#### Example: Authenticated Profile (`GET /api/auth/me`)
Headers:
```
Authorization: Bearer <token>
```
Response (`200 OK`):
```json
{
  "status": "success",
  "student": {
    "_id": "67098e9f...",
    "email": "aarav.patel@example.com",
    "personalInfo": {
      "fullName": "Aarav Patel"
    }
  }
}
```

### Student Data & Profile (`/api/student`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/student/profile` | Protected (`Bearer <token>`) | Get full saved profile of authenticated student |
| `PUT` | `/api/student/personal-info` | Protected (`Bearer <token>`) | Save/update student personal information (Step 1) |
| `PUT` | `/api/student/education` | Protected (`Bearer <token>`) | Save/update educational background (Step 2) |
| `PUT` | `/api/student/career-interest` | Protected (`Bearer <token>`) | Save/update career interests & skills (Step 3) |

### AI Career Guidance (`/api/ai`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/ai/analyze` | Protected (`Bearer <token>`) | Generate personalized career guidance via Groq AI from saved profile |
| `GET` | `/api/ai/saved` | Protected (`Bearer <token>`) | Retrieve previously generated and saved AI guidance |

#### Example: Analyze Career (`POST /api/ai/analyze`)
Request Body (optional override):
```json
{
  "interest": "Data Science & AI"
}
```
Response (`200 OK`):
```json
{
  "status": "success",
  "guidance": {
    "profileSummary": "Student completed 12th in Science with strong math foundation...",
    "recommendedCareers": [
      {
        "title": "Junior Data Analyst",
        "tagline": "High Demand • Great Starting Role",
        "whySuitable": "Strong fit for mathematics background and interest in analytics.",
        "eligibility": ["12th Pass with Mathematics", "Foundational knowledge of Python and SQL"],
        "requiredSkills": ["Python", "SQL", "Excel", "Data Visualization"],
        "learningRoadmap": ["Learn Python basics", "Master SQL querying", "Build real-world portfolio"]
      }
    ],
    "learningRoadmapGeneral": [
      "Step 1: Dedicate 1 hour daily to practice coding",
      "Step 2: Create a free GitHub account to publish projects",
      "Step 3: Explore scholarship schemes and verified video courses"
    ],
    "recommendedResources": [
      { "title": "Verified Video Tutorials", "url": "youtube-resources.html", "badge": "Free Courses" },
      { "title": "Verified Scholarship Schemes", "url": "scholarships.html", "badge": "Financial Aid" },
      { "title": "Verified Government Job Portals", "url": "jobs-results.html", "badge": "Job Alerts" }
    ],
    "disclaimer": "This analysis is generated by AI for informational guidance only..."
  },
  "generatedAt": "2026-10-12T00:58:00.000Z",
  "modelUsed": "llama-3.3-70b-versatile"
}
```

---

## 3. Automated Testing

Run the full automated test suite (152 checks):
```bash
npm test
```
Or run individual test suites:
```bash
# Phase 1 Health & configuration checks:
npm run test:health

# Phase 2 Authentication, JWT & Password Reset tests:
npm run test:auth

# Phase 3 Student Data API & Isolation tests:
npm run test:student

# Phase 4 AI Career Guidance & Groq tests:
npm run test:ai

# Phase 5 Admin Authentication, Authorization & Export tests:
npm run test:admin
```

All test suites run against isolated mock stores and mocked AI providers so no test data touches real student records in MongoDB Atlas or makes billable API calls.

---

## 4. Administrative Account Setup

To initialize the platform administrator account:
```bash
npm run setup:admin
```
*(Requires `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`)*

---

## 5. Architecture & Phases Status

- **Phase 1 (Completed):** Backend foundation, Express server, MongoDB Atlas configuration, Health check API.
- **Phase 2 (Completed):** Authentication API (`register`, `login`, `me`), bcrypt hashing, JWT middleware, Forgot Password & Password Reset flow.
- **Phase 3 (Completed):** Student profile persistence (`/api/student/profile`, `/api/student/education`, `/api/student/career-interest`), data isolation, frontend integration.
- **Phase 4 (Completed):** Groq AI integration (`POST /api/ai/analyze`, `GET /api/ai/saved`), verified resource links, automated test suite, frontend AI guidance cards.
- **Phase 5 (Completed):** Admin portal (`/admin/login.html`, `/admin/dashboard.html`), RBAC authentication, student directory search/filter, and CSV/PDF export.
