/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src/tests"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  testMatch: ["**/?(*.)+(spec|test).[tj]s?(x)"],
  coverageReporters: ["html", "text", "lcov"],
};