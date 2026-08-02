import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Run tests in a Node.js environment
    environment: "node",

    // Discover tests only inside the tests directory
    include: ["tests/**/*.test.ts"],

    // Global setup before tests (we'll create this next)
    setupFiles: ["./tests/setup/setup.ts"],

    // Automatically expose describe, it, expect, etc.
    globals: true,

    // Restore mocked functions after every test
    restoreMocks: true,
    clearMocks: true,

    coverage: {
      provider: "v8",

      reporter: [
        "text",
        "html",
        "lcov",
      ],

      reportsDirectory: "./coverage",

      exclude: [
        "node_modules/**",
        "dist/**",
        "coverage/**",

        "prisma/**",

        "tests/**",

        "**/*.d.ts",

        "**/generated/**",

        "**/index.ts",

        "**/types.ts",
      ],
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});