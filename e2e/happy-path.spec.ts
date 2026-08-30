import { test, expect } from "@playwright/test";
import path from "path";

test.describe("DateDrop happy path", () => {
  test("landing shows pitch, steps, and empty-inbox examples", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Drop a screenshot");
    await expect(page.getByText("Drop")).toBeVisible();
    await expect(page.getByText("Confirm")).toBeVisible();
    await expect(page.getByText("Date")).toBeVisible();
    await expect(page.getByText("Google Maps pin")).toBeVisible();
    await expect(page.getByText("IG restaurant story")).toBeVisible();
    await expect(page.getByText("Travel postcard")).toBeVisible();
    await expect(page.getByText(/we don't have live table inventory/i)).toBeVisible();
  });

  test("privacy and terms mention Maps, private screenshots, no reservations", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: "Privacy" })).toBeVisible();
    await expect(page.getByText(/Google Maps Platform/)).toBeVisible();
    await expect(page.getByText(/do not place reservations/i)).toBeVisible();
    await expect(page.getByText(/private/i)).toBeVisible();

    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: "Terms" })).toBeVisible();
    await expect(page.getByText(/api.resy.com/)).toBeVisible();
  });

  test("sign-in shows Clerk setup when keys are missing", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByText(/Auth keys are not set|Sign in/i)).toBeVisible();
  });

  test("inbox drop zone is home after login / demo", async ({ page }) => {
    await page.goto("/inbox");
    await expect(page.getByText("Drop screenshots here")).toBeVisible();
    await expect(page.getByPlaceholder(/maps.app.goo.gl/)).toBeVisible();
  });

  test("health endpoint boots without keys", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.ok).toBeTruthy();
    expect(json.app).toBe("datedrop");
  });

  test("fixtures exist for vision mocks", async () => {
    const fs = await import("fs");
    const root = path.join(process.cwd(), "fixtures");
    expect(fs.existsSync(path.join(root, "carbone-placeholder.jpg"))).toBeTruthy();
    expect(fs.existsSync(path.join(root, "maps-place-placeholder.jpg"))).toBeTruthy();
  });
});
