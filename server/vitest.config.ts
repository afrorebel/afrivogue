import { defineConfig } from "vitest/config";

// Server tests run against a real MySQL/MariaDB database (DB_* below; override with env vars).
export default defineConfig({
  plugins: [
    {
      name: "sql-as-text",
      transform(code, id) {
        if (id.endsWith(".sql")) return { code: `export default ${JSON.stringify(code)};`, map: null };
      },
    },
  ],
  test: {
    environment: "node",
    include: ["server/tests/**/*.test.ts"],
    fileParallelism: false,
    env: {
      AFRIVOGUE_NO_LISTEN: "1",
      DB_HOST: process.env.TEST_DB_HOST || "127.0.0.1",
      DB_USER: process.env.TEST_DB_USER || "afrivogue",
      DB_PASSWORD: process.env.TEST_DB_PASSWORD || "localdev",
      DB_NAME: process.env.TEST_DB_NAME || "afrivogue_test",
      APP_URL: "http://localhost:3000",
      ADMIN_EMAIL: "editor@afrivogue.test",
      CRON_SECRET: "cron-test-secret",
      APP_SECRET: "app-test-secret",
      UPLOAD_DIR: "/tmp/afrivogue-test-uploads",
    },
  },
});
