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

## Entry — 2026-02-07 | Area: fullstack/security

- **Title:** BCrypt Password Hashing Implementation & Dynamic Navbar Authentication
- **Files / Paths:**
  - `backend/src/main/java/com/example/lifethon/service/AuthService.java`
  - `backend/src/main/java/com/example/lifethon/config/SecurityConfig.java`
  - `backend/src/main/java/com/example/lifethon/controller/AuthController.java`
  - `backend/pom.xml`
  - `frontend/app/components/NavBar.tsx`
  - `frontend/contexts/AuthContext.tsx` (recommended)
- **Stage:** Fixed (BCrypt complete, Auth Context recommended for frontend)
- **Tags:** #security #authentication #bcrypt #password-hashing #navbar #conditional-rendering #state-management

### Problem / Observation 🚧

- **CRITICAL SECURITY VULNERABILITY:** Passwords stored in plain text in database
- Plain text password comparison in login (`password.equals(user.getPassword())`)
- No password strength validation
- Navbar showed same content for logged-in and non-logged-in users
- No logout functionality in UI
- No visual indication of authentication state
- Frontend components couldn't access auth state globally
- Maven not recognized in PowerShell environment (tooling issue)

### Action / Fix ✅

**Backend Security Implementation:**

1. Added `spring-boot-starter-security` dependency to `pom.xml`
2. Created `SecurityConfig.java`:
   - Configured `BCryptPasswordEncoder` as `@Bean`
   - Disabled CSRF for API endpoints (using JWT instead)
   - Set all routes to `permitAll()` (custom JWT auth, not Spring Security's default)
3. Updated `AuthService.java`:
   - Injected `PasswordEncoder` via `@Autowired`
   - **Registration:** Changed `setPassword(password)` to `setPassword(passwordEncoder.encode(password))`
   - **Login:** Changed `password.equals(...)` to `passwordEncoder.matches(password, user.getPassword())`
   - Added password length validation (minimum 6 characters)
4. Updated `AuthController.java`:
   - Added `/api/auth/verify` endpoint with Authorization header parsing
   - Added `/api/auth/refresh` endpoint for token renewal
   - Added `/api/auth/logout` endpoint
   - Created `MessageResponse` DTO for simple responses
   - Fixed register method to include username parameter

**Frontend Authentication UI:**

1. Updated `NavBar.tsx` with conditional rendering:
   - Added `isAuthenticated` state based on localStorage token
   - Added `username` state for display
   - Logged-out users see: Home, Login, Sign Up
   - Logged-in users see: Home, Dashboard, username display, Logout button
2. Implemented logout functionality:
   - Calls backend `/api/auth/logout` endpoint
   - Clears localStorage (token, userId, username, email)
   - Updates component state
   - Redirects to login page
3. Documented Auth Context pattern for global state management (recommended approach)

**API Documentation Strategy:**

- Documented five approaches for managing API endpoints
- Recommended combination: Swagger/OpenAPI + API constants + typed service layer
- Created example API constants file structure
- Outlined Swagger setup with springdoc-openapi

**Development Environment:**

- Identified Maven not in PATH issue in PowerShell
- Documented four solutions: Maven Wrapper, Install Maven, IDE built-in, Chocolatey
- Recommended Maven Wrapper (`mvnw.cmd`) as easiest option

### Learnings ✨

**BCrypt Deep Dive:**

- BCrypt is intentionally slow (work factor 10 = 2^10 rounds) to prevent brute force
- Each hash includes unique salt - same password produces different hashes
- Hashes start with `$2a$`, `$2b$`, or `$2y$` prefix (identifies BCrypt algorithm)
- Format: `$2a$10$[22 char salt][31 char hash]`
- Cannot reverse BCrypt hashes - passwords must be reset, never recovered
- `passwordEncoder.encode()` for hashing, `passwordEncoder.matches()` for verification

**Spring Security Configuration:**

- Spring Security auto-configures default login form unless explicitly disabled
- CSRF protection needed for session-based auth, not for stateless JWT
- `permitAll()` allows public access while keeping Spring Security active for password encoding
- Can use Spring Security's `@PreAuthorize` for method-level security (future enhancement)

**React State Management Patterns:**

- **Component-level state:** Simple but doesn't persist across component unmounts
- **localStorage + useEffect:** Works but causes re-renders and doesn't share state
- **Context API:** Best for global auth state, automatic updates across all components
- **Custom hooks:** Encapsulate logic, make components cleaner
- Conditional rendering: `{condition ? <A /> : <B />}` for showing different UI

**Password Security Best Practices:**

- Minimum 8-12 characters recommended (currently 6)
- Should validate password complexity (uppercase, lowercase, numbers, symbols)
- Consider password strength meter in frontend
- Never log passwords (even encrypted)
- Use HTTPS in production to prevent man-in-the-middle attacks
- Consider rate limiting on login attempts

**Maven & Build Tools:**

- Maven Wrapper (`mvnw`) bundles specific Maven version with project - best for team consistency
- IntelliJ/Eclipse have built-in Maven - no separate installation needed
- `mvn clean` removes target directory, `install` compiles and packages
- `spring-boot:run` starts embedded Tomcat server
- PowerShell requires `.cmd` extension for batch files: `mvnw.cmd` not `mvnw`

**Frontend Authentication Patterns:**

- Token verification should happen on protected route entry
- Navbar should update immediately after login/logout (context helps)
- Consider refresh token rotation for better security
- Store minimal data in localStorage (tokens + user ID, not full user object)

**Follow-ups:**

- [ ] Implement Auth Context for global state management (recommended)
- [ ] Add frontend token verification on app mount
- [ ] Implement automatic token refresh before expiration
- [ ] Add password strength validation (8+ chars, complexity rules)
- [ ] Add password strength meter UI component
- [ ] Implement rate limiting on auth endpoints (prevent brute force)
- [ ] Add "Remember me" functionality with longer-lived tokens
- [ ] Create password reset flow (forgot password)
- [ ] Add email verification for new accounts
- [ ] Migrate existing plain-text passwords if any exist in database
- [ ] Add user profile page
- [ ] Implement protected route wrapper component
- [ ] Add loading states and better error messages in login/register
- [ ] Set up Swagger/OpenAPI documentation
- [ ] Create comprehensive API documentation
- [ ] Add password change functionality in user settings
- [ ] Consider implementing OAuth2 for Google/Facebook login
- [ ] Add session timeout warning
- [ ] Implement HTTPS in production
- [ ] Add security headers (helmet.js equivalent for Spring Boot)

**Resources:**

- [BCrypt Algorithm Explained](https://en.wikipedia.org/wiki/Bcrypt)
- [Spring Security Documentation](https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetsecurity.com/cheatsheets/password-storage-cheat-sheet.html)
- [React Context API](https://react.dev/reference/react/useContext)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Maven Documentation](https://maven.apache.org/guides/index.html)

### STAR-ready bullets ⭐

- **S:** Application had critical security vulnerability with plain-text password storage in database, no password hashing, and insecure authentication flow; additionally, navbar UI didn't reflect user authentication state, preventing users from accessing logout or seeing personalized content
- **T:** Required implementing industry-standard BCrypt password hashing for both registration and login flows, adding password validation, creating secure token verification endpoints, and building dynamic navbar component that conditionally renders based on authentication state while maintaining clean separation of concerns
- **A:** Integrated Spring Security dependency and configured BCryptPasswordEncoder bean with work factor 10; refactored AuthService to hash passwords with `passwordEncoder.encode()` during registration and verify with `passwordEncoder.matches()` during login; added password strength validation requiring minimum 6 characters; implemented three new auth endpoints (verify, refresh, logout) with proper Authorization header parsing; updated NavBar component with conditional rendering showing login/signup for unauthenticated users and dashboard/logout for authenticated users; documented Auth Context pattern for global state management and provided five API documentation strategies including Swagger/OpenAPI recommendation
- **R:** Eliminated critical security vulnerability by implementing BCrypt hashing with unique salts for each password (making database breaches non-exploitable); established production-ready authentication system with token refresh capability; created user-friendly navbar that dynamically updates based on auth state and provides clear logout functionality; improved developer experience by documenting Maven setup issues in PowerShell and providing four solution paths including Maven Wrapper recommendation; set foundation for scalable frontend auth state management with documented Context API pattern; identified 20+ follow-up security enhancements including password complexity rules, rate limiting, and OAuth2 integration for future iterations

---

## Entry — 2026-02-08 | Area: fullstack/oauth

- **Title:** Google OAuth 2.0 Integration with Backend Token Validation
- **Files / Paths:**
  - `backend/src/main/java/com/example/lifethon/service/AuthService.java`
  - `backend/src/main/java/com/example/lifethon/service/OAuthService.java`
  - `backend/src/main/java/com/example/lifethon/controller/AuthController.java`
  - `backend/src/main/resources/application.properties`
  - `backend/pom.xml`
  - `frontend/app/layout.tsx`
  - `frontend/app/login/page.tsx`
  - `frontend/.env.local`
- **Stage:** Fixed (Google OAuth complete, Facebook OAuth pending)
- **Tags:** #oauth #google-login #authentication #social-auth #token-validation #fullstack #api-integration

### Problem / Observation 🚧

- Application only supported traditional email/password authentication
- Users had to create separate accounts instead of using existing Google accounts
- No social login options reducing user convenience and signup conversion
- `googleLogin()` and `facebookLogin()` methods in AuthService were placeholder stubs returning dummy tokens
- Unclear OAuth implementation strategy (backend-only vs frontend-initiated)
- No Google Cloud project or OAuth credentials configured
- Frontend had dummy Google button that didn't actually authenticate
- Needed to handle OAuth flow securely without exposing secrets in frontend
- User creation logic needed for OAuth users who don't have passwords
- Provider context hierarchy unclear for combining Google OAuth with existing AuthProvider

### Action / Fix ✅

**Google Cloud & OAuth Setup:**

1. Created Google Cloud Project "LifeThon"
2. Enabled Google+ API for user profile access
3. Configured OAuth consent screen (external, with app name and contact info)
4. Created OAuth 2.0 Web Application credentials
5. Set authorized JavaScript origins: `http://localhost:3000`
6. Set authorized redirect URIs: `http://localhost:3000/auth/google/callback`
7. Obtained and secured Google Client ID (saved in environment variables)

**Backend OAuth Implementation:**

1. Added dependencies to `pom.xml`:
   - `google-api-client` (v2.2.0) for Google ID token verification
   - `google-http-client-jackson2` (v1.43.3) for JSON processing
2. Created `OAuthService.java` with token verification methods:
   - `verifyGoogleToken()` - validates ID token with Google's servers using `GoogleIdTokenVerifier`
   - `verifyFacebookToken()` - validates access token with Facebook Graph API (prepared for future)
   - Extracts user info: email, firstName, lastName, profile picture
   - Returns strongly-typed `GoogleUserInfo` and `FacebookUserInfo` POJOs
3. Updated `AuthService.java`:
   - Injected `OAuthService` via `@Autowired`
   - Implemented `googleLogin(String idToken)`:
     - Verifies token authenticity with Google
     - Checks if user exists by email
     - If exists: logs in existing user with JWT
     - If new: creates account with random BCrypt password, saves to DB, returns JWT
   - Implemented `facebookLogin(String accessToken)` with same pattern (ready for activation)
   - Auto-creates OAuth users without requiring password (sets random UUID password)
4. Updated `AuthController.java`:
   - Changed `/api/auth/google` from no-param to accepting `GoogleLoginRequest` DTO
   - Changed `/api/auth/facebook` from no-param to accepting `FacebookLoginRequest` DTO
   - Added proper request body parsing with `@RequestBody`
   - Enhanced error handling (401 for invalid tokens, 500 for server errors)
5. Configured `application.properties`:
   - Added `oauth.google.client-id` property
   - Added `oauth.facebook.app-id` and `oauth.facebook.app-secret` (placeholders)

**Frontend OAuth Integration:**

1. Installed `@react-oauth/google` package (official Google OAuth library for React)
2. Updated `app/layout.tsx`:
   - Wrapped app in `GoogleOAuthProvider` with client ID from environment
   - Established provider hierarchy: `GoogleOAuthProvider` → `AuthProvider` → app content
   - Ensures Google OAuth context available throughout application
3. Created `.env.local` with `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
4. Updated `app/login/page.tsx`:
   - Removed custom Google button, replaced with official `<GoogleLogin>` component
   - Implemented `handleGoogleSuccess()`:
     - Extracts credential (ID token) from Google response
     - Sends to backend `/api/auth/google` endpoint
     - Receives JWT token from backend
     - Uses `AuthContext.login()` for centralized state management
   - Implemented `handleGoogleError()` callback for user cancellations
   - Configured Google button: outline theme, large size, "continue_with" text
   - Integrated with existing AuthContext (no direct localStorage manipulation)
5. Leveraged existing `AuthContext`:
   - `login()` method handles token storage and navigation
   - Navbar automatically updates on successful OAuth login
   - Token verification still happens on protected routes

**Security Patterns:**

- Frontend never sees or stores Google Client Secret (not needed for ID token flow)
- Backend validates tokens with Google's servers (prevents token forgery)
- OAuth users get random passwords (prevents unauthorized password login)
- Same JWT auth flow used for both OAuth and traditional login (consistency)
- ID tokens verified using Google's official libraries (best practice)

**Architecture Decision:**

- Chose **Scenario B** (Frontend-initiated, Backend-validates):
  - Frontend uses Google's popup/redirect to get ID token
  - Backend verifies token authenticity and extracts user info
  - More secure than backend-only redirect (no secret exposure)
  - Better UX (popup instead of full redirect)
  - Industry standard pattern used by major applications

### Learnings ✨

**OAuth 2.0 Flow Deep Dive:**

- **ID Token vs Access Token:**
  - ID Token: JWT containing user identity info (email, name, etc.) - used for authentication
  - Access Token: Opaque string for accessing Google APIs - used for authorization
  - We use ID token for login (don't need API access)
- **Token Verification is Critical:**
  - Never trust tokens from frontend without backend verification
  - Google provides `GoogleIdTokenVerifier` to validate signatures
  - Verifier checks: signature, issuer, audience, expiration
- **OAuth doesn't require backend Client Secret** for ID token validation (only Client ID needed)
- **Audience claim** in ID token must match your Client ID (prevents token theft)

**Google OAuth Provider Hierarchy:**

- Per official [@react-oauth/google docs](https://github.com/MomenSherif/react-oauth-google):
  - Provider should wrap entire app at root level, not individual components
  - Wrapping per-component causes re-initialization on every render (performance issue)
  - Context must be available to all components that might use `<GoogleLogin>`
- **Correct pattern:** `GoogleOAuthProvider` wraps `AuthProvider` wraps app
- Both contexts coexist and complement each other

**Spring Boot OAuth Integration:**

- Spring Security OAuth2 would be overkill for just token validation
- Manual validation with `google-api-client` gives more control
- Can validate Google tokens without full Spring Security OAuth2 setup
- `RestTemplate` works well for Facebook Graph API calls
- Consider using `WebClient` for async operations in future (more modern than `RestTemplate`)

**User Management for OAuth:**

- OAuth users don't have passwords in traditional sense
- Strategy: Set random UUID password with BCrypt (prevents password login attacks)
- Alternative strategies considered:
  - NULL password field (rejected - violates NOT NULL constraint)
  - Special marker password (rejected - less secure)
  - Separate OAuth user table (rejected - over-engineering)
- Email is unique identifier linking OAuth and traditional accounts
- If user registers traditionally, then tries OAuth: logs into existing account
- If user logs in via OAuth, then tries traditional: must reset password

**Frontend Best Practices:**

- Official `<GoogleLogin>` component handles:
  - Button styling per Google brand guidelines
  - Popup/redirect flow
  - Token retrieval
  - CSRF protection
  - One Tap support (prompts returning users automatically)
- `useOneTap` prop enables seamless re-authentication
- Environment variables pattern: `NEXT_PUBLIC_*` for client-side variables in Next.js

**Security Considerations:**

- Never send Client Secret to frontend
- ID tokens are short-lived (1 hour typically)
- Backend should always verify tokens, never trust frontend
- OAuth users should verify email ownership (Google already does this)
- Consider adding state parameter for CSRF protection in production
- Rate limit OAuth endpoints to prevent abuse

**Debugging OAuth Issues:**

- Check Google Cloud Console for authorized origins/redirects
- Verify Client ID matches exactly (copy-paste, don't type)
- Test in incognito mode (cookies/cache can interfere)
- Check browser console for detailed error messages from Google
- Backend logs show token verification failures with specific reasons

**Follow-ups:**

- [ ] Complete Facebook OAuth integration (similar to Google pattern)
- [ ] Add OAuth provider icons/branding to login page
- [ ] Implement account linking (merge OAuth and traditional accounts)
- [ ] Add email verification for traditional signups to match OAuth security
- [ ] Store OAuth provider info in User entity (google_id, facebook_id columns)
- [ ] Add profile picture URL storage from OAuth providers
- [ ] Implement "Continue with Google" on register page too
- [ ] Add loading states during OAuth flow
- [ ] Handle edge case: user deletes Google account, then tries to login
- [ ] Add option to disconnect OAuth provider from settings
- [ ] Implement OAuth token refresh (for accessing Google APIs later)
- [ ] Add state parameter for CSRF protection
- [ ] Consider supporting additional OAuth providers (GitHub, Microsoft, Apple)
- [ ] Add analytics tracking for OAuth vs traditional login
- [ ] Test OAuth flow on production domain (not just localhost)
- [ ] Add rate limiting on OAuth endpoints
- [ ] Implement account recovery for OAuth-only accounts
- [ ] Add "Sign in with Google" button to registration page
- [ ] Store last login method in database for UX improvements
- [ ] Handle Google account email changes (rare but possible)

**Resources:**

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google ID Token Validation](https://developers.google.com/identity/sign-in/web/backend-auth)
- [@react-oauth/google Official Docs](https://github.com/MomenSherif/react-oauth-google)
- [OAuth 2.0 Simplified](https://aaronparecki.com/oauth-2-simplified/)
- [Google API Client for Java](https://github.com/googleapis/google-api-java-client)
- [OWASP OAuth Security Cheat Sheet](https://cheatsheetsecurity.com/cheatsheets/oauth-2-0-security-cheat-sheet/)
- [Next.js Environment Variables](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables)

### STAR-ready bullets ⭐

- **S:** Application lacked social login functionality, forcing users to create separate accounts instead of leveraging existing Google credentials; had placeholder OAuth methods returning dummy tokens with no actual implementation; needed to design secure OAuth flow without exposing API secrets to frontend
- **T:** Required implementing complete Google OAuth 2.0 flow with frontend-initiated authentication and backend token validation; needed to set up Google Cloud Project with proper credentials and authorized origins; had to create secure user management for OAuth accounts without passwords; must integrate official Google OAuth library while maintaining existing AuthContext state management and auto-redirect functionality
- **A:** Set up Google Cloud Project with OAuth 2.0 credentials and configured authorized JavaScript origins; integrated Google API Client library in Spring Boot backend with custom OAuthService for token verification using GoogleIdTokenVerifier; implemented user auto-creation with random BCrypt passwords for OAuth users; created frontend integration with official @react-oauth/google library wrapped at root layout level; established provider hierarchy (GoogleOAuthProvider → AuthProvider) following official documentation best practices; built secure token exchange flow where frontend obtains ID token from Google popup, sends to backend for verification, backend validates with Google servers and returns JWT; integrated OAuth login with existing AuthContext using centralized login() method for state management and automatic navbar updates
- **R:** Successfully implemented production-ready Google OAuth authentication enabling users to sign in with existing Google accounts; achieved seamless integration with existing JWT auth system using same token format and validation flow; established secure architecture where Client Secret never exposed to frontend and all tokens verified server-side; created automatic user provisioning for new OAuth users while preventing duplicate accounts through email matching; improved user experience with official Google-branded login button supporting One Tap re-authentication; set foundation for multi-provider OAuth support with reusable patterns documented for Facebook and other providers; reduced signup friction and increased security by leveraging Google's identity verification instead of requiring email verification flow

---

## Entry — 2026-02-10 | Area: frontend/backend

- **Title:** Gacha System Implementation with Pity Mechanics
- **Files / Paths:** `backend/src/main/java/com/example/lifethon/entity/`, `backend/src/main/java/com/example/lifethon/service/GachaService.java`, `frontend/app/gacha/page.tsx`, `frontend/app/dashboard/page.tsx`
- **Stage:** WIP
- **Tags:** #feature #game-mechanics #full-stack

### Problem / Observation 🚧

- Needed a monetization/engagement system for the LifeThon app
- Required secure implementation where user data comes from JWT, not URL params
- Debated between separate admin frontend vs single frontend with role-based pages

### Action / Fix ✅

- Built complete gacha system with 4 entities (GachaItem, UserInventory, GachaPull, UserCoins)
- Implemented pity system: hard pity at 90 pulls, soft pity starting at 75 with rate increases
- Created 3 services (GachaService, InventoryService, CoinService) and matching REST controllers
- Built React frontend with pull animations, rarity-based styling, and real-time data fetching
- Used `/dashboard` and `/gacha` routes (no userId in URL) - security via JWT extraction on backend
- Auto-populated sample gacha items via Spring Boot CommandLineRunner

### Learnings ✨

- JWT token should carry user identity, not URL - prevents unauthorized access attempts
- Single frontend with admin pages is simpler than separate admin app (shared auth, styling, components)
- Pity systems require careful rate calculation and pull history tracking
- TypeScript interfaces must match backend DTOs exactly for type safety
- React useEffect must be placed after function declarations to avoid "cannot access before initialization"

### STAR-ready bullets ⭐

- **S:** LifeThon app needed engaging monetization feature with secure user data handling
- **T:** Design and implement full-stack gacha system with drop rates, pity mechanics, inventory, and virtual currency
- **A:** Built Spring Boot backend with JPA entities, services with transactional integrity, REST APIs; created React frontend with animations and real-time updates; secured all endpoints via JWT extraction
- **R:** Delivered working gacha with 5 rarity tiers (1%-60% rates), 90-pull pity guarantee, multi-pull discounts, and responsive UI ready for production

---

## Entry — 2026-02-12 | Area: full-stack

- **Title:** Role-Based Admin System for Gacha Management
- **Files / Paths:** `backend/src/main/java/com/example/lifethon/entity/User.java`, `backend/src/main/java/com/example/lifethon/util/JwtUtil.java`, `backend/src/main/java/com/example/lifethon/controller/GachaAdminController.java`, `backend/src/main/java/com/example/lifethon/service/GachaAdminService.java`, `frontend/contexts/AuthContext.tsx`, `frontend/app/dashboard/page.tsx`, `frontend/app/admin/gacha/page.tsx`
- **Stage:** Fixed
- **Tags:** #feature #security #admin #full-stack

### Problem / Observation 🚧

- Needed admin functionality to create/edit/delete gacha items and manage drop rates
- Debated separate admin app vs single app with role-based pages
- Required secure role verification without database calls on every request

### Action / Fix ✅

- Added `role` enum (USER/ADMIN) to User entity with database migration
- Updated JwtUtil to embed role in JWT token and added `isAdmin()` verification method
- Created GachaAdminController with 7 endpoints (CRUD, toggle, validate rates, stats) using role-based authorization
- Built GachaAdminService for item management with drop rate validation (must sum to 100%)
- Updated AuthContext to include role in user interface and expose `isAdmin()` helper
- Added admin panel UI in Quick Actions grid (conditionally rendered for admins only)
- SQL upgrade path: `UPDATE users SET role = 'ADMIN' WHERE email = '...'`

### Learnings ✨

- JWT claims are perfect for roles - no DB query per request, tamper-proof via signature
- TypeScript requires updating both interface definition AND default context value when adding new properties
- Single frontend with role-based routes is simpler than separate admin app (shared auth, components, styling)
- Drop rate validation critical for gacha systems - active items must always sum to 100%
- Admin endpoints should fail-secure: verify role first, then process request

### STAR-ready bullets ⭐

- **S:** Gacha system needed admin controls for item management, but adding role-based access required secure implementation without performance overhead
- **T:** Design and implement role-based authorization system allowing admins to manage gacha items while preventing unauthorized access
- **A:** Added role enum to User entity; embedded role in JWT claims for stateless verification; created admin endpoints with `isAdmin()` checks; built React admin panel with conditional rendering; provided SQL upgrade path for existing users
- **R:** Delivered secure admin system with zero DB overhead per request; admins can manage 20+ items via CRUD operations, validate drop rates in real-time, and view statistics; regular users have no access via 403 responses

---

## Entry — 2026-02-15 | Area: frontend

- **Title:** Next.js Component Architecture - Server vs Client Components
- **Files / Paths:** `frontend/app/flashcards/page.tsx`, `frontend/components/FlashcardPractice.tsx`
- **Stage:** Fixed
- **Tags:** #learning #refactor #architecture #best-practices

### Problem / Observation 🚧

- Initially put all logic directly in `page.tsx` with `"use client"`, treating it like a regular React component
- This violated Next.js best practices: pages should default to Server Components, with Client Components extracted separately
- Larger JavaScript bundle shipped to client, missing performance benefits of server-side rendering

### Action / Fix ✅

- Refactored to keep `page.tsx` as Server Component (no `"use client"`)
- Extracted all interactive logic to `components/FlashcardPractice.tsx` with `"use client"` directive
- Followed Next.js pattern: page = routing layer, component = interactivity layer
- Referenced official docs: "Add 'use client' to specific interactive components instead of marking large parts of your UI as Client Components"

### Learnings ✨

- Server Components are default in Next.js App Router - `"use client"` should be exception, not rule
- Separation enables future server-side data fetching in page while keeping client bundle small
- Better architecture: page.tsx for routing/data, separate components for interactivity
- When in doubt, check docs rather than assume based on previous React experience
- Performance: smaller JS bundle = faster initial load

### STAR-ready bullets ⭐

- **S:** Building flashcard feature for interview prep, initially structured all logic in page.tsx with "use client"
- **T:** Realized approach violated Next.js architecture - needed to refactor to follow Server/Client Component best practices
- **A:** Studied official Next.js docs, refactored page to Server Component, extracted interactive logic to separate Client Component, reduced client bundle size
- **R:** Cleaner architecture following framework conventions, smaller JavaScript bundle, easier to add server-side features later, learned to verify assumptions against official documentation

---

## Entry — 2026-02-17 | Area: infra

- **Title:** WSL1 Network Monitoring Limitations & Health Check Scripts
- **Files / Paths:** `~/lifethon-ops/system-health.sh`, `~/lifethon-ops/troubleshoot-service.sh`
- **Stage:** Fixed
- **Tags:** #learning #infra #monitoring #wsl

### Problem / Observation 🚧

- `sudo netstat -tulpn` showed empty output in WSL1 despite backend running on port 8081
- `curl http://localhost:8081` worked fine, proving service was up
- Discovered WSL1 shares Windows network stack - no Linux kernel networking

### Action / Fix ✅

- Researched Microsoft WSL docs: WSL1 uses translation layer, not real Linux kernel
- Built connectivity-based health checks instead of socket-based monitoring
- Created operational scripts: system-health.sh, troubleshoot-service.sh, status.sh
- Scripts test actual HTTP endpoints with curl, check processes with ps, monitor resources
- Use `netstat -ano` from Windows PowerShell to see actual ports

### Learnings ✨

- WSL1 limitation taught better practice: test connectivity > check sockets
- Listening port ≠ healthy service - connectivity tests more meaningful
- AWS uses same approach: ALB health checks use HTTP requests, not netstat
- Adapted troubleshooting methodology to environment constraints
- Real production (AWS Linux) uses standard netstat/ss since they have full kernel

### STAR-ready bullets ⭐

- **S:** Building monitoring for LifeThon in WSL1, netstat showed no listening ports despite services running
- **T:** Needed reliable health checks to practice AWS operational scenarios without native Linux networking
- **A:** Researched WSL1 architecture limitations, built connectivity-based health check scripts using curl and process checks instead of socket inspection, created troubleshooting toolkit with 4 operational scripts
- **R:** Developed monitoring approach that works in constrained environment and follows AWS best practices (test connectivity not just ports); created reusable ops toolkit demonstrating systematic troubleshooting

---

## Entry — 2026-02-20 | Area: infra

- **Title:** Linux File Operations & Navigation Practice
- **Files / Paths:** `/home/user/`, `/mnt/c/Users/User/Desktop/playground/`
- **Stage:** Fixed
- **Tags:** #learning #linux #commands #interview-prep

### Problem / Observation 🚧

- Needed hands-on practice with core Linux commands for AWS interview
- Covered: file creation/deletion, copying, moving, hard/soft links, directory navigation
- Practiced in WSL1 environment using playground directory for safe experimentation

### Action / Fix ✅

**Directory Operations:**

- `mkdir dir1 dir2` - Create multiple directories
- `mkdir -p path/to/nested/dir` - Create nested directories
- `rmdir` / `rm -r` - Remove empty/non-empty directories

**File Operations:**

- `cp /etc/passwd .` - Copy file to current directory
- `cp -v` - Verbose (shows what's copied)
- `cp -i` - Interactive (prompts before overwrite)
- `cp -r` - Recursive (for directories)
- `mv file1 file2` - Rename file
- `mv file dir/` - Move file to directory
- `mv -i` - Interactive move with prompt
- `rm -i` - Interactive delete with confirmation

**Links (Advanced):**

- `ln file hardlink` - Create hard link (same inode, reference count increases)
- `ln -s target symlink` - Create symbolic link (different inode, points to path)
- Verified with `ls -li` - shows inode numbers and link counts
- Hard links: 4 references to same file (same inode: 77687093572246986)
- Soft links: separate inode, shows as `lrwxrwxrwx` with `->` pointer
- Deleting original breaks symlinks but hard links remain valid

**Navigation:**

- `cd ~` - Home directory
- `cd ../` - Parent directory
- `cd /` - Root directory
- `cd -` - Previous directory
- Tab completion for paths

### Learnings ✨

**Hard Links vs Soft Links:**

- Hard link: Direct reference to inode, survives original deletion, same filesystem only
- Soft link: Pointer to path, breaks if target deleted, works across filesystems
- Link count in `ls -l` shows number of hard links (4 in example)
- Symbolic links show as `l` in permissions and display target with `->`

**Best Practices:**

- Always use `-i` flag for destructive operations (cp, mv, rm) to prevent accidents
- Use `-v` for verbose output when debugging or learning
- Check with `ls -li` to verify inodes and understand link relationships
- Practice in safe playground directory before applying to production

**Interview-Ready Explanation:**
_"Hard links create multiple directory entries pointing to the same inode - they're essentially different names for the same file. The file isn't deleted until all hard links are removed. Soft links are separate files that store a path to the target - like shortcuts. If the original is deleted, the symlink breaks."_

**Key Commands for Interview:**

- `ls -li` - List with inodes to understand links
- `cp -r` - Recursive copy for directories
- `mv` - Both rename and move (same command)
- `rm -rf` - Force remove (dangerous, use carefully)
- Tab completion - speeds up navigation significantly

### STAR-ready bullets ⭐

- **S:** Preparing for AWS Systems Engineer interview, needed practical experience with Linux file operations beyond just knowing commands theoretically
- **T:** Practice essential file management commands hands-on, understand differences between hard/soft links, build muscle memory for navigation and safe file operations
- **A:** Created playground environment for safe experimentation, practiced mkdir/cp/mv/rm with various flags (-i, -v, -r), created and tested hard/soft links with ln, verified behavior with ls -li, learned tab completion for efficiency
- **R:** Gained hands-on experience with 15+ essential Linux commands, understand inode concept and link differences, can explain hard vs soft links clearly, built safe habits (using -i flag), ready to demonstrate these operations in technical interview

---

# Entry — 2025-02-24 | Area: frontend + backend + docs

Title: API docs, Swagger setup, NavBar polish, Inventory page
Files / Paths: frontend/app/inventory/page.tsx, frontend/components/NavBar.tsx, backend/pom.xml, lifethon-api.yaml
Stage: Fixed
Tags: #docs #ui #feature #debug

# Problem / Observation 🚧

No API documentation existed — hard to test endpoints or onboard
NavBar was plain MUI default with no branding
Google login redirect used window.location.href causing page reload before error could be inspected
Inventory page didn't exist; DTO structure was flat but component assumed nested gachaItem.\*

# Action / Fix ✅

Generated OpenAPI 3.0 YAML (lifethon-api.yaml) covering all /api/auth and /api/users endpoints with request/response schemas
Added springdoc-openapi-starter-webmvc-ui to pom.xml → Swagger UI live at /swagger-ui.html
Improved NavBar: added DirectionsRunIcon, two-tone logo, gradient background, outlined Sign Up button, removed MUI all-caps
Replaced window.location.href with router.push() to preserve console logs; added error logging on non-OK responses
Built InventoryPage.tsx matching flat InventoryItemDTO fields — search/rarity/type filters, equip/unequip/discard actions, item detail modal, consumable "Use" button

# Learnings ✨

window.location.href causes full reload — always use router.push() in Next.js for client nav
Springdoc auto-generates OpenAPI from controllers but can also serve a hand-written YAML via springdoc.swagger-ui.url
DTO shape must be confirmed before building UI — flat vs nested changes every field reference

# STAR-ready bullets ⭐

S: Project lacked API docs and key frontend pages (inventory), making development and testing slow
T: Document the full REST API, improve UI polish, and build the inventory feature end-to-end
A: Wrote OpenAPI YAML spec, integrated Swagger UI into Spring Boot, rebuilt NavBar with branding, and built a filtered inventory page wired to the live DTO
R: Full API now browsable and testable via Swagger UI; inventory page supports filtering by rarity/type and all item actions (equip, discard, use)

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
