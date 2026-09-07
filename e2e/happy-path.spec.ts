import { test, expect } from "@playwright/test";
import path from "path";

test.describe("Aura Concierge Elite", () => {
  test("landing shows pitch, steps, and empty-inbox examples", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Drop a screenshot");
    await expect(page.getByRole("heading", { name: "Drop", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Confirm", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Date", exact: true })).toBeVisible();
    await expect(page.getByText("Google Maps pin")).toBeVisible();
    await expect(page.getByText("IG restaurant story")).toBeVisible();
    await expect(page.getByText("Travel postcard")).toBeVisible();
    await expect(page.getByText(/we don't have live table inventory/i)).toBeVisible();
  });

  test("privacy and terms mention OSM/Geoapify, private screenshots, no reservations", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: "Privacy" })).toBeVisible();
    await expect(page.getByText(/OpenStreetMap|Geoapify|Nominatim|places/i)).toBeVisible();
    await expect(page.getByText(/do not place reservations/i)).toBeVisible();
    await expect(page.getByText(/private/i)).toBeVisible();

    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: "Terms" })).toBeVisible();
    await expect(page.getByText(/api.resy.com/)).toBeVisible();
  });

  test("sign-in shows Google auth setup when keys are missing", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByText(/Auth keys are not set|Sign in|Continue with Google/i)).toBeVisible();
  });

  test("capture drop zone is the inbox after redirect", async ({ page }) => {
    await page.goto("/inbox");
    await expect(page).toHaveURL(/\/capture/);
    await expect(page.getByText("Drop screenshots here")).toBeVisible();
    await expect(page.getByPlaceholder(/maps.app.goo.gl/)).toBeVisible();
    await expect(page.getByText("Use camera")).toBeVisible();
  });

  test("health endpoint boots without keys", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.ok).toBeTruthy();
    expect(["aura-concierge-elite", "datedrop"]).toContain(json.app);
    expect(json.aka).toBe("datedrop");
  });

  test("fixtures exist for vision mocks", async () => {
    const fs = await import("fs");
    const root = path.join(process.cwd(), "fixtures");
    expect(fs.existsSync(path.join(root, "carbone-placeholder.jpg"))).toBeTruthy();
    expect(fs.existsSync(path.join(root, "maps-place-placeholder.jpg"))).toBeTruthy();
  });

  test("demo continue reaches Explore with Drop Confirm Date", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /continue as demo/i }).click();
    await expect(page.getByRole("heading", { name: "Explore" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Google Maps pin")).toBeVisible();
    await expect(page.getByText("IG restaurant story")).toBeVisible();
    await expect(page.getByText("Travel postcard")).toBeVisible();
  });

  test("vault empty state and occasion filters", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /continue as demo/i }).click();
    await expect(page.getByRole("heading", { name: "Explore" })).toBeVisible({ timeout: 15000 });
    await page.goto("/vault");
    await expect(page.getByRole("heading", { name: /saved rooms/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /date night/i })).toBeVisible();
    await expect(page.getByText(/vault is empty|capture a place/i)).toBeVisible();
  });

  test("plans form and premium honesty", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /continue as demo/i }).click();
    await expect(page.getByRole("heading", { name: "Explore" })).toBeVisible({ timeout: 15000 });
    await page.goto("/plans");
    await expect(page.getByRole("heading", { name: /dates & party/i })).toBeVisible();
    await expect(page.getByPlaceholder(/new york/i)).toBeVisible();
    await page.goto("/premium");
    await expect(page.getByText(/complimentary/i)).toBeVisible();
    await expect(page.getByText(/no live inventory/i)).toBeVisible();
  });

  test("concierge chat shell", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /continue as demo/i }).click();
    await expect(page.getByRole("heading", { name: "Explore" })).toBeVisible({ timeout: 15000 });
    await page.goto("/concierge");
    await expect(page.getByRole("heading", { name: /ask aura/i })).toBeVisible();
    await expect(page.getByPlaceholder(/lilia/i)).toBeVisible();
  });

  test("mobile nav captures center action", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/capture");
    await expect(page.getByRole("navigation", { name: "Mobile" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Capture" })).toBeVisible();
  });
});
