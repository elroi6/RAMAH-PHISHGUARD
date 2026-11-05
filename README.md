
# RAMAH-PHISHGUARD

### DETECT THREATS. PROTECT PEOPLE.

**RAMAH-PHISHGUARD** is a web-based phishing detection and cybersecurity awareness platform developed by **RAMAH TECHNOLOGIES**.

The platform analyzes submitted URLs using heuristic security checks, assigns risk scores, identifies suspicious characteristics, and provides users with information that can help them recognize potentially dangerous links.

> A low-risk result does not guarantee that a URL is safe. RAMAH-PHISHGUARD provides security indicators, not a guarantee of legitimacy.

## Features

- URL analysis using heuristic detection.
- Risk scoring from 0 to 100.
- Four risk categories: LOW, MODERATE, HIGH, and CRITICAL.
- Detection of suspicious URL characteristics.
- HTTP/HTTPS destination inspection.
- Redirect analysis with security validation.
- Protection against requests to private and non-public IP addresses.
- User registration and login.
- JWT-based authentication.
- Scan history for authenticated users.
- URL privacy protection when storing and returning scan records.
- Rate limiting for scan requests.
- Responsive dashboard and user interface.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| Styling | CSS, Tailwind CSS |
| Routing | React Router |
| Icons | Lucide React |
| HTTP Client | Axios |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens, bcryptjs |
| Validation | Zod |
| Security | Helmet, CORS, express-rate-limit, ipaddr.js |
| Testing | Node.js Test Runner |

## Project Structure

```text
RAMAH-PHISHGUARD/
├── client/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/
│       ├── App.jsx
│       └── main.jsx
├── server/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       │   └── detection/
│       ├── utils/
│       ├── validators/
│       ├── app.js
│       └── server.js
├── docs/
│   └── PROJECT_DOCUMENTATION.md
├── .gitignore
├── package.json
└── README.md
```

## Requirements

Before running the project, install:

- Node.js (a version compatible with the installed project dependencies).
- npm.
- MongoDB database or a MongoDB connection URI.
- Git.

## Installation

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd RAMAH-PHISHGUARD
```

Replace `<YOUR_REPOSITORY_URL>` with the actual repository URL.

### 2. Install dependencies

Install the dependencies in each project directory:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

### 3. Configure environment variables

Create the backend environment file:

```bash
cp server/.env.example server/.env
```

Configure the following variables in `server/.env`:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_secure_secret_of_at_least_32_characters
```

Use your own MongoDB connection string and a strong, private JWT secret.

**Never commit `.env` files or expose real credentials.**

### 4. Start the application

From the project root:

```bash
npm run dev
```

This starts the frontend and backend development servers.

Default development addresses:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API health: http://localhost:5000/api/v1/health

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start frontend and backend |
| `npm run dev:client` | Start frontend only |
| `npm run dev:server` | Start backend only |
| `npm run build` | Build frontend for production |
| `npm run test` | Run backend tests |
| `npm run lint --prefix client` | Check frontend code |

## API Overview

Base URL:

```text
http://localhost:5000/api/v1
```

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/health` | API and database status | No |
| GET | `/health/ready` | Readiness status | No |
| POST | `/auth/register` | Register a user | No |
| POST | `/auth/login` | Authenticate a user | No |
| POST | `/scans` | Analyze a URL | Optional |
| GET | `/scans/mine` | Retrieve personal scan history | Required |

Protected endpoints use:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

The scan endpoint is rate-limited to 10 requests per 15 minutes.

## Detection Approach

RAMAH-PHISHGUARD uses heuristic analysis to identify suspicious URL characteristics, including:

- IP address-based hostnames.
- Unencrypted HTTP connections.
- Unusual ports.
- Excessive subdomains.
- Punycode hostnames.
- Unusually long URLs.
- Suspicious path keywords.
- Suspicious query parameter names.

The detection service calculates a risk score and assigns a risk category.

The platform does not currently claim to use machine learning or guarantee detection of every phishing website.

## Security Measures

The backend includes several security controls:

- Input validation for authentication and scan requests.
- Password hashing using bcrypt.
- JWT verification and expiration.
- HTTP security headers through Helmet.
- Scan request rate limiting.
- URL credential and query-value redaction.
- HTTP and HTTPS target restrictions.
- DNS resolution and public IP validation.
- DNS-pinned outbound HTTP requests.
- Redirect destination validation.
- Response size and request timeout limits.
- Protection against requests to local and non-public network destinations.

## Documentation

For the detailed system description, architecture, API behavior, detection methodology, security controls, limitations, and testing information, see:

[`docs/PROJECT_DOCUMENTATION.md`](docs/PROJECT_DOCUMENTATION.md)

## Disclaimer

RAMAH-PHISHGUARD is an independent cybersecurity project developed for URL analysis and security awareness.

Its results are indicators of potential risk and should not be treated as definitive proof that a website is malicious or safe.

Always verify suspicious links through trusted sources and use additional security tools when necessary.

## Developed By

**RAMAH TECHNOLOGIES**

*DETECT THREATS. PROTECT PEOPLE.*
