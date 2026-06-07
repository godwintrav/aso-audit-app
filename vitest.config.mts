import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    include: ["packages/**/*.{test,spec}.ts", "apps/api/**/*.{test,spec}.ts"],
    passWithNoTests: false,
  },
});
