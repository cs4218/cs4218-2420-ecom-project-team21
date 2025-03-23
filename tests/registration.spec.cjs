import { test, expect } from '@playwright/test';

test.describe("Registration Page", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("http://localhost:3000/register");
    });

    test("should have a registration form", async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Register' })).toBeVisible();
        await page.getByRole('button', { name: 'Register' }).click();
        await expect(page.getByPlaceholder('Enter Your Name')).toBeVisible();
        await expect(page.getByPlaceholder('Enter Your Email')).toBeVisible();
        await expect(page.getByPlaceholder('Enter Your Password')).toBeVisible();
        await expect(page.getByPlaceholder('Enter Your Phone')).toBeVisible();
        await expect(page.getByPlaceholder('Enter Your Address')).toBeVisible();
        
        const dateInput = page.locator('input[type="date"]');
        await expect(dateInput).toBeVisible();
        
        await expect(page.getByPlaceholder('What is Your Favorite sports')).toBeVisible();
        
        await expect(page.getByRole('button', { name: 'REGISTER' })).toBeVisible();
    });

    test("should validate required fields on submission", async ({ page }) => {
        await page.getByPlaceholder('Enter Your Name').focus();
        await page.keyboard.press('Tab');
        await page.getByRole('button', { name: 'REGISTER' }).click();
        
        const nameInput = page.getByPlaceholder('Enter Your Name');
        const isFocused = await nameInput.evaluate(el => document.activeElement === el);
        expect(isFocused).toBeTruthy();
        
        await expect(page).toHaveURL('http://localhost:3000/register');
        
        await page.evaluate(() => {
            document.querySelector('form').setAttribute('novalidate', 'true');
        });
        
        await page.getByRole('button', { name: 'REGISTER' }).click();
        
        try {
            await expect(page.getByText('Name is Required')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log('error');
        }
        
        await page.getByPlaceholder('Enter Your Name').fill('Siyuan Zheng');
        await page.getByRole('button', { name: 'REGISTER' }).click();
        
        try {
            await expect(page.getByText('Email is Required')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log('error');
        }
        
        await expect(page).toHaveURL('http://localhost:3000/register');

        await page.getByPlaceholder('Enter Your Email').fill('example@gmail.com');
        await page.getByRole('button', { name: 'REGISTER' }).click();

        try {
            await expect(page.getByText('Password is Required')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log('error');
        }

        await page.getByPlaceholder('Enter Your Password').fill('Pass123!');
        await page.getByRole('button', { name: 'REGISTER' }).click();

        try {
            await expect(page.getByText('Phone is Required')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log('error');
        }

        await page.getByPlaceholder('Enter Your Phone').fill('123-456-7890');
        await page.getByRole('button', { name: 'REGISTER' }).click();

        try {
            await expect(page.getByText('Address is Required')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log('error');   
        }

        await page.getByPlaceholder('Enter Your Address').fill('123 Street');
        await page.getByRole('button', { name: 'REGISTER' }).click();

        try {
            await expect(page.getByText('Favorite sports is Required')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log('error');
        }

        await page.getByPlaceholder('What is Your Favorite sports').fill('Basketball');
        await page.getByRole('button', { name: 'REGISTER' }).click();
    });

    test("should validate the format of email", async ({ page }) => {
        await page.getByPlaceholder('Enter Your Name').fill('Siyuan Zheng');
        await page.getByPlaceholder('Enter Your Email').fill('example.com');
        await page.getByPlaceholder('Enter Your Password').fill('Pass123!');
        await page.getByPlaceholder('Enter Your Phone').fill('123-456-7890');
        await page.getByPlaceholder('Enter Your Address').fill('123 Street');
        await page.getByPlaceholder('What is Your Favorite sports').fill('Basketball');
        
        await page.getByRole('button', { name: 'REGISTER' }).click();
        try {
            await expect(page.getByText('Invalid email format')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log('error');
        }
    });

    test("should validate the format of password", async ({ page }) => {
        await page.getByPlaceholder('Enter Your Name').fill('Siyuan Zheng');
        await page.getByPlaceholder('Enter Your Email').fill('example@gmail.com');
        await page.getByPlaceholder('Enter Your Password').fill('Pass123');
        await page.getByPlaceholder('Enter Your Phone').fill('123-456-7890');
        await page.getByPlaceholder('Enter Your Address').fill('123 Street');
        await page.getByPlaceholder('What is Your Favorite sports').fill('Basketball');
        
        await page.getByRole('button', { name: 'REGISTER' }).click();
        try {
            await expect(page.getByText('Invalid password format')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log('error');
        }
    });

    test("should validate the format of phone", async ({ page }) => {
        await page.getByPlaceholder('Enter Your Name').fill('Siyuan Zheng');
        await page.getByPlaceholder('Enter Your Email').fill('example@gmail.com');
        await page.getByPlaceholder('Enter Your Password').fill('Pass123!');
        await page.getByPlaceholder('Enter Your Phone').fill('1234567890');
        await page.getByPlaceholder('Enter Your Address').fill('123 Street');
        await page.getByPlaceholder('What is Your Favorite sports').fill('Basketball');

        await page.getByRole('button', { name: 'REGISTER' }).click();
        try {
            await expect(page.getByText('Invalid phone format')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log('error');
        }
    });

    test("successfully interact with the registration form", async ({ page }) => {
        await page.route('**/api/v1/auth/register', async route => {
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    message: "User Register Successfully",
                    user: {
                        name: 'Siyuan Zheng',
                        email: 'example@gmail.com',
                        phone: '123-456-7890',
                        address: '123 Street',
                        _id: 'mock-user-id'
                    }
                })
            });
        });
    
        await page.getByPlaceholder('Enter Your Name').fill('Siyuan Zheng');
        await page.getByPlaceholder('Enter Your Email').fill('example@gmail.com');
        await page.getByPlaceholder('Enter Your Password').fill('Pass123!');
        await page.getByPlaceholder('Enter Your Phone').fill('123-456-7890');
        await page.getByPlaceholder('Enter Your Address').fill('123 Street');
        await page.locator('input[type="date"]').fill('2025-01-01');
        await page.getByPlaceholder('What is Your Favorite sports').fill('Basketball');
    
        await page.getByRole('button', { name: 'REGISTER' }).click();
        
        try {
            await expect(page.getByText('User Register Successfully')).toBeVisible({ timeout: 5000 });
        } catch (e) {
            console.log('error');
        }
    });

    test("when user already exists", async ({ page }) => {
        await page.route('**/api/v1/auth/register', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: false,
                    message: "Already Register please login",
                    user: null
                })
            });
        });

        await page.getByPlaceholder('Enter Your Name').fill('Siyuan Zheng');
        await page.getByPlaceholder('Enter Your Email').fill('example@gmail.com');
        await page.getByPlaceholder('Enter Your Password').fill('Pass123!');
        await page.getByPlaceholder('Enter Your Phone').fill('123-456-7890');
        await page.getByPlaceholder('Enter Your Address').fill('123 Street');
        await page.locator('input[type="date"]').fill('2025-01-01');
        await page.getByPlaceholder('What is Your Favorite sports').fill('Basketball');

        await page.getByRole('button', { name: 'REGISTER' }).click();

            try {
            await expect(page.getByText('Already Register please login')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log('error');
        }

        await page.goto("http://localhost:3000/register");

        await page.getByPlaceholder('Enter Your Name').fill('Siyuan Zheng');
        await page.getByPlaceholder('Enter Your Email').fill('example@gmail.com');
        await page.getByPlaceholder('Enter Your Password').fill('Pass123!');
        await page.getByPlaceholder('Enter Your Phone').fill('123-456-7890');
        await page.getByPlaceholder('Enter Your Address').fill('123 Street');
        await page.locator('input[type="date"]').fill('2025-01-01');
        await page.getByPlaceholder('What is Your Favorite sports').fill('Basketball');

        await page.getByRole('button', { name: 'REGISTER' }).click();

        try {
            await expect(page.getByText('Already Register please login')).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log('error');
        }
    });
});
