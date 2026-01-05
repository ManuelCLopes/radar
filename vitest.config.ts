import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: "./client/src/test/setup.ts",
        include: ["**/*.{test,spec}.{ts,tsx}"],
        exclude: ["node_modules/**", "dist/**", "e2e/**"],
        alias: {
            "@": path.resolve(__dirname, "client", "src"),
            "@shared": path.resolve(__dirname, "shared"),
        },
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            exclude: [
                "node_modules/**",
                "dist/**",
                "**/*.d.ts",
                "**/*.test.ts",
                "**/*.test.tsx",
                "client/src/test/**",
                "vite.config.ts",
                "vitest.config.ts",
            ],
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "client", "src"),
            "@shared": path.resolve(__dirname, "shared"),
        },
    },
});
