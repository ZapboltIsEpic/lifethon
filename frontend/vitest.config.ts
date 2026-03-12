import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true, // exposes vi, describe, it, expect globally
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["node_modules", ".next", "test"],
    },
  },
  resolve: {
    alias: {
      // Next.js projects with no src/ folder use "@" → project root
      "@": path.resolve(__dirname, "../.."),
    },
  },
});

/*
  ── Install (run from your Next.js project root) ─────────────────────────────

  npm install -D \
    vitest \
    @vitest/coverage-v8 \
    @vitejs/plugin-react \
    @testing-library/react \
    @testing-library/user-event \
    @testing-library/jest-dom \
    msw \
    jsdom

  ── Add to package.json scripts ───────────────────────────────────────────────

  "test":          "vitest run",
  "test:watch":    "vitest",
  "test:coverage": "vitest run --coverage",
  "test:ui":       "vitest --ui"

  ── File placement ────────────────────────────────────────────────────────────

  Place this config at:    vitest.config.ts          (project root)
  Place setup at:          test/setup.ts
  Place mocks at:          test/mocks/handlers.ts
                           test/mocks/server.ts
  Place test files at:     __tests__/AuthContext.test.tsx
                           __tests__/SettingsPage.test.tsx
                           __tests__/LoginPage.test.tsx
                           __tests__/api.test.ts

  The "@" alias matches your tsconfig.json paths: { "@/*": ["./*"] }
*/
