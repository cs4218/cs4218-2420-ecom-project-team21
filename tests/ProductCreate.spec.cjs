import { test, expect } from "@playwright/test";

test.describe("Create Products", () => {
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

    test("should successfully create product when all required fields are filled", async ({
        page,
    }) => {
        await page.goto("http://localhost:3000/dashboard/admin/create-product");

        await page.locator("#rc_select_0").click();
        await page.getByTitle("Electronics").locator("div").click();

        const fileInput = await page.locator('input[type="file"]');
        await fileInput.setInputFiles("tests/images/shaver.png");

        await page.getByRole("textbox", { name: "write a name" }).click();
        await page
            .getByRole("textbox", { name: "write a name" })
            .fill("shaver");
        await page
            .getByRole("textbox", { name: "write a description" })
            .click();
        await page
            .getByRole("textbox", { name: "write a description" })
            .fill("shave hair");
        await page.getByPlaceholder("write a Price").click();
        await page.getByPlaceholder("write a Price").fill("25");
        await page.getByPlaceholder("write a quantity").click();
        await page.getByPlaceholder("write a quantity").fill("5");

        await page.locator("#rc_select_1").click();
        await page.getByText("Yes").click();

        await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
    });

    test("should display validation messages for compulsory fields when submitting an incomplete form", async ({
        page,
    }) => {
        await page.goto("http://localhost:3000/dashboard/admin/create-product");

        await page.getByRole("button", { name: "CREATE PRODUCT" }).click();

        await expect(page.locator("text=Category is compulsory")).toBeVisible();
        await expect(page.locator("text=Name is compulsory")).toBeVisible();
        await expect(
            page.locator("text=Description is compulsory")
        ).toBeVisible();
        await expect(page.locator("text=Price is compulsory")).toBeVisible();
        await expect(page.locator("text=Quantity is compulsory")).toBeVisible();
    });

    test("should display error messages for non-positive price and quantity", async ({
        page,
    }) => {
        await page.goto("http://localhost:3000/dashboard/admin/create-product");

        await page.getByPlaceholder("write a Price").click();
        await page.getByPlaceholder("write a Price").fill("0");
        await page.getByPlaceholder("write a quantity").click();
        await page.getByPlaceholder("write a quantity").fill("0");

        await page.getByRole("button", { name: "CREATE PRODUCT" }).click();

        await expect(page.locator("text=Price must be positive")).toBeVisible();
        await expect(
            page.locator("text=Quantity must be positive")
        ).toBeVisible();
    });
});
