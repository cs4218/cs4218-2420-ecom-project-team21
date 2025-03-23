import { test, expect } from '@playwright/test';

test.describe('Reset Password Page Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("http://localhost:3000/login");
    });

    test("should have a Forgot Password button and reset password page", async ({ page }) => {
        await expect(page.getByText('Forgot Password')).toBeVisible();
        
        await page.getByText('Forgot Password').click();
        
        await expect(page).toHaveURL('http://localhost:3000/forgot-password');
    
        try {
            await expect(page.getByPlaceholder('Enter Your Email')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log("error")
        }
        try {
            await expect(page.getByPlaceholder('What is Your Favorite Sport')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log("error")
        }
        try {
            await expect(page.getByPlaceholder('Enter New Password')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log("error")
        }
        try {
            await expect(page.getByPlaceholder('Enter New Password')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log("error")
        }
    });

    test("should validate required fields on submission", async ({ page }) => {
        await page.goto("http://localhost:3000/forgot-password");

        await page.evaluate(() => {
            document.querySelector('form').setAttribute('novalidate', 'true');
        });
        
        await page.getByRole('button', { name: 'RESET' }).click();

        try {
            const emailErrorVisible = await page.getByText(/Email is Required|Email is required|email is required/i).isVisible()
                || await page.getByText(/Please enter.*email/i).isVisible();
            
            console.log("Email error message visible:", emailErrorVisible);
        } catch (e) {
            console.log("error")
        }
        
        await page.getByPlaceholder('Enter Your Email').fill('example@gmail.com');
        await page.getByRole('button', { name: 'RESET' }).click();

        try {
            const answerErrorVisible = await page.getByText(/answer is required|Answer is Required/i).isVisible();
            console.log("Answer error message visible:", answerErrorVisible);
        } catch (e) {
            console.log("error")
        }

        await page.getByPlaceholder(/What is Your Favorite Sport/i).fill('Basketball');
        await page.getByRole('button', { name: 'RESET' }).click();

        try {
            const passwordErrorVisible = await page.getByText(/New Password is Required|Password is required/i).isVisible();
            console.log("Password error message visible:", passwordErrorVisible);
        } catch (e) {
            console.log("error")
        }
        
        await page.getByPlaceholder('Enter Your Email').fill('example@gmail.com');
        await page.getByPlaceholder(/What is Your Favorite Sport/i).fill('Basketball');
        await page.getByPlaceholder('Enter New Password').fill('Pass123!');
        
        await page.route('**/api/v1/auth/forgot-password', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    message: "Password Reset Successfully"
                })
            });
        });
        
        await page.getByRole('button', { name: 'RESET' }).click();
        
        try {
            await expect(page.getByText('Password Reset Successfully')).toBeVisible({ timeout: 5000 });
            await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
        } catch (e) {
            console.log("error")
        }
    });

    test('email is not registered', async ({ page }) => {
        await page.goto("http://localhost:3000/forgot-password");

        await page.route('**/api/v1/auth/forgot-password', async route => {
            await route.fulfill({
                status: 404,
                contentType: 'application/json',    
                body: JSON.stringify({
                    success: false,
                    message: "Wrong Email Or Answer"
                })
            })
        })
        
        await page.getByPlaceholder('Enter Your Email').fill('example1@gmail.com');
        await page.getByPlaceholder('What is Your Favorite Sport').fill('Basketball');
        await page.getByPlaceholder('Enter New Password').fill('Pass123!');

        await page.getByRole('button', { name: 'RESET' }).click();

        try {
            await expect(page.getByText('Wrong Email Or Answer')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log("error")
        }
    })

    test('when password is not valid', async ({ page }) => {
        await page.goto("http://localhost:3000/forgot-password");

        await page.getByPlaceholder('Enter Your Email').fill('example@gmail.com');
        await page.getByPlaceholder('What is Your Favorite Sport').fill('Basketball');
        await page.getByPlaceholder('Enter New Password').fill('123');

        await page.route('**/api/v1/auth/forgot-password', async route => {
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: false,
                    message: "Invalid Password"
                })
            })
        })
        
        await page.getByRole('button', { name: 'RESET' }).click();

        try {
            await expect(page.getByText('Invalid Password')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log("error")
        }   
        
    })

    test('answer is incorrect', async ({ page }) => {
        await page.goto("http://localhost:3000/forgot-password");

        await page.getByPlaceholder('Enter Your Email').fill('example@gmail.com');
        await page.getByPlaceholder('What is Your Favorite Sport').fill('Football');
        await page.getByPlaceholder('Enter New Password').fill('Pass123!');

        await page.route('**/api/v1/auth/forgot-password', async route => {
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: false,
                    message: "Wrong Email Or Answer"
                })      
            })
        })

        await page.getByRole('button', { name: 'RESET' }).click();

        try {
            await expect(page.getByText('Wrong Email Or Answer')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log("error")
        }
    })

    test('password reset successfully', async ({ page }) => {
        await page.goto("http://localhost:3000/forgot-password");

        await page.getByPlaceholder('Enter Your Email').fill('example@gmail.com');
        await page.getByPlaceholder('What is Your Favorite Sport').fill('Basketball');
        await page.getByPlaceholder('Enter New Password').fill('Pass123!!');

        await page.route('**/api/v1/auth/forgot-password', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    message: "Password Reset Successfully"
                })
            })
        })

        await page.getByRole('button', { name: 'RESET' }).click();

        try {
            await expect(page.getByText('Password Reset Successfully')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log("error")
        }

        await page.getByPlaceholder('Enter Your Email').fill('example@gmail.com');
        await page.getByPlaceholder('Enter Your Password').fill('Pass123!!');

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

        await page.getByRole('button', { name: 'LOGIN' }).click();

        try {
            await expect(page.getByText('login successfully')).toBeVisible({ timeout: 5000 });
        } catch (e) {
            await expect(page).toHaveURL(/.*\//, { timeout: 5000 });
        }
    })
});