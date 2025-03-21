# Running the App
## MongoDB setup
1. Create a New Database
2. Configure Database Access
3. Whitelist IP Address:
Go to "Network Access" and whitelist your IP address (e.g., 0.0.0.0) to allow access from your machine.
4. Connect to the Database:
Click on "Connect" and choose "Connect with MongoDB Compass".
Copy the connection string and add it to your project's .env file, replacing username and password placeholders.
5. Establish Connection with MongoDB Compass:
Open MongoDB Compass, paste the connection string, and establish a connection to your cluster.

## Clone the Repository
1. Navigate to the GitHub repository of the MERN application.
2. Click on the **"Code"** button and copy the repository URL.
3. Open your terminal and run the following command:

   ```sh
   git clone <repository_url>

## Install Dependencies
1. Navigate into backend directory (where `package.json` file for the backend is located) and install backend dependencies:
```sh
npm install
```
2. Navigate into frontend directory (where `package.json` file for the frontend is located) and install frontend dependencies:
```sh
npm install
```
## Setup Environment variables
1. copy and paste your mongoDB URI to the .env file under MONGO_URL

## Running the App
1. Open your web browser.
2. Navigate to `http://localhost:3000` to access the application.
3. Use `npm run dev` to run the app, which starts the development server.


## Testing with Jest
## Running Tests
To run tests for backend files, use the following command:
```sh
npm run test-backend
```

To run tests for Frontend files, use the following command:
```sh
npm run test-frontend
```

To run integration tests, use the following command:
```sh
npm run test-integration
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
## Testing with Playwright
UI tests are found under /tests folder.
1. Ensure that mongodb is running with the test data given.
2. To run playwright tests, simply run:
```sh
npx playwright test
```
# workflow URL
https://github.com/cs4218/cs4218-2420-ecom-project-team21/actions
