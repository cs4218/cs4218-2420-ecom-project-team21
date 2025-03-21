import { test, expect } from "@playwright/test";

test.describe("Update Products", () => {
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

    test("should successfully update product when all required fields are filled", async ({
        page,
    }) => {
        await page.goto(
            "http://localhost:3000/dashboard/admin/product/nus-tshirt"
        );

        await page.getByRole("textbox", { name: "write a name" }).click();
        await page
            .getByRole("textbox", { name: "write a name" })
            .fill("NUS Tee");
        await page.getByPlaceholder("write a Price").click();
        await page.getByPlaceholder("write a Price").fill("9");
        await page.getByPlaceholder("write a quantity").click();
        await page.getByPlaceholder("write a quantity").fill("150");
        await page.getByText("yes").click();
        await page.getByRole("button", { name: "UPDATE PRODUCT" }).click();
        await expect(
            page.locator("text=Product Updated Successfully")
        ).toBeVisible();
    });

    test("should display validation messages for compulsory fields when submitting an incomplete form", async ({
        page,
    }) => {
        await page.goto(
            "http://localhost:3000/dashboard/admin/product/nus-tshirt"
        );
        await page.getByPlaceholder("write a Price").click();
        await page.getByPlaceholder("write a Price").fill("");
        await page.getByPlaceholder("write a quantity").click();
        await page.getByPlaceholder("write a quantity").fill("");
        await page.getByRole("button", { name: "UPDATE PRODUCT" }).click();
        await expect(page.locator("text=Price is compulsory")).toBeVisible();
        await expect(page.locator("text=Quantity is compulsory")).toBeVisible();
    });

    test("should display error messages for non-positive price and quantity", async ({
        page,
    }) => {
        await page.goto(
            "http://localhost:3000/dashboard/admin/product/nus-tshirt"
        );
        await page.getByPlaceholder("write a Price").click();
        await page.getByPlaceholder("write a Price").fill("0");
        await page.getByPlaceholder("write a quantity").click();
        await page.getByPlaceholder("write a quantity").fill("0");
        await page.getByRole("button", { name: "UPDATE PRODUCT" }).click();
        await expect(page.locator("text=Price must be positive")).toBeVisible();
        await expect(
            page.locator("text=Quantity must be positive")
        ).toBeVisible();
    });
});
