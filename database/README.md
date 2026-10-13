# CareerSetu — Database Architecture & MongoDB Atlas Setup

This directory documents the database configuration and schemas for **CareerSetu**.

---

## 1. Overview
CareerSetu uses **MongoDB Atlas (Free Tier / M0)** as its primary database.
Mongoose 8 is used for Object Document Mapping (ODM), providing schema validation, type safety, and lifecycle hooks.

---

## 2. MongoDB Atlas Setup Guide

To connect the CareerSetu backend to MongoDB Atlas:

1. **Sign in / Sign up to MongoDB Atlas**:
   - Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account.
2. **Create a Free Cluster**:
   - Select **M0 Free Tier**.
   - Choose a cloud provider and region close to you (e.g., AWS / Mumbai `ap-south-1`).
   - Cluster Name: e.g. `CareerSetu-Cluster`.
3. **Configure Database User**:
   - Go to **Security > Database Access > Add New Database User**.
   - Authentication Method: **Password**.
   - Role: **Read and write to any database**.
   - Keep note of your username and password.
4. **Configure Network Access**:
   - Go to **Security > Network Access > Add IP Address**.
   - Add `0.0.0.0/0` (Allow Access from Anywhere) or add your current public IP address.
5. **Get the Connection String**:
   - Click **Connect** on your cluster.
   - Choose **Drivers** (Node.js).
   - Copy the connection string URI. Format:
     ```
     mongodb+srv://<username>:<password>@<cluster>.mongodb.net/careersetu?retryWrites=true&w=majority
     ```
6. **Set `.env`**:
   - Copy `.env.example` to `.env` in the project root:
     ```bash
     cp .env.example .env
     ```
   - Replace `<username>` and `<password>` with your Atlas credentials.

---

## 3. Data Models

### `Student` Collection (`backend/models/Student.js`)
Stores the complete student record across all guidance phases:

- **Authentication & Metadata**:
  - `email` (String, required, unique, indexed)
  - `passwordHash` (String, hidden from public queries by default)
  - `isGuest` (Boolean)
  - `lastActive` (Date)
- **Profile Completeness**:
  - `profileComplete` (Boolean)
  - `educationComplete` (Boolean)
  - `interestComplete` (Boolean)
- **Sub-documents**:
  - `personalInfo`: `fullName`, `age`, `gender`, `phone`, `location`, `updatedAt`
  - `education`: `eduLevel`, `stream`, `subjects`, `marks`, `updatedAt`
  - `careerInterest`: `field`, `favSubjects`, `preference`, `skills`, `updatedAt`
  - `aiResult`: `generatedAt`, `promptSummary`, `rawResponse`, `parsedResult`, `status`, `errorMessage`
- **Timestamps**:
  - `createdAt`, `updatedAt`

---

## 4. Troubleshooting: DNS SRV Lookup (`querySrv ECONNREFUSED`)

Some local Windows networks and ISPs fail DNS SRV record queries for `mongodb+srv://`.
CareerSetu resolves this automatically in `backend/config/database.js` by setting public DNS resolvers (`1.1.1.1` and `8.8.8.8`) via Node's `dns.setServers()`.

If you need custom DNS servers, you can configure them in `.env`:
```env
DNS_SERVERS=1.1.1.1,8.8.8.8
```

---

## 5. Verification

Run the test suite to verify the model schema and database connectivity:
```bash
npm run test:health
```
