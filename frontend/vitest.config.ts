import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["node_modules", ".next", "src/test"],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});

/*
  Install dev dependencies:

  npm install -D \
    vitest \
    @vitest/coverage-v8 \
    @vitejs/plugin-react \
    @testing-library/react \
    @testing-library/user-event \
    @testing-library/jest-dom \
    msw \
    jsdom

  Add to package.json scripts:
    "test":          "vitest run",
    "test:watch":    "vitest",
    "test:coverage": "vitest run --coverage"
*/
