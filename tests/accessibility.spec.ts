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

test("post-assessment appears after one scenario completes", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Take the pre-assessment" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /fill out post-assessment/i }),
  ).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: /mark .* as completed/i }).first()).not.toBeChecked();

  await page.evaluate(() => {
    localStorage.setItem(
      "be-the-agent:progress:v1:port-inquiry",
      JSON.stringify({
        scenarioId: "port-inquiry",
        state: { completed: true },
      }),
    );
  });
  await page.reload();

  await expect(
    page.getByRole("heading", { name: "Take the pre-assessment" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Take the post-assessment" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /fill out post-assessment/i }),
  ).toHaveAttribute("href", "https://forms.cloud.microsoft/r/unDEFJ1h1r");

  await page.getByRole("checkbox", { name: /mark .* as completed/i }).first().uncheck();
  await expect(
    page.getByRole("heading", { name: "Take the pre-assessment" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Take the post-assessment" }),
  ).toHaveCount(0);

  await page.getByRole("checkbox", { name: /mark .* as completed/i }).first().check();
  await expect(
    page.getByRole("heading", { name: "Take the pre-assessment" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Take the post-assessment" }),
  ).toBeVisible();
});

test("scenario progress restores and restart clears snapshot", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /open simulator/i }).first().click();

  await page
    .getByRole("separator", { name: "Resize tools pane" })
    .press("ArrowRight");
  await page.getByText("Plan before acting").click();
  await page
    .getByRole("textbox", { name: "One sentence plan" })
    .fill("I will inspect the relevant files before answering.");

  await page.reload();
  await page.getByText("Plan before acting").click();
  await expect(
    page.getByRole("textbox", { name: "One sentence plan" }),
  ).toHaveValue("I will inspect the relevant files before answering.");
  await expect(
    page.getByRole("separator", { name: "Resize tools pane" }),
  ).toHaveAttribute("aria-valuenow", "40");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /back/i }).click();
  await expect(page.getByText("In progress").first()).toBeVisible();

  await page
    .getByRole("button", { name: /open simulator|resume scenario/i })
    .first()
    .click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Restart scenario" }).click();
  await expect.poll(async () =>
    page.evaluate(() =>
      Object.keys(localStorage).filter((key) =>
        key.startsWith("be-the-agent:progress:v1:"),
      ).length,
    ),
  ).toBe(0);
});

test("simulator has no detectable accessibility violations", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /open simulator/i }).first().click();
  await expect(page.getByRole("button", { name: /back/i })).toBeVisible();

  await expectNoAxeViolations(page);
});
