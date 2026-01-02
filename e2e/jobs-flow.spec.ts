import { expect, test } from "@playwright/test";

test("submit URL -> poll /jobs/{id} -> render architecture + diagram (when available)", async ({
  page,
}) => {
  test.setTimeout(5 * 60 * 1000);

  const inputUrl =
    process.env.ARCHLENS_E2E_INPUT_URL ?? "https://www.acciona-energia.com/";

  await page.goto("/");

  await page.getByTestId("url-input").fill(inputUrl);
  await page.getByTestId("submit-button").click();

  await expect(page.getByTestId("job-id")).toBeVisible();

  // Backend can take a while; wait until DONE.
  await expect(page.getByTestId("job-status")).toContainText("DONE", {
    timeout: 5 * 60 * 1000,
  });

  await expect(page.getByTestId("arch-title")).toBeVisible();
  await expect(page.getByTestId("arch-title")).not.toHaveText("");
  await expect(page.getByTestId("arch-summary")).toBeVisible();
  await expect(page.getByTestId("arch-summary")).not.toHaveText("");

  const img = page.getByTestId("diagram-image");
  if ((await img.count()) > 0) {
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute("src", /^https?:\\/\\//);
  }
});


