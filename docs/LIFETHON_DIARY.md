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
