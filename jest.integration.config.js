module.exports = {
    // display name
    displayName: "integration",
  
    // when testing backend
    testEnvironment: "node",
  
    // which test to run
    testMatch: [

      "<rootDir>/integration-tests/*.test.js"
    ],
  
    collectCoverage: true,
    collectCoverageFrom: [
      "config/**/*.js",
      "controllers/**/*.js",
      "models/**/*.js",
      "!**/*.test.js", // Exclude all test files from coverage
    ],
    coverageDirectory: "coverage/integration",
    coverageThreshold: {
      global: {
        lines: 20,
        functions: 20,
      },
    },

    setupFiles: ["<rootDir>/jest.setup.js"]
  };
  