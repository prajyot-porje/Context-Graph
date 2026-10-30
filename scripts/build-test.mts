import { spawnSync } from "node:child_process";
const result = spawnSync(
  process.execPath,
  ["node_modules/next/dist/bin/next", "build"],
  {
    stdio: "inherit",
    windowsHide: true,
    env: {
      ...process.env,
      NEXT_DIST_DIR: ".next-build",
      SUPABASE_DATABASE_URL:
        "postgres://postgres:isolated-test-password@127.0.0.1:55439/postgres",
      DATABASE_SSL: "false",
      BETTER_AUTH_SECRET: "isolated-test-secret-at-least-thirty-two-characters",
      BETTER_AUTH_URL: "http://127.0.0.1:3100",
      NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3100",
      NEXT_PUBLIC_SUPABASE_URL: "https://fixture.invalid",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-only",
      SUPABASE_SERVICE_ROLE_KEY: "fixture-only",
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
      GEMINI_API_KEY: "",
      OPENROUTER_API_KEY: "fixture-only",
      RESEND_API_KEY: "fixture-only",
      NEXT_PUBLIC_MAINTENANCE_MODE: "false",
      NEXT_PUBLIC_AGENTATION_ENABLED: "false",
      CRON_SECRET: "isolated-test-cron",
    },
  },
);
process.exit(result.status ?? 1);
