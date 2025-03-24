import { test, expect } from "@playwright/test";

test.describe("Delete Categories", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill("admin@test.sg");
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .click();
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("admin@test.sg");
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.getByRole("button", { name: "admin@test.sg" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
  });

  test("should successfully delete a category", async ({ page }) => {
    const categoryName = `Category to Delete ${Date.now()}`;
    
    await page.goto("http://localhost:3000/dashboard/admin/create-category");
    await page.getByRole("textbox").fill(categoryName);
    await page.getByRole("button", { name: "Submit" }).click();
    
    await expect(page.getByRole("cell", { name: categoryName })).toBeVisible();
    
    const categoryRow = page.getByRole("cell", { name: categoryName }).locator(".."); // Get the parent row
    await categoryRow.getByRole("button", { name: "Delete" }).click();
    
    await expect(page.locator("text=category is deleted")).toBeVisible();
    
    await expect(page.getByRole("cell", { name: categoryName })).not.toBeVisible();
  });

  test("should handle delete errors gracefully", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/admin/create-category");
    
    await page.route('**/api/v1/category/delete-category/**', route => {
      return route.fulfill({
        status: 500,
        body: JSON.stringify({ success: false, message: 'Server error' })
      });
    });
    
    await page.getByRole("button", { name: "Delete" }).first().click();
    
    await expect(page.locator("text=Somtihing went wrong")).toBeVisible();
  });
});