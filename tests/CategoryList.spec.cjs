import { test, expect } from "@playwright/test";

test.describe("View Categories", () => {
  test("should display all categories on categories page", async ({ page }) => {
    await page.goto("http://localhost:3000/categories");
    
    await expect(page.locator("h1")).toContainText("All Categories");
    
    const categoryButtons = page.getByRole("link", { name: /.*/ }).filter({ hasText: /.*/ });
    await expect(categoryButtons).toHaveCount.above(0);
  });

  test("should navigate to category products when clicking a category", async ({ page }) => {
    await page.goto("http://localhost:3000/categories");
    
    const firstCategoryText = await page.getByRole("link").first().textContent();
    
    await page.getByRole("link").first().click();
    
    await expect(page.locator("h4.text-center")).toContainText(`Category - ${firstCategoryText}`);
    
    await expect(page.locator("h6.text-center")).toContainText("result found");
  });

  test("should display product details within a category", async ({ page }) => {
    await page.goto("http://localhost:3000/categories");
    
    await page.getByRole("link").first().click();
    
    const productCount = await page.locator(".card").count();
    
    if (productCount > 0) {
      await expect(page.locator(".card-img-top").first()).toBeVisible();
      await expect(page.locator(".card-title").first()).toBeVisible();
      await expect(page.locator(".card-price").first()).toBeVisible();
      await expect(page.locator(".card-text").first()).toBeVisible();
      await expect(page.getByRole("button", { name: "More Details" }).first()).toBeVisible();
    } else {
      await expect(page.locator("text=No Similar Products found")).toBeVisible();
    }
  });

  test("should navigate to product details from category product page", async ({ page }) => {
    await page.goto("http://localhost:3000/categories");
    
    await page.getByRole("link").first().click();
    
    const productCount = await page.locator(".card").count();
    
    if (productCount > 0) {
      const productName = await page.locator(".card-title").first().textContent();
      
      await page.getByRole("button", { name: "More Details" }).first().click();
      
      await expect(page.locator(".product-details-info h6").first()).toContainText(`Name : ${productName}`);
    } else {
      test.skip();
    }
  });
});