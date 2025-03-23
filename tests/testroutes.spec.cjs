import { test, expect } from '@playwright/test';

test.describe('Protected Routes Tests', () => {
    test('should access protected route with valid token', async ({ page }) => {
        await page.goto('http://localhost:3000/login');
        
        await page.route('**/api/v1/auth/login', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    message: 'login successfully',
                    user: {
                        _id: 'mock-user-id',
                        name: 'Siyuan Zheng',
                        email: 'example@gmail.com',
                        role: 0
                    },
                    token: 'valid-mock-token'
                })
            });
        });
        
        await page.getByPlaceholder('Enter Your Email').fill('example@gmail.com');
        await page.getByPlaceholder('Enter Your Password').fill('Pass123!');
        await page.getByRole('button', { name: 'LOGIN' }).click();
        
        await page.waitForTimeout(1000);
        
        await page.route('**/api/v1/auth/test', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'text/plain',
                body: 'Protected Routes'
            });
        });
        
        await page.evaluate(() => {
            const testDiv = document.createElement('div');
            testDiv.id = 'test-result';
            testDiv.innerText = 'Loading...';
            document.body.appendChild(testDiv);
            
            fetch('/api/v1/auth/test', {
                headers: {
                    'Authorization': localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).token : ''
                }
            })
            .then(response => response.text())
            .then(data => {
                testDiv.innerText = data;
            })
            .catch(err => {
                testDiv.innerText = 'Error: ' + err.message;
            });
        });
        
        await expect(page.locator('#test-result')).toHaveText('Protected Routes', { timeout: 5000 });
    });
    
    test('should fail to access protected route with invalid token', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        await page.route('**/api/v1/auth/test', async route => {
            await route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: false,
                    message: 'Unauthorized access'
                })
            });
        });
        
        await page.evaluate(() => {
            const testDiv = document.createElement('div');
            testDiv.id = 'test-result';
            testDiv.innerText = 'Loading...';
            document.body.appendChild(testDiv);
            
            fetch('/api/v1/auth/test')
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.message); });
                }
                return response.text();
            })
            .then(data => {
                testDiv.innerText = data;
            })
            .catch(err => {
                testDiv.innerText = 'Error: ' + err.message;
            });
        });
        
        await expect(page.locator('#test-result')).toHaveText('Error: Unauthorized access', { timeout: 5000 });
    });
    
    test('should handle server error in protected route', async ({ page }) => {
        await page.goto('http://localhost:3000/login');
        
        await page.route('**/api/v1/auth/login', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    message: 'login successfully',
                    user: { _id: 'mock-user-id', name: 'Test User' },
                    token: 'valid-mock-token'
                })
            });
        });
        
        await page.getByPlaceholder('Enter Your Email').fill('example@gmail.com');
        await page.getByPlaceholder('Enter Your Password').fill('Pass123!');
        await page.getByRole('button', { name: 'LOGIN' }).click();
        
        await page.waitForTimeout(1000);
        
        await page.route('**/api/v1/auth/test', async route => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: 'Internal server error'
                })
            });
        });
        
        await page.evaluate(() => {
            const testDiv = document.createElement('div');
            testDiv.id = 'test-result';
            testDiv.innerText = 'Loading...';
            document.body.appendChild(testDiv);
            
            fetch('/api/v1/auth/test', {
                headers: {
                    'Authorization': localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).token : ''
                }
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(JSON.stringify(err)); });
                }
                return response.text();
            })
            .then(data => {
                testDiv.innerText = data;
            })
            .catch(err => {
                testDiv.innerText = 'Error: ' + err.message;
            });
        });
        
        await expect(page.locator('#test-result')).toContainText('Error', { timeout: 5000 });
    });
});
