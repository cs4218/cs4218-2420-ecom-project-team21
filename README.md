# Testing with Jest

## Running Tests

To run tests for backend files, use the following command:
```sh
npm run test-backend
```

## Jest Configuration

Update the `jest.backend.config.js` file in the root of your project to customize Jest configuration:
Current Jest config:
```js
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
```
