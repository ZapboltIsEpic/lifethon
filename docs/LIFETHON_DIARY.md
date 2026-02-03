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
