import { test, expect } from "@playwright/test";

test.describe("Delete Products", () => {
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

    test("should show error message when prompt input is empty", async ({
        page,
    }) => {
        await page.goto(
            "http://localhost:3000/dashboard/admin/product/the-law-of-contract-in-singapore"
        );

        page.once("dialog", async (dialog) => {
            await dialog.accept("");
        });

        await page.getByRole("button", { name: "DELETE PRODUCT" }).click();

        await expect(
            page.locator("text=Error: You must type 'delete' to confirm.")
        ).toBeVisible();
    });

    test("should show error message when incorrect input is provided in the prompt", async ({
        page,
    }) => {
        await page.goto(
            "http://localhost:3000/dashboard/admin/product/the-law-of-contract-in-singapore"
        );

        page.once("dialog", async (dialog) => {
            await dialog.accept("yes");
        });

        await page.getByRole("button", { name: "DELETE PRODUCT" }).click();

        await expect(
            page.locator("text=Error: You must type 'delete' to confirm.")
        ).toBeVisible();
    });

    test("should delete the product when 'delete' is entered in the prompt", async ({
        page,
    }) => {
        await page.goto(
            "http://localhost:3000/dashboard/admin/product/the-law-of-contract-in-singapore"
        );

        page.once("dialog", async (dialog) => {
            await dialog.accept("delete");
        });

        await page.getByRole("button", { name: "DELETE PRODUCT" }).click();

        await expect(
            page.locator("text=Product Deleted Successfully")
        ).toBeVisible();
    });
});
