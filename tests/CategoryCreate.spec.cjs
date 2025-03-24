import { test, expect } from "@playwright/test";

test.describe("Create Categories", () => {
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

  test("should successfully create a new category", async ({ page }) => {
    const uniqueCategoryName = `Test Category ${Date.now()}`;
    
    await page.goto("http://localhost:3000/dashboard/admin/create-category");
    await page.getByRole("textbox").fill(uniqueCategoryName);
    await page.getByRole("button", { name: "Submit" }).click();
    
    await expect(page.locator(`text=${uniqueCategoryName} is created`)).toBeVisible();
    
    await expect(page.getByRole("cell", { name: uniqueCategoryName })).toBeVisible();
  });

  test("should show validation error when category name is empty", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/admin/create-category");
    await page.getByRole("button", { name: "Submit" }).click();
    
    await expect(page.locator("text=somthing went wrong in input form")).toBeVisible();
  });

  test("should show error when trying to create duplicate category", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/admin/create-category");
    
    const categoryName = `Test Category ${Date.now()}`;
    await page.getByRole("textbox").fill(categoryName);
    await page.getByRole("button", { name: "Submit" }).click();
    
    await page.getByRole("textbox").fill(categoryName);
    await page.getByRole("button", { name: "Submit" }).click();
    
    await expect(page.locator("div.Toastify")).toContainText("Error");
  });
});