// Cold-boot: splash uses the Ton product logo (red-square mark), not a text glyph.
import { expect } from "@playwright/test";
import { test } from "./fixtures";

test("boot splash shows the Ton logo mark, not a sparkle glyph", async ({ page }) => {
  // Hold health long enough to observe the splash.
  await page.route("**/v1/health", async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.fallback();
  });
  await page.goto("/");
  const mark = page.locator(".boot-mark");
  await expect(mark).toBeVisible();
  await expect(mark.getByTestId("ton-logo")).toBeVisible();
  await expect(mark).not.toContainText("✦");
  await expect(page.getByText(/Starting TonWorker|Restoring your session/)).toBeVisible();
});

test("model picker recovers when settings fetches die during sidecar boot", async ({ page }) => {
  // Real cold-start shape: EVERY request fails until the sidecar is up (health included),
  // then everything answers. The mount-time settings fetches all lose that race and are
  // swallowed — the post-health reload must populate the picker without a Settings visit.
  let sidecarUp = false;
  await page.route("**/v1/health", async (route) => {
    await new Promise((r) => setTimeout(r, 700));
    sidecarUp = true;
    await route.fallback();
  });
  await page.route("**/v1/settings", async (route) => {
    if (route.request().method() === "GET" && !sidecarUp) {
      await route.abort();
      return;
    }
    await route.fallback();
  });
  await page.goto("/");
  await expect(page.locator(".dd").filter({ hasText: "Claude Opus 4.8" })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByTestId("models-loading")).toHaveCount(0);
});
