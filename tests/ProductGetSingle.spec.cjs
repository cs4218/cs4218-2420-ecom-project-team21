import { test, expect } from "@playwright/test";

test.describe("Get Single Product", () => {
    test("should display single product details correctly", async ({
        page,
    }) => {
        await page.goto("http://localhost:3000/product/nus-tshirt");

        await expect(
            page.getByRole("heading", { name: "Name : NUS T-shirt" })
        ).toBeVisible();
        await expect(
            page.getByRole("heading", { name: /Description : Plain NUS T-/ })
        ).toBeVisible();
        await expect(
            page.getByRole("heading", { name: /Price :\$\d+/ })
        ).toBeVisible();
        await expect(
            page.getByRole("heading", { name: "Category : Clothing" })
        ).toBeVisible();
        await expect(
            page.getByRole("img", { name: "NUS T-shirt" })
        ).toBeVisible();
        await expect(
            page.getByRole("button", { name: "ADD TO CART" })
        ).toBeVisible();
    });

    test("should show 'Product Not Found' for unknown products", async ({
        page,
    }) => {
        await page.goto("http://localhost:3000/product/abc");

        await expect(
            page.getByRole("heading", { name: "Product Not Found" })
        ).toBeVisible();

        await page.getByRole("button", { name: "Go Back to Home" }).click();

        await expect(page).toHaveURL("http://localhost:3000/");
    });
});
