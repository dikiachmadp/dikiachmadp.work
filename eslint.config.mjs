import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Git worktrees live here; linting them double-reports every finding
    // and walks their build output, which ".next/**" above does not match.
    ".claude/**",
    // Design references and their vendored runtime, not application code.
    "design_handoff_dikiachmadp_rebuild/**",
    "prisma/generated/**",
  ]),
]);

export default eslintConfig;
