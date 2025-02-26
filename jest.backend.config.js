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
    collectCoverageFrom: ["controllers/**"],
    collectCoverageFrom: ["middlewares/**"],
    coverageThreshold: {
      global: {
        lines: 0,
        functions: 0,
      },
    },
  };