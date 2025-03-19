const { test, expect } = require('@playwright/test');

test.describe('Cart Page UI Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: {
          name: 'CS 4218 Test Account',
          address: '1 Computing Drive',
        },
        token: 'test-token',
      }));
      localStorage.setItem('cart', JSON.stringify([
        {
          _id: 'prod-1',
          name: 'Test Product',
          price: 100,
          description: 'This is a test product',
        }
      ]));
    });

    await page.goto('http://localhost:3000/cart');
  });



    test('should display user details and cart items and elements properly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Hello CS 4218 Test Account You Have 1 items' })).toBeVisible();
    await expect(page.getByText('Test Product' ,{ exact: true })).toBeVisible();
    await expect(page.getByText('This is a test product')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove' })).toBeVisible();
    await expect(page.getByRole('main')).toContainText('Total : $100');
    await expect(page.getByText('Price : 100')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update Address' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Make Payment' })).toBeVisible();
    });

  test('should remove an item from the cart and show empty message', async ({ page }) => {
    await page.getByRole('button', { name: 'Remove' }).click();
    await expect(page.locator('h1')).toContainText('Your Cart Is Empty');
    await expect(page.getByRole('main')).toContainText('Total : $0.00');
  });

  test('payment section should have all required elements', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Make Payment' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Paying with Card' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Paying with PayPal' })).toBeVisible();
    await page.getByRole('button', { name: 'Paying with Card' }).click();
    await expect(page.getByRole('main')).toContainText('Card Number');
    await expect(page.getByRole('main')).toContainText('Expiration Date (MM/YY)');
    await expect(page.getByRole('main')).toContainText('CVV (3 digits)');
  });

  test('Total cost should be correctly displayed', async ({ page }) => {
    // Add a second item to cart
    await page.addInitScript(() => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      cart.push({
        _id: 'prod-2',
        name: 'Test Product 2',
        price: 50,
        description: 'This is another test product',
      });
      localStorage.setItem('cart', JSON.stringify(cart));
    });

    // Reload the page to reflect the updated cart
    await page.reload();

    // Verify both items exist in the cart
    await expect(page.getByText('Test Product' ,{ exact: true })).toBeVisible();
    await expect(page.getByText('Test Product 2' ,{ exact: true })).toBeVisible();

    // Verify the correct total price (100 + 50)
    await expect(page.getByRole('main')).toContainText('Total : $150');
  });
    

});
