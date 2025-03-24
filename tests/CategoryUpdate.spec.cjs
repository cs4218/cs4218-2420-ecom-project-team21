import { test, expect } from "@playwright/test";

test.describe("Update Categories", () => {
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

  test("should successfully update an existing category", async ({ page }) => {
    const originalName = `Original Category ${Date.now()}`;
    const updatedName = `Updated Category ${Date.now()}`;
    
    await page.goto("http://localhost:3000/dashboard/admin/create-category");
    await page.getByRole("textbox").fill(originalName);
    await page.getByRole("button", { name: "Submit" }).click();
    
    await expect(page.getByRole("cell", { name: originalName })).toBeVisible();
    
    await page.getByRole("button", { name: "Edit" }).first().click();
    
    await page.getByRole("textbox").fill(updatedName);
    await page.getByRole("button", { name: "Submit" }).click();
    
    await expect(page.locator(`text=${updatedName} is updated`)).toBeVisible();
    
    await expect(page.getByRole("cell", { name: updatedName })).toBeVisible();
  });

  test("should show validation error when updated category name is empty", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/admin/create-category");
    
    await page.getByRole("button", { name: "Edit" }).first().click();
    
    await page.getByRole("textbox").fill("");
    await page.getByRole("button", { name: "Submit" }).click();
    
    await expect(page.locator("text=Somtihing went wrong")).toBeVisible();
  });
});