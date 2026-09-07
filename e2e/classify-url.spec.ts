import { test, expect } from "@playwright/test";
import { classifyUrl } from "../src/lib/urls";

test.describe("URL classify", () => {
  test("accepts Google Maps hosts used in the wild", () => {
    expect(classifyUrl("https://maps.google.com/?q=Carbone+NYC")?.sourceHint).toBe("google_maps");
    expect(classifyUrl("https://www.google.com/maps/place/Carbone")?.sourceHint).toBe("google_maps");
    expect(classifyUrl("https://maps.app.goo.gl/abc")?.sourceHint).toBe("google_maps");
  });

  test("accepts booking and social URLs without scraping", () => {
    expect(classifyUrl("https://resy.com/cities/ny/carbone")?.sourceHint).toBe("resy");
    expect(classifyUrl("https://www.instagram.com/p/abc/")?.sourceHint).toBe("instagram");
    expect(classifyUrl("https://www.tiktok.com/@chef/video/1")?.sourceHint).toBe("tiktok");
  });

  test("rejects random sites so we never fetch slot grids", () => {
    expect(classifyUrl("https://example.com/not-a-place")).toBeNull();
  });
});
