import { expect, test } from "@playwright/test";

test("timeline, chapter, toy, and old bookmarks work", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.locator(".timeline-card")).toHaveCount(30);
  await page.screenshot({
    path: testInfo.outputPath("timeline.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Start with the Transformer" }).click();
  await expect(
    page.getByRole("heading", { name: "The Transformer", exact: true }),
  ).toBeVisible();
  await expect(page.locator("astro-island")).not.toHaveAttribute("ssr", "");
  const toy = page.locator(".attention-toy");
  await toy.scrollIntoViewIfNeeded();
  const before = await page.getByTestId("mixture").textContent();
  const slider = page.getByRole("slider");
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(page.getByTestId("mixture")).not.toHaveText(before!);
  await expect(slider).toHaveAttribute(
    "aria-valuetext",
    "100% actions, 0% things",
  );
  if (testInfo.project.name === "mobile-chromium") {
    await page.getByRole("button", { name: "The, word 1", exact: true }).tap();
    await page.getByRole("checkbox", { name: "Hide future words" }).tap();
    // A physical touch on the native range updates the read too.
    const box = await slider.boundingBox();
    await page.touchscreen.tap(
      box!.x + box!.width * 0.8,
      box!.y + box!.height / 2,
    );
    expect(await slider.inputValue()).not.toBe("0");
  } else {
    await page
      .getByRole("button", { name: "The, word 1", exact: true })
      .click();
    await page.getByRole("checkbox", { name: "Hide future words" }).check();
    const box = await slider.boundingBox();
    await page.mouse.click(box!.x + box!.width * 0.8, box!.y + box!.height / 2);
    expect(await slider.inputValue()).not.toBe("0");
  }
  await expect(page.getByTestId("mixture")).toHaveText("0.000");
  await expect(page.locator(".is-masked")).toHaveCount(5);
  await page.waitForTimeout(250);
  await toy.screenshot({ path: testInfo.outputPath("toy-masked.png") });
  await page.getByRole("checkbox", { name: "Hide future words" }).focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("checkbox", { name: "Hide future words" }),
  ).not.toBeChecked();
  await page.getByRole("button", { name: "sat, word 3", exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: testInfo.outputPath("transformer.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(slider).toBeEnabled();
  await page.locator("#deeper summary").click();
  await expect(
    page.getByRole("heading", { name: "One attention head" }),
  ).toBeVisible();
  await page.goto("/chapters/gpt-2/");
  await expect(
    page.getByText("This part of the story is on its way"),
  ).toBeVisible();
  await page.goto(
    "/journeys/encoder-decoder-alignment/expert/bahdanau-2014-2015/",
  );
  await expect(page).toHaveURL(/\/chapters\/attention\//);
  expect(errors).toEqual([]);
});

test("pretraining transfers reading patterns with mouse, touch, and keyboard", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page.getByText("3 chapters live · 30 turning points")).toBeVisible();
  await page.goto("/chapters/pretraining/");
  await expect(page).toHaveURL(/\/chapters\/pretraining\//);
  await expect(page.locator("astro-island")).not.toHaveAttribute("ssr", "");
  const toy = page.locator(".pretraining-toy");
  await page.locator(".chapter-hero").screenshot({ path: testInfo.outputPath("pretraining-hero.png") });
  await page.locator(".transfer-diagram").screenshot({ path: testInfo.outputPath("pretraining-diagram.png") });
  const slider = page.getByRole("slider", { name: "Add labelled reviews" });
  const negativeReview = page.getByRole("radio", { name: "awful", exact: true });
  const pretrained = page.getByTestId("pretrained-probability");
  const scratch = page.getByTestId("scratch-probability");
  await toy.scrollIntoViewIfNeeded();
  await expect(page.getByTestId("review-seen")).toHaveText("“splendid” has no review label.");
  expect(parseInt((await pretrained.textContent())!)).toBeGreaterThan(90);
  expect(parseInt((await scratch.textContent())!)).toBeLessThan(60);
  await toy.screenshot({ path: testInfo.outputPath("pretraining-two-labels.png") });
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(pretrained).toHaveText("50%");
  await expect(scratch).toHaveText("50%");
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("2");
  await page.getByRole("radio", { name: "splendid", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(negativeReview).toBeChecked();
  expect(parseInt((await pretrained.textContent())!)).toBeLessThan(10);
  if (testInfo.project.name === "mobile-chromium") {
    await page.getByRole("radio", { name: "splendid", exact: true }).tap();
  } else {
    await page.getByRole("radio", { name: "splendid", exact: true }).click();
  }
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  if (testInfo.project.name === "mobile-chromium") {
    await page.touchscreen.tap(box!.x + box!.width - 5, box!.y + box!.height / 2);
    await page.getByText("See all eight reading sentences").tap();
  } else {
    await page.mouse.click(box!.x + box!.width - 5, box!.y + box!.height / 2);
    await page.getByText("See all eight reading sentences").click();
  }
  await expect(slider).toHaveValue("8");
  await expect(page.getByTestId("review-seen")).toHaveText("“splendid” has a review label.");
  expect(parseInt((await scratch.textContent())!)).toBeGreaterThan(90);
  await expect(page.getByText("The terrible film made us sigh.", { exact: true })).toBeVisible();
  await page.getByText("See all eight reading sentences").click();
  await slider.focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowRight");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(toy.locator(".prediction-track > span").first()).toHaveCSS("transition-duration", "0s");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("pretraining.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const bodyWords = await page.locator(".chapter-hero, .story-section").allTextContents();
  expect(bodyWords.join(" ").trim().split(/\s+/).length).toBeLessThan(800);
  for (const id of ["deeper", "sources"]) {
    await expect(page.locator(`#${id}`)).not.toHaveAttribute("open", "");
    await page.locator(`#${id} summary`).click();
  }
  await expect(page.getByRole("heading", { name: "GPT-1: reuse and update the network" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("pretraining-expanded.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("link", { name: "Next · 2018 BERT" }).click();
  await expect(page).toHaveURL(/\/chapters\/bert\//);
  expect(errors).toEqual([]);
});

test("BERT combines left and right clues with mouse, touch, and keyboard", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page.getByText("3 chapters live · 30 turning points")).toBeVisible();
  await page.getByRole("link", { name: "Jump to the latest chapter" }).click();
  await expect(page).toHaveURL(/\/chapters\/bert\//);
  await expect(page.locator("astro-island")).not.toHaveAttribute("ssr", "");
  await page.locator(".chapter-hero").screenshot({ path: testInfo.outputPath("bert-hero.png") });
  await page.locator(".bert-diagram").screenshot({ path: testInfo.outputPath("bert-diagram.png") });
  const toy = page.locator(".bert-toy");
  const left = page.getByRole("checkbox", { name: "Left context", exact: true });
  const right = page.getByRole("checkbox", { name: "Right context", exact: true });
  const leftClue = page.getByRole("combobox", { name: "Left clue", exact: true });
  const rightClue = page.getByRole("combobox", { name: "Right clue", exact: true });
  await expect(page.getByTestId("completion-plane")).toHaveText("50%");
  await expect(page.getByTestId("completion-boat")).toHaveText("50%");
  if (testInfo.project.name === "mobile-chromium") {
    await right.tap();
  } else {
    await right.click();
  }
  await expect(page.getByTestId("completion-plane")).toHaveText("100%");
  await expect(page.getByTestId("context-count")).toHaveText("1 of 8 sentences match the visible clues.");
  await page.waitForTimeout(250);
  await toy.screenshot({ path: testInfo.outputPath("bert-both-clues.png") });
  await rightClue.focus();
  await page.keyboard.press("l");
  await page.keyboard.press("Enter");
  await expect(rightClue).toHaveValue("lake");
  await expect(page.getByTestId("completion-boat")).toHaveText("100%");
  await leftClue.focus();
  await page.keyboard.press("l");
  await page.keyboard.press("Enter");
  await expect(leftClue).toHaveValue("little");
  await expect(page.getByTestId("completion-boat")).toHaveText("50%");
  await expect(page.getByTestId("completion-fish")).toHaveText("50%");
  await expect(toy.getByText("2 words still fit.")).toBeVisible();
  await page.waitForTimeout(250);
  await toy.screenshot({ path: testInfo.outputPath("bert-ambiguous.png") });
  await right.focus();
  await page.keyboard.press("Space");
  await left.focus();
  await page.keyboard.press("Space");
  await expect(left).not.toBeChecked();
  await expect(right).not.toBeChecked();
  for (const word of ["bird", "plane", "boat", "fish"]) {
    await expect(page.getByTestId(`completion-${word}`)).toHaveText("25%");
  }
  await page.getByText("See the eight toy sentences", { exact: true }).click();
  await expect(toy.locator("li")).toHaveCount(8);
  await expect(toy.locator(".matches-context")).toHaveCount(8);
  if (testInfo.project.name === "mobile-chromium") {
    await left.tap();
    await right.tap();
    await leftClue.tap();
  } else {
    await left.click();
    await right.click();
    await leftClue.click();
  }
  await page.keyboard.press("h");
  await page.keyboard.press("Enter");
  await expect(leftClue).toHaveValue("hungry");
  await expect(page.getByTestId("completion-fish")).toHaveText("100%");
  await expect(toy.locator(".matches-context")).toHaveCount(1);
  await page.getByText("See the eight toy sentences", { exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(toy.locator(".completion-track > span").first()).toHaveCSS("transition-duration", "0s");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("bert.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const words = await page.locator(".chapter-hero, .story-section").allTextContents();
  expect(words.join(" ").trim().split(/\s+/).length).toBeLessThan(800);
  for (const id of ["deeper", "sources"]) {
    await expect(page.locator(`#${id}`)).not.toHaveAttribute("open", "");
    await page.locator(`#${id} summary`).click();
  }
  await expect(page.getByRole("heading", { name: "What gets predicted?" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("bert-expanded.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("link", { name: "Next · 2019 GPT-2 and zero-shot" }).click();
  await expect(page).toHaveURL(/\/chapters\/gpt-2\//);
  expect(errors).toEqual([]);
});
