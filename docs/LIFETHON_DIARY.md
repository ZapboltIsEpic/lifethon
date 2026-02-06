# LifeThon Project Diary

## Entry — 2026-02-02 | Area: frontend

- **Title:** Hero text low contrast on brown background
- **Files / Paths:** `frontend/app/page.tsx`
- **Stage:** Fixed
- **Tags:** #a11y #ui #frontend

### Problem / Observation 🚧

- Title and body used black text on a predominantly brown background; poor readability on some screens.

### Action / Fix ✅

- Changed body text to `#FFF8E7`, applied a warm gold gradient to the title, added a subtle overlay on the hero image, and added text-shadow.
- Commit/PR: (add link or commit ID here)

### Learnings ✨

- Check contrast early. Add a short a11y checklist to the PR template and verify hero sections with a contrast checker.

### STAR-ready bullets ⭐

- S: Visual design had low contrast causing accessibility risk.
- T: Improve readability for accessibility.
- A: Implemented color fixes and added accessibility checks.
- R: Improved contrast score and better usability.

---

## Entry — 2025-02-03 | Area: backend

- **Title:** PostgreSQL Connection Refused - Port Misconfiguration
- **Files / Paths:** `application.properties`, PostgreSQL service configuration
- **Stage:** Fixed
- **Tags:** #bug #database #configuration #learning

### Problem / Observation 🚧

- Spring Boot application failed to connect to PostgreSQL database with "connection refused" error
- Initial assumption was that database was on default port 5432
- Attempted multiple troubleshooting steps: checking service status, firewall rules, authentication configuration
- Error persisted despite PostgreSQL service running and accepting connections

### Action / Fix ✅

- Identified root cause: PostgreSQL was running on port 8080 instead of default port 5432
- Updated `application.properties` connection string:

```properties
  spring.datasource.url=jdbc:postgresql://localhost:8080/LifeThon
```

- Verified connection successful after port correction
- Database connectivity established and application able to communicate with PostgreSQL

### Learnings ✨

- Always verify actual port configuration rather than assuming defaults
- "Connection refused" can indicate wrong port, not just service issues
- Check `postgresql.conf` for actual port setting: `port = XXXX`
- Can verify listening ports with: `netstat -ano | findstr :XXXX`
- Non-standard ports may be configured during installation or to avoid conflicts
- Document actual infrastructure configuration to avoid future assumptions

### STAR-ready bullets ⭐

- **S:** Spring Boot application failing to connect to PostgreSQL database with connection refused errors during initial setup
- **T:** Diagnose and resolve database connectivity issue to enable application development
- **A:** Systematically troubleshooted PostgreSQL service, firewall, and authentication; identified port mismatch (8080 vs assumed 5432); corrected application.properties configuration
- **R:** Successfully established database connection, resolved blocker, learned to verify infrastructure configuration rather than relying on default assumptions

---

## Entry — 2026-02-04 | Area: backend/frontend

- **Title:** Spring Boot + PostgreSQL + React Authentication Integration
- **Files / Paths:**
  - `backend/src/main/java/com/example/lifethon/entity/User.java`
  - `backend/src/main/java/com/example/lifethon/repository/UserRepository.java`
  - `backend/src/main/java/com/example/lifethon/service/AuthService.java`
  - `backend/src/main/java/com/example/lifethon/controller/AuthController.java`
  - `backend/src/main/resources/application.properties`
  - `frontend/src/services/authService.ts`
- **Stage:** WIP (Authentication working, password hashing needed)
- **Tags:** #backend #database #authentication #spring-boot #postgresql #react #cors #integration

### Problem / Observation 🚧

- Needed to set up complete authentication system with Spring Boot backend and PostgreSQL database
- Frontend React app unable to communicate with backend due to CORS issues
- Lombok dependencies not resolving in IDE
- Unclear how to properly structure Spring Boot project with User entity, repositories, and services
- Password storage in plain text (security vulnerability)
- Database migration strategy unclear

### Action / Fix ✅

1. **Database Setup:**
   - Configured PostgreSQL connection in `application.properties`
   - Created User entity with JPA annotations (@Entity, @Table, @Column)
   - Set up automatic table creation with `spring.jpa.hibernate.ddl-auto=update`
   - Added proper nullable/non-nullable constraints on columns

2. **Backend Architecture:**
   - Created UserRepository interface extending JpaRepository with custom query methods
   - Updated AuthService to authenticate against database instead of hardcoded credentials
   - Added user registration functionality with duplicate email/username validation
   - Implemented proper error handling with InvalidCredentialsException

3. **CORS Configuration:**
   - Added @CrossOrigin annotation to AuthController
   - Created WebConfig class for global CORS policy allowing frontend requests

4. **Frontend Integration:**
   - Updated fetch URLs to point to `http://localhost:8080/api/auth/login`
   - Created authService.ts with TypeScript interfaces for type safety
   - Implemented token storage in localStorage
   - Added loading states and error handling

5. **Development Setup:**
   - Added Lombok dependency to pom.xml
   - Configured IDE annotation processing for Lombok
   - Created sample data initialization with CommandLineRunner

### Learnings ✨

- **Spring Boot + JPA Architecture:** Controller → Service → Repository → Database is the standard layered architecture
- **JPA Column Constraints:** By default columns are nullable; use `@Column(nullable = false)` to make required
- **Lombok Benefits:** @Data, @NoArgsConstructor, @AllArgsConstructor significantly reduce boilerplate code
- **CORS is Essential:** Frontend-backend communication requires explicit CORS configuration
- **Environment Variables:** Use .env files for API URLs to support different environments
- **Security TODO:** Current implementation stores passwords in plain text - needs BCrypt hashing ASAP
- **Migration Strategies:**
  - Development: Use `ddl-auto=update` for convenience
  - Production: Use Flyway/Liquibase for version-controlled migrations

**Follow-ups:**

- [ ] Implement BCrypt password hashing (Spring Security)
- [ ] Replace placeholder JWT token generation with actual JWT library
- [ ] Add input validation with @Valid annotations
- [ ] Implement rate limiting for login attempts
- [ ] Create protected routes with JWT verification
- [ ] Add refresh token mechanism
- [ ] Set up proper logging framework
- [ ] Write unit tests for AuthService and UserRepository
- [ ] Configure production-ready database connection pooling

**Resources:**

- [Spring Data JPA Documentation](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/)
- [Spring Security BCrypt](https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html)
- [Flyway Migrations](https://flywaydb.org/documentation/)

### STAR-ready bullets ⭐

- **S:** Tasked with building full-stack authentication system connecting React frontend to Spring Boot backend with PostgreSQL database for new web application
- **T:** Needed to implement secure user registration/login, establish database schema, configure cross-origin requests, and ensure proper separation of concerns in backend architecture
- **A:** Designed RESTful API with layered architecture (Controller/Service/Repository), configured JPA entities with proper constraints, implemented CORS policy, created TypeScript service layer for type-safe API calls, and established database connection with Hibernate ORM for automatic schema management
- **R:** Successfully integrated frontend-backend authentication flow with proper error handling, user data persistence in PostgreSQL, and foundation for secure token-based authentication (identified password hashing as critical next step before production deployment)

---

## Entry — 2026-02-05 | Area: frontend/backend/fullstack

- **Title:** JWT Authentication Implementation & User Registration Flow
- **Files / Paths:** 
  - `backend/src/main/java/com/example/lifethon/util/JwtUtil.java`
  - `backend/src/main/java/com/example/lifethon/service/AuthService.java`
  - `backend/src/main/java/com/example/lifethon/controller/AuthController.java`
  - `backend/src/main/resources/application.properties`
  - `backend/pom.xml`
  - `frontend/app/login/page.tsx`
  - `frontend/app/register/page.tsx`
  - `frontend/app/dashboard/page.tsx`
- **Stage:** Fixed (JWT complete, password hashing pending)
- **Tags:** #authentication #jwt #security #fullstack #api-design #learning

### Problem / Observation 🚧

- Authentication system was using placeholder token generation (`"Bearer_" + email + timestamp`)
- No proper JWT implementation with expiration, claims, or validation
- Missing user registration frontend page
- No API endpoint documentation strategy
- Frontend directly reading from localStorage in render causing React errors
- Unclear how to manage and document API endpoints across frontend/backend
- Password storage still in plain text (security vulnerability)

### Action / Fix ✅

**Backend JWT Implementation:**
1. Added JJWT dependencies (v0.12.3) to `pom.xml`: jjwt-api, jjwt-impl, jjwt-jackson
2. Created `JwtUtil.java` utility class with:
   - Token generation with claims (userId, username, email)
   - Refresh token generation (7-day expiration)
   - Token validation and verification methods
   - Claim extraction (email, userId, username, expiration)
   - Proper exception handling for expired/invalid tokens
3. Configured JWT properties in `application.properties`:
   - jwt.secret (256+ bit key for HS256)
   - jwt.expiration (86400000ms = 24 hours)
4. Updated `AuthService.java`:
   - Replaced placeholder token generation with `jwtUtil.generateToken()`
   - Added `refreshToken()` method for token renewal
   - Added `verifyToken()` method for validation
   - Updated `AuthResponse` to include `refreshToken` and `username`
5. Enhanced `AuthController.java`:
   - Added `/api/auth/verify` endpoint
   - Added `/api/auth/refresh` endpoint
   - Added `/api/auth/logout` endpoint placeholder

**Frontend Implementation:**
1. Created complete registration page (`app/register/page.tsx`):
   - Username, email, password, confirm password, firstName, lastName fields
   - Password match validation
   - Styled consistently with login page
   - Social auth buttons (Google/Facebook)
   - Link back to login page
2. Updated login page:
   - Added "Create an account" link to `/register`
   - Used Next.js `Link` component for navigation
   - Fixed `window.location.href` usage to avoid React render errors
3. Fixed Dashboard localStorage access:
   - Used lazy state initialization to avoid setState in useEffect
   - Avoided cascading renders
   - Properly initialized state from localStorage on mount

**API Documentation Strategy:**
1. Documented approach to manage API endpoints:
   - Option 1: Create markdown API documentation file
   - Option 2: Create frontend API constants file with TypeScript
   - Option 3: Implement Swagger/OpenAPI (recommended for production)
   - Option 4: Create typed API service layer
2. Recommended Swagger/OpenAPI + API constants + typed service combination

**Configuration:**
- JWT secret key configuration (needs production-grade secret)
- Token expiration settings
- CORS configuration for frontend-backend communication

### Learnings ✨

**JWT Implementation Deep Dive:**
- JJWT library uses builder pattern for token creation
- `SignWith()` requires SecretKey object (Keys.hmacShaKeyFor())
- Claims are stored in token payload and are readable without secret (but not modifiable)
- Expiration is checked automatically during parsing
- Multiple exception types (SignatureException, ExpiredJwtException, etc.) for different failure modes

**Token Strategy Best Practices:**
- Access tokens: Short-lived (15min-24hr) for API requests
- Refresh tokens: Long-lived (7-30 days) for getting new access tokens
- Store both in localStorage (or httpOnly cookies for better security)
- Token blacklisting needed for proper logout (Redis recommended)

**React/Next.js State Management:**
- **Never** call setState inside useEffect without dependencies - causes infinite loops
- Use lazy initialization: `useState(() => localStorage.getItem('key'))` to read once on mount
- `window.location.href` modifications must happen in useEffect, not during render
- Next.js `Link` from `next/link` is preferred over `<a>` tags for client-side navigation

**API Documentation Strategies:**
- Swagger UI provides interactive testing environment
- OpenAPI spec enables auto-generation of client SDKs
- Frontend API constants prevent typos and enable refactoring
- TypeScript typed services provide compile-time safety

**Security Notes:**
- JWT secrets MUST be 256+ bits for HS256 algorithm
- Use environment variables for secrets, never hardcode
- Current implementation still stores passwords in plain text - **CRITICAL TODO**
- Need to implement BCrypt password hashing before any production use

**Follow-ups:**
- [ ] **URGENT: Implement BCrypt password hashing in AuthService**
- [ ] Set up Swagger/OpenAPI documentation
- [ ] Create typed API service layer in frontend
- [ ] Implement proper token refresh flow in frontend
- [ ] Add token blacklist for logout (Redis)
- [ ] Move JWT secret to environment variables
- [ ] Generate production-grade secret key (openssl rand -base64 64)
- [ ] Add rate limiting on auth endpoints
- [ ] Implement password strength validation
- [ ] Add email verification flow
- [ ] Create protected route wrapper component
- [ ] Add loading states and error handling UI
- [ ] Write unit tests for JwtUtil
- [ ] Write integration tests for auth flow

**Resources:**
- [JJWT Documentation](https://github.com/jwtk/jjwt)
- [JWT.io - Token Decoder](https://jwt.io)
- [Spring Boot Security Best Practices](https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html)
- [Swagger/OpenAPI Setup](https://springdoc.org/)
- [Next.js Authentication Patterns](https://nextjs.org/docs/pages/building-your-application/authentication)

### STAR-ready bullets ⭐

- **S:** Tasked with upgrading authentication system from placeholder tokens to production-ready JWT implementation while building complete user registration flow and establishing API documentation strategy for full-stack application
- **T:** Needed to implement secure JWT token generation with proper expiration and claims, create refresh token mechanism, build registration page matching existing UI patterns, fix React rendering issues with localStorage, and establish clear API endpoint management strategy across frontend and backend
- **A:** Integrated JJWT library (v0.12.3) with custom JwtUtil class handling token generation/validation/refresh; configured 24-hour access tokens and 7-day refresh tokens with user claims (userId, username, email); created comprehensive registration page with password validation and social auth UI; implemented lazy state initialization to prevent React cascading renders; updated AuthService with token refresh and verification endpoints; documented four API management strategies (markdown docs, constants file, Swagger/OpenAPI, typed service layer) with recommendation for combined approach
- **R:** Successfully implemented production-ready JWT authentication with token refresh capability, reducing security risk from placeholder tokens; created consistent user registration experience with proper validation; eliminated React rendering errors through proper state initialization; established clear API documentation strategy enabling team scalability and type safety; identified critical next step of BCrypt password hashing before production deployment (currently storing plain text passwords as acknowledged technical debt)

---


# Template — New entries

## Entry — YYYY-MM-DD | Area: (frontend/backend/infra/etc.)

- **Title:** Short descriptor
- **Files / Paths:** `frontend/app/page.tsx`, `backend/src/...`
- **Stage:** (Idea / WIP / Fixed / Follow-up)
- **Tags:** #bug #a11y #refactor #design #learning

### Problem / Observation 🚧

- Brief description and reproduction steps

### Action / Fix ✅

- What was done, PR/commit link, tests updated

### Learnings ✨

- Key takeaways and follow-ups (links to resources)

### STAR-ready bullets ⭐

- S:
- T:
- A:
- R:
