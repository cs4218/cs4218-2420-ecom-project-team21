module.exports = {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: [
    "<rootDir>/controllers/*.test.js", 
    "<rootDir>/middlewares/*.test.js"
  ],

  collectCoverage: true,
  collectCoverageFrom: [
    "config/**/*.js",
    "controllers/**/*.js",
    "helpers/**/*.js",
    "middlewares/**/*.js",
    "models/**/*.js",
  ],
  coverageDirectory: "coverage/backend",
  coverageThreshold: {
    global: {
      lines: 20,
      functions: 20,
    },
  },
};