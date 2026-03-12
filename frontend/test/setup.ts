import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./mocks/server";

// Start MSW before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));

// Reset handlers and clean up DOM between tests
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Stop MSW after all tests
afterAll(() => server.close());

// ── Global mocks for Next.js internals ───────────────────────────────────────
// These are applied once here so every test file gets them automatically.

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  usePathname: () => "/",
}));

// Expose the router spies so individual tests can assert on them
export { mockPush, mockReplace, mockBack };
