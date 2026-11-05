
# RAMAH-PHISHGUARD
## Project Technical Documentation

**Organization:** RAMAH TECHNOLOGIES
**Project:** RAMAH-PHISHGUARD
**Tagline:** DETECT THREATS. PROTECT PEOPLE.
**Version:** 1.0.0
**Project Type:** Web-Based Phishing Detection and Cybersecurity Awareness Platform

---

# 1. Introduction

## 1.1 Background

Phishing is a cybersecurity threat in which attackers use deceptive websites, messages, or links to trick people into revealing sensitive information or performing unsafe actions.

Many phishing attacks rely on URLs that imitate legitimate websites, contain suspicious redirects, or use misleading domain names.

RAMAH-PHISHGUARD is designed to help users examine URLs and understand characteristics that may indicate potential phishing or other security risks.

## 1.2 Project Overview

RAMAH-PHISHGUARD is a web-based security platform developed by RAMAH TECHNOLOGIES.

Users can submit URLs for analysis. The backend evaluates URL characteristics, calculates a heuristic risk score, and performs controlled HTTP inspection when appropriate.

Registered users can access their previous scan records through the dashboard.

The platform combines frontend technologies, backend services, database storage, authentication, and security-focused URL inspection.

## 1.3 Objectives

The main objectives are:

1. Analyze submitted URLs for suspicious characteristics.
2. Identify potentially dangerous URL structures.
3. Calculate and display risk scores.
4. Provide understandable security findings.
5. Allow users to register and authenticate securely.
6. Maintain scan history for registered users.
7. Protect the application against unsafe outbound HTTP requests.
8. Promote cybersecurity awareness.

## 1.4 Scope

The current system includes:

- URL submission and analysis.
- Heuristic-based URL detection.
- Risk scoring and categorization.
- Controlled HTTP inspection.
- Redirect analysis.
- User registration and login.
- Authenticated scan history.
- URL privacy protection.
- Dashboard-based interaction.

The platform does not guarantee the detection of every phishing website.

---

# 2. System Architecture

## 2.1 Architecture Overview

RAMAH-PHISHGUARD uses a client-server architecture.

The frontend communicates with the backend through HTTP API requests. The backend validates requests, performs detection and security checks, communicates with MongoDB, and returns structured responses.

Main components:

1. **Frontend:** User interface and dashboard.
2. **Backend:** Application logic, authentication, and detection services.
3. **Database:** Persistent storage of user accounts and scan records.
4. **Detection Engine:** URL analysis, risk scoring, and HTTP inspection.

## 2.2 Architecture Diagram

```text
                  USER
                    |
                    v
          REACT FRONTEND
           (Vite Application)
                    |
                    | HTTP / API Requests
                    v
           EXPRESS BACKEND
                    |
          +---------+----------+
          |         |          |
          v         v          v
      AUTHENTI-  DETECTION   MIDDLEWARE
      CATION     ENGINE      & VALIDATION
          |         |
          |         +----------------------+
          |                                |
          v                                v
       MONGODB                      URL ANALYSIS
          |                                |
          |                         RISK SCORING
          |                                |
          |                         HTTP INSPECTION
          |                                |
          |                         DNS / IP SAFETY
          |                                |
          +---------------+----------------+
                          |
                          v
                    API RESPONSE
                          |
                          v
                   REACT DASHBOARD
```

## 2.3 Frontend Architecture

The frontend is developed using React and Vite.

Its responsibilities include:

- Displaying the application interface.
- Handling user registration and login.
- Managing authentication state.
- Submitting URLs to the backend.
- Displaying scan results.
- Showing scan history.
- Managing navigation and protected pages.

Important frontend directories:

| Directory | Responsibility |
|---|---|
| `client/src/assets/` | Images and static assets |
| `client/src/components/` | Reusable interface components |
| `client/src/context/` | Authentication context |
| `client/src/pages/` | Application pages |
| `client/src/services/` | API communication |

## 2.4 Backend Architecture

The backend uses Node.js and Express.

Its responsibilities include:

- Handling API requests.
- Validating user input.
- Managing authentication.
- Running URL detection.
- Performing controlled HTTP inspection.
- Saving scan records.
- Returning API responses.
- Handling errors and rate limits.

Important backend directories:

| Directory | Responsibility |
|---|---|
| `server/src/config/` | Environment and database configuration |
| `server/src/controllers/` | Request handling and application logic |
| `server/src/middleware/` | Authentication, validation, and security middleware |
| `server/src/models/` | MongoDB data models |
| `server/src/routes/` | API route definitions |
| `server/src/services/detection/` | URL detection and HTTP inspection |
| `server/src/utils/` | Shared utility functions |
| `server/src/validators/` | Request validation schemas |

---

# 3. Technologies Used

## 3.1 Frontend Technologies

| Technology | Purpose |
|---|---|
| React | Building the user interface |
| Vite | Frontend development and build tooling |
| JavaScript | Application programming |
| CSS | Interface styling |
| Tailwind CSS | Utility-based styling |
| React Router | Page navigation |
| Axios | HTTP communication |
| Lucide React | Interface icons |

## 3.2 Backend Technologies

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express | Backend web framework |
| MongoDB | Database |
| Mongoose | MongoDB object modeling |
| bcryptjs | Password hashing |
| JSON Web Token | Authentication |
| Zod | Data validation |
| Helmet | HTTP security headers |
| CORS | Cross-origin request configuration |
| express-rate-limit | Request rate limiting |
| ipaddr.js | IP address classification |

## 3.3 Testing Technologies

The backend uses the built-in Node.js test runner.

Tests are organized alongside relevant backend services and utilities.

---

# 4. URL Detection Engine

## 4.1 Overview

The detection engine analyzes submitted URLs using predefined security indicators.

It does not rely on a machine learning model. Instead, it uses heuristic rules to identify suspicious characteristics.

The detection process includes:

1. URL validation.
2. URL normalization and analysis.
3. Suspicious indicator identification.
4. Risk score calculation.
5. Risk level assignment.
6. Optional HTTP inspection.

## 4.2 URL Validation

Before analysis, the system checks whether the submitted value is a valid URL.

The validation process checks:

- The input is a non-empty string.
- The URL does not exceed 2,048 characters.
- The URL is properly formatted.
- The protocol is HTTP or HTTPS.
- A valid hostname exists.
- Embedded username and password credentials are rejected.
- The hostname follows valid hostname rules.

Invalid URLs are rejected rather than treated as successful detection results.

## 4.3 Suspicious URL Indicators

The current heuristic analyzer checks the following characteristics:

| Indicator | Description | Base Weight |
|---|---|---:|
| IP_ADDRESS_HOST | URL uses an IP address as its host | 15 |
| UNUSUAL_PORT | URL uses a suspicious network port | 15 |
| PUNYCODE_HOSTNAME | Hostname contains Punycode encoding | 15 |
| EXCESSIVE_SUBDOMAINS | Hostname contains more than four labels | 10 |
| UNENCRYPTED_HTTP | URL uses HTTP instead of HTTPS | 5 |
| LONG_URL | URL is longer than 200 characters | 5 |
| SUSPICIOUS_PATH_KEYWORD | Path contains selected sensitive keywords | 5 |
| SUSPICIOUS_QUERY_PARAMETER | Query contains selected redirect or token parameter names | 5 |

These indicators are heuristic signals. Their presence does not independently prove that a website is malicious.

## 4.4 Risk Score Calculation

The detection engine assigns weights to identified indicators.

The score is calculated by adding the weights of unique finding codes.

Duplicate finding codes are counted only once.

The heuristic score is capped at 74.

Conceptually:

```text
Risk Score = Sum of Unique Finding Weights

Maximum Heuristic Score = 74
```

The current risk categories are:

| Score | Risk Level |
|---|---|
| 0–24 | LOW |
| 25–49 | MODERATE |
| 50–74 | HIGH |
| 75–100 | CRITICAL |

**Implementation note:** The risk-level mapping and database schema support CRITICAL, but the current heuristic scoring cap of 74 means the heuristic engine cannot independently produce a CRITICAL score.

## 4.5 Detection Limitations

The detection engine examines URL characteristics, not the complete intentions or behavior of a website.

Therefore:

- A suspicious URL is not automatically a confirmed phishing website.
- A low-risk URL is not guaranteed to be safe.
- Some sophisticated phishing URLs may not trigger the current indicators.
- Legitimate websites can sometimes exhibit suspicious characteristics.
- The current engine does not establish reputation through a live threat-intelligence feed.

---

# 5. Safe HTTP Inspection and SSRF Protection

## 5.1 Purpose

HTTP inspection provides additional information about a submitted URL.

However, allowing a server to make arbitrary outbound HTTP requests can create Server-Side Request Forgery (SSRF) risks.

An attacker could attempt to make the application access internal services, private network addresses, or local resources.

RAMAH-PHISHGUARD therefore applies multiple checks before and during outbound inspection.

## 5.2 Target Policy

The HTTP target policy:

- Allows HTTP on port 80.
- Allows HTTPS on port 443.
- Rejects other protocols.
- Rejects non-standard ports.
- Rejects embedded URL credentials.
- Enforces the 2,048-character URL limit.
- Removes URL fragments before making the request.

## 5.3 DNS Validation

The DNS resolver:

1. Validates the hostname format.
2. Rejects local and reserved hostname suffixes.
3. Resolves the hostname.
4. Checks every returned IP address.
5. Rejects invalid or non-public addresses.
6. Removes duplicate validated addresses.

Blocked hostname suffixes include:

- `.localhost`
- `.local`
- `.internal`
- `.home.arpa`
- `.test`
- `.invalid`
- `.onion`

The hostname `localhost` is also rejected.

## 5.4 IP Address Safety

The IP inspection service uses `ipaddr.js`.

It accepts only addresses classified as globally routable unicast.

Private, reserved, and other special-purpose address ranges are rejected.

IPv4-mapped IPv6 addresses are normalized before classification.

## 5.5 DNS Pinning

After DNS validation, the HTTP transport uses a pinned lookup function.

The function ensures that the HTTP client uses the previously validated IP address instead of independently resolving the hostname again.

It also checks that:

- The requested hostname matches the expected hostname.
- The requested IP family matches the pinned address.
- The pinned address remains publicly routable.

This reduces the risk of DNS rebinding between validation and connection.

## 5.6 Redirect Protection

The HTTP inspector does not automatically follow redirects inside the individual HTTP transport.

Instead, the inspection service processes redirects separately.

For each redirect:

1. The destination is parsed.
2. The target policy is applied again.
3. The destination is checked before another request.
4. The destination is resolved and validated again by the transport.
5. Redirect loops are detected.

The maximum redirect count is five.

## 5.7 Resource Limits

The current default inspection limits are:

| Protection | Limit |
|---|---:|
| Maximum URL length | 2,048 characters |
| Maximum redirects | 5 |
| Total inspection timeout | 15 seconds |
| Individual HTTP request timeout | 5 seconds |
| DNS resolution timeout | 3 seconds |
| Total response size | 1 MB |
| Individual response size | 1 MB |
| Maximum HTTP header size | 16 KB |

These limits help control resource consumption during inspection.

---

# 6. Authentication and Authorization

## 6.1 User Registration

Users can create accounts by submitting their name, email address, and password.

The backend validates registration data using Zod.

Passwords are hashed using bcryptjs before they are stored.

The current password hashing configuration uses 12 bcrypt rounds.

Duplicate email addresses are rejected.

## 6.2 User Login

Users authenticate using their email address and password.

The backend:

1. Finds the user account.
2. Compares the submitted password with the stored password hash.
3. Checks whether the account is active.
4. Updates the last login timestamp.
5. Generates a signed JWT.

The JWT uses HS256 and has a one-hour expiration.

## 6.3 JWT Authentication

Protected requests use the following authorization header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

The authentication middleware verifies:

- JWT signature.
- Token expiration.
- Token issuer.
- Token audience.
- User identifier validity.
- User account existence and active status.

## 6.4 User Roles

The user model supports these roles:

- `user`
- `analyst`
- `admin`

The default role for newly registered users is `user`.

Role-based authorization capabilities beyond the currently implemented middleware should not be assumed.

---

# 7. Database Design

RAMAH-PHISHGUARD uses MongoDB with Mongoose.

The current application includes User and Scan models.

## 7.1 User Collection

The User model contains:

| Field | Description |
|---|---|
| `name` | User's name |
| `email` | Unique email address |
| `password` | Bcrypt password hash |
| `role` | User role |
| `isActive` | Account status |
| `isEmailVerified` | Email verification status |
| `lastLoginAt` | Last successful login time |
| `createdAt` | Account creation time |
| `updatedAt` | Last update time |

The password field is excluded from normal query results.

## 7.2 Scan Collection

The Scan model contains:

| Field | Description |
|---|---|
| `user` | Associated user ID or null |
| `originalUrl` | Privacy-redacted submitted URL |
| `normalizedUrl` | Privacy-redacted normalized URL |
| `hostname` | URL hostname |
| `riskScore` | Calculated risk score |
| `riskLevel` | Assigned risk category |
| `findings` | Detection findings |
| `status` | Scan status |
| `createdAt` | Scan creation time |
| `updatedAt` | Last update time |

The scan status can be:

- `COMPLETED`
- `INVALID`
- `FAILED`

Anonymous scans can be stored with a null user reference.

---

# 8. URL Privacy

URL parameters can contain sensitive information, including tokens, identifiers, and personal data.

The URL privacy utility reduces exposure by:

- Removing embedded username and password credentials.
- Redacting query parameter values.
- Preserving query parameter names.
- Removing URL fragments.
- Safely handling invalid or empty input.

Scan history also applies URL redaction when returning previously stored records.

This protects sensitive URL components from unnecessary exposure in stored scan records and API responses.

Note that URL inspection may still transmit the requested URL to its destination server. Users should avoid submitting URLs containing personal or confidential information.

---

# 9. API Documentation

## 9.1 API Base URL

During local development:

```text
http://localhost:5000/api/v1
```

## 9.2 Health Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Returns API and database status |
| GET | `/health/ready` | Checks whether the application is ready |

The readiness endpoint returns an unavailable response when the database is disconnected.

## 9.3 Authentication Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Authenticate a user |

Both endpoints validate request data.

## 9.4 Scan Endpoints

| Method | Endpoint | Purpose | Authentication |
|---|---|---|---|
| POST | `/scans` | Submit a URL for analysis | Optional |
| GET | `/scans/mine` | Retrieve personal scan history | Required |

The scan-history endpoint supports pagination.

Current defaults:

- Default page: 1
- Default limit: 10
- Maximum limit: 50

The scan endpoint is limited to 10 requests per 15-minute window.

## 9.5 Authentication Header

Protected requests require:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## 9.6 Example Scan Request

```http
POST /api/v1/scans
Content-Type: application/json
```

```json
{
  "url": "https://example.com"
}
```

The response includes the scan result and related detection information.

The exact response structure is defined by the backend controller.

---

# 10. Error Handling and Validation

The backend uses centralized error-handling middleware.

The application includes:

- Request validation.
- Authentication error handling.
- Not-found handling.
- Database error handling.
- Structured API error responses.

The backend limits incoming JSON request bodies to 10 KB.

---

# 11. Installation and Configuration

## 11.1 Requirements

- Node.js.
- npm.
- MongoDB.
- Git.

## 11.2 Clone the Project

```bash
git clone <YOUR_REPOSITORY_URL>
cd RAMAH-PHISHGUARD
```

## 11.3 Install Dependencies

```bash
npm install
npm install --prefix client
npm install --prefix server
```

## 11.4 Environment Configuration

Create a backend environment file using the provided template:

```bash
cp server/.env.example server/.env
```

Configure these variables:

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | Application environment | `development` |
| `PORT` | Backend port | `5000` |
| `CLIENT_URL` | Allowed frontend origin | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required, minimum 32 characters |

Never publish real environment variables or credentials.

## 11.5 Start the Application

From the project root:

```bash
npm run dev
```

Frontend:

```bash
npm run dev:client
```

Backend:

```bash
npm run dev:server
```

## 11.6 Build the Frontend

```bash
npm run build
```

---

# 12. Testing

The backend uses the Node.js built-in test runner.

Run backend tests from the project root:

```bash
npm run test
```

Or directly:

```bash
npm test --prefix server
```

Frontend linting:

```bash
npm run lint --prefix client
```

Frontend production build:

```bash
npm run build
```

Important areas for testing include:

- URL validation.
- URL analysis.
- Risk score calculation.
- DNS resolution.
- IP address safety.
- DNS pinning.
- HTTP transport.
- Redirect handling.
- URL privacy.
- Authentication and request validation.

Testing should be performed before releasing changes.

---

# 13. Current Limitations

The current implementation has several limitations:

1. Detection relies on heuristic indicators rather than a trained machine learning model.
2. No live threat-intelligence or phishing blacklist integration is currently documented.
3. A low-risk score does not prove that a website is safe.
4. Some phishing websites may not trigger the current detection rules.
5. Legitimate URLs can sometimes produce suspicious indicators.
6. The heuristic scoring cap is 74, so the current heuristic engine cannot independently produce a CRITICAL score.
7. Email verification is represented in the user model, but a complete email verification workflow is not established by the current implementation.
8. The current project documentation does not establish that the system has undergone an independent security audit.

---

# 14. Future Improvements

Possible future development includes:

- Integration with trusted threat-intelligence services.
- Additional phishing detection indicators.
- More advanced domain reputation analysis.
- Improved scan result explanations.
- Additional security testing.
- Enhanced administrative and analyst capabilities.
- Improved reporting and analytics.
- Further frontend usability improvements.

These are potential improvements, not claims about existing functionality.

---

# 15. Conclusion

RAMAH-PHISHGUARD combines web application development and cybersecurity principles to provide a platform for URL analysis and phishing awareness.

The system includes heuristic detection, risk scoring, controlled HTTP inspection, authentication, database storage, URL privacy protection, and safeguards against unsafe outbound requests.

The project demonstrates the practical application of full-stack development and defensive web security techniques.

---

# 16. Project Ownership

**RAMAH TECHNOLOGIES**

**Project:** RAMAH-PHISHGUARD

**Tagline:** DETECT THREATS. PROTECT PEOPLE.

RAMAH-PHISHGUARD is an independent cybersecurity project. It does not claim official affiliation with any government institution, bank, telecommunications provider, or law enforcement organization.
