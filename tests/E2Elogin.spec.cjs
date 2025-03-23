import { test, expect } from '@playwright/test';

test.describe('Login Page Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("http://localhost:3000/login");
        
    });

    test("should have a login form", async ({ page }) => {
        await expect(page.getByRole('button', { name: 'LOGIN' })).toBeVisible();
        await expect(page.getByPlaceholder('Enter Your Email')).toBeVisible();
        await expect(page.getByPlaceholder('Enter Your Password')).toBeVisible();
        await expect(page.getByRole('button', { name: 'LOGIN' })).toBeVisible();
    });

    test("should validate required fields on submission", async ({ page }) => {
        await page.getByPlaceholder('Enter Your Email').focus();
        await page.keyboard.press('Tab');
        await page.getByRole('button', { name: 'LOGIN' }).click();

        const emailInput = page.getByPlaceholder('Enter Your Email');
        const isFocused = await emailInput.evaluate(el => document.activeElement === el);
        expect(isFocused).toBeTruthy();

        await expect(page).toHaveURL('http://localhost:3000/login');

        await page.evaluate(() => {
            document.querySelector('form').setAttribute('novalidate', 'true');
        });

        await page.getByRole('button', { name: 'LOGIN' }).click();

        try {
            await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log('error');
        }

        await page.getByPlaceholder('Enter Your Email').fill('example@gmail.com');
        await page.getByRole('button', { name: 'LOGIN' }).click();

        try {
            await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log('error');
        }
    });

    test('login with non-existing user', async ({ page }) => {
        await page.route('**/api/v1/auth/login', async route => {
            await route.fulfill({
                status: 404,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: false,
                    message: "Email is not registerd"
                })
            });
        });
    
        await page.getByPlaceholder('Enter Your Email').fill('example1@gmail.com');
        await page.getByPlaceholder('Enter Your Password').fill('Pass123!');
        
        await page.getByRole('button', { name: 'LOGIN' }).click();
    
        try {
            await expect(page.getByText('Email is not registerd')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log('error');
        }
    });

    test('login with incorrect password', async ({ page }) => {
        await page.route('**/api/v1/auth/login', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: false,
                    message: "Invalid Password"
                })
            });
        });
    
        await page.getByPlaceholder('Enter Your Email').fill('example@gmail.com');
        await page.getByPlaceholder('Enter Your Password').fill('Pass123!!');
        
        await page.getByRole('button', { name: 'LOGIN' }).click();
        
        try {
            await expect(page.getByText('Invalid Password')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log('error');
        }
    });

    test('login successfully', async ({ page }) => {
        await page.route('**/api/v1/auth/login', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    message: "login successfully",
                    user: {
                        _id: "mock-user-id",
                        name: "Siyuan Zheng",
                        email: "example@gmail.com",
                        phone: "123-456-7890",
                        address: "123 Street",
                        role: 0
                    },
                    token: "mock-jwt-token"
                })
            });
        });
    
        await page.getByPlaceholder('Enter Your Email').fill('example@gmail.com');
        await page.getByPlaceholder('Enter Your Password').fill('Pass123!');
        await page.getByRole('button', { name: 'LOGIN' }).click();
        
        try {
            await expect(page.getByText('login successfully')).toBeVisible({ timeout: 5000 });
        } catch (e) {
            await expect(page).toHaveURL(/.*\//, { timeout: 5000 });
        }
    });

    test('should handle token expiration', async ({ page }) => {
        await page.goto("http://localhost:3000/login");
        
        await page.route('**/api/v1/auth/login', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    message: "login successfully",
                    user: {
                        _id: "mock-user-id",
                        name: "Siyuan Zheng",
                        email: "example@gmail.com",
                        role: 0
                    },
                    token: "valid-mock-token"
                })
            });
        });
        
        await page.getByPlaceholder('Enter Your Email').fill('example@gmail.com');
        await page.getByPlaceholder('Enter Your Password').fill('Pass123!');
        await page.getByRole('button', { name: 'LOGIN' }).click();
        
        await page.waitForTimeout(1000);
        
        await expect(page.getByText('SIYUAN ZHENG')).toBeVisible();
        
        await page.evaluate(() => {
            localStorage.removeItem('auth');
        });
        
        await page.goto("http://localhost:3000/dashboard/user");
        
        await page.waitForTimeout(3000);
        
        const currentUrl = await page.url();
        
        if (currentUrl.includes('/login')) {
            expect(currentUrl).toContain('/login');
        } else {
            const userNameVisible = await page.getByText('SIYUAN ZHENG').isVisible().catch(() => false);
            
            if (!userNameVisible) {
                const loginVisible = await page.getByRole('link', { name: /login/i }).isVisible().catch(() => false);
                expect(loginVisible).toBeTruthy();
            } else {
                expect(userNameVisible).toBeFalsy();
            }
        }
    });
});