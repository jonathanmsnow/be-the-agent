import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function expectNoAxeViolations(page: Parameters<typeof AxeBuilder>[0]) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}

test("landing page has no detectable accessibility violations", async ({
  page,
}) => {
  await page.goto("/");

  await expectNoAxeViolations(page);
});

test("simulator has no detectable accessibility violations", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /open simulator/i }).first().click();
  await expect(page.getByRole("button", { name: /back/i })).toBeVisible();

  await expectNoAxeViolations(page);
});
