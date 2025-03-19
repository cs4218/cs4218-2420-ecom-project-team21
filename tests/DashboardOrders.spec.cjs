import { test, expect } from '@playwright/test';


test.describe('Order Page UI Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/login');
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('cs4218@test.com');
        await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('cs4218@test.com');
        await page.getByRole('button', { name: 'LOGIN' }).click();
        await page.getByRole('button', { name: 'CS 4218 Test Account' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
    });

    test("should redirect to orders page when clicking on profile button", async ({
        page,
      }) => {
        await page.locator("text=Orders").click();
        await expect(page).toHaveURL("http://localhost:3000/dashboard/user/orders");
    });

    test('test for order retreival', async ({ page }) => {
        await page.getByRole('link', { name: 'Orders' }).click();
        await expect(page.locator('thead')).toContainText('Status');
        await expect(page.locator('thead')).toContainText('Buyer');
        await expect(page.locator('thead')).toContainText('date');
        await expect(page.locator('thead')).toContainText('Payment');
        await expect(page.locator('thead')).toContainText('Quantity');
        await expect(page.locator('div').filter({ hasText: /^NUS T-shirtPlain NUS T-shirt for salePrice : 4\.99$/ }).first()).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^LaptopA powerful laptopPrice : 1499\.99$/ }).first()).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^LaptopA powerful laptopPrice : 1499\.99$/ }).nth(2)).toBeVisible();
        await expect(page.locator('tbody')).toContainText('3');
    });

});