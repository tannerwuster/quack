/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/packages"],
  testMatch: ["**/*.test.ts"],
  transform: {
    // Use our root strict tsconfig so ts-jest sees ES2022 lib (Error.cause),
    // esModuleInterop, exactOptionalPropertyTypes, etc.
    "^.+\\.ts$": [
      "ts-jest",
      { tsconfig: "<rootDir>/tsconfig.jest.json" },
    ],
  },
  moduleNameMapper: {
    // Resolve workspace package "@quack/protocol" to its source so
    // ts-jest can transform it without a build step.
    "^@quack/protocol$": "<rootDir>/packages/protocol/src/index.ts",
    // ui-browser's "@/…" alias, so its pure-logic units are testable.
    "^@/(.*)$": "<rootDir>/packages/ui-browser/src/$1",
  },
};
