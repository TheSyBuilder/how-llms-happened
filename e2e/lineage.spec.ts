import { expect, test } from "@playwright/test";

test("scaling laws trades model size for text with mouse, touch, and keyboard", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page.getByText("5 chapters live · 30 turning points")).toBeVisible();
  await expect(page.locator("#scaling-laws")).toHaveClass(/is-live/);
  await page.getByRole("link", { name: "Jump to the latest chapter" }).click();
  await expect(page).toHaveURL(/\/chapters\/scaling-laws\//);
  await expect(page.locator("astro-island")).not.toHaveAttribute("ssr", "");
  await page.locator(".chapter-hero").screenshot({ path: testInfo.outputPath("scaling-hero.png") });
  await page.locator(".scaling-diagram").screenshot({ path: testInfo.outputPath("scaling-diagram.png") });
  const toy = page.locator(".scaling-toy");
  const slider = page.getByRole("slider", { name: "Model size" });
  const model = page.getByTestId("model-units");
  const text = page.getByTestId("text-units");
  const loss = page.getByTestId("scaling-loss");
  await toy.scrollIntoViewIfNeeded();
  await expect(model).toHaveText("8.0");
  await expect(text).toHaveText("32.0");
  await toy.screenshot({ path: testInfo.outputPath("scaling-default.png") });
  await slider.focus();
  await page.keyboard.press("End");
  await expect(model).toHaveText("64.0");
  await expect(text).toHaveText("4.0");
  const largeLoss = Number(await loss.textContent());
  await expect(slider).toHaveAttribute("aria-valuetext", /64.0 model units; 4.0 text units/);
  await page.keyboard.press("Home");
  await expect(model).toHaveText("1.0");
  const smallLoss = Number(await loss.textContent());
  const box = await slider.boundingBox();
  if (testInfo.project.name === "mobile-chromium") {
    await page.touchscreen.tap(box!.x + box!.width * 0.73, box!.y + box!.height / 2);
  } else {
    await page.mouse.click(box!.x + box!.width * 0.73, box!.y + box!.height / 2);
  }
  const middleLoss = Number(await loss.textContent());
  expect(middleLoss).toBeLessThan(smallLoss);
  expect(middleLoss).toBeLessThan(largeLoss);
  await toy.screenshot({ path: testInfo.outputPath("scaling-allocation.png") });
  const oldCurve = await page.getByTestId("scaling-curve").getAttribute("d");
  const moreBudget = page.getByRole("radio", { name: "1,024", exact: true });
  if (testInfo.project.name === "mobile-chromium") await moreBudget.tap();
  else await moreBudget.click();
  await expect(moreBudget).toBeChecked();
  expect(Number(await loss.textContent())).toBeLessThan(middleLoss);
  await expect(page.getByTestId("scaling-curve")).not.toHaveAttribute("d", oldCurve!);
  await moreBudget.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("radio", { name: "256", exact: true })).toBeChecked();
  await expect(loss).toHaveText(middleLoss.toFixed(2));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".scaling-dot")).toHaveCSS("transition-duration", "0s");
  await slider.focus();
  await page.keyboard.press("End");
  await toy.screenshot({ path: testInfo.outputPath("scaling-large-model.png") });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("scaling.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const words = await page.locator(".chapter-hero, .story-section").allTextContents();
  expect(words.join(" ").trim().split(/\s+/).length).toBeLessThan(800);
  for (const id of ["deeper", "sources"]) {
    await expect(page.locator(`#${id}`)).not.toHaveAttribute("open", "");
    await page.locator(`#${id} summary`).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(`#${id}`)).toHaveAttribute("open", "");
  }
  await expect(page.getByRole("heading", { name: "A power law, in symbols" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("scaling-expanded.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("link", { name: "Next · 2020 GPT-3 and in-context learning" }).click();
  await expect(page).toHaveURL(/\/chapters\/gpt-3\//);
  expect(errors).toEqual([]);
});

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
  await page.goto("/chapters/gpt-3/");
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
  await expect(page.getByText("5 chapters live · 30 turning points")).toBeVisible();
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
  await expect(page.getByText("5 chapters live · 30 turning points")).toBeVisible();
  await page.locator("#bert a").click();
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

test("GPT-2 changes tasks through a prompt with mouse, touch, and keyboard", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page.getByText("5 chapters live · 30 turning points")).toBeVisible();
  await expect(page.locator("#gpt-2")).toHaveClass(/is-live/);
  await page.locator("#gpt-2 > a").click();
  await expect(page).toHaveURL(/\/chapters\/gpt-2\//);
  await expect(page.locator("astro-island")).not.toHaveAttribute("ssr", "");
  await page.locator(".chapter-hero").screenshot({ path: testInfo.outputPath("gpt2-hero.png") });
  await page.locator(".gpt2-diagram").screenshot({ path: testInfo.outputPath("gpt2-diagram.png") });
  const toy = page.locator(".gpt2-toy");
  const continuation = page.getByTestId("toy-continuation");
  const ending = page.getByRole("textbox", { name: "Prompt ending" });
  const summarise = page.getByRole("button", { name: "Summarise", exact: true });
  const another = page.getByRole("button", { name: "Try another continuation" });
  await toy.scrollIntoViewIfNeeded();
  await expect(ending).toHaveValue("Then");
  await expect(page.getByTestId("format-story")).toHaveText("2/2");
  if (testInfo.project.name === "mobile-chromium") await summarise.tap();
  else await summarise.click();
  await expect(ending).toHaveValue("TL;DR:");
  await expect(continuation).toHaveText("Mira took a lost cat home.");
  await expect(page.getByTestId("format-summary")).toHaveText("2/2");
  await expect(page.getByTestId("format-story")).toHaveText("0/2");
  await page.waitForTimeout(250);
  await toy.screenshot({ path: testInfo.outputPath("gpt2-summary.png") });
  await another.focus();
  await page.keyboard.press("Enter");
  await expect(continuation).toHaveText("A lost cat found a home with Mira.");
  const answer = page.getByRole("button", { name: "Answer", exact: true });
  await answer.focus();
  await page.keyboard.press("Space");
  await expect(ending).toHaveValue("Q: Who found the cat? A:");
  await expect(continuation).toHaveText("Mira.");
  const noCue = page.getByRole("button", { name: "No cue", exact: true });
  if (testInfo.project.name === "mobile-chromium") await noCue.tap();
  else await noCue.click();
  for (const format of ["story", "summary", "answer"]) await expect(page.getByTestId(`format-${format}`)).toHaveText("2/6");
  const all = new Set<string>();
  for (let i = 0; i < 6; i++) {
    all.add((await continuation.textContent())!);
    await another.click();
  }
  expect(all.size).toBe(6);
  await ending.focus();
  await page.keyboard.type("In a nutshell:");
  await expect(continuation).toHaveText("No matching cue.");
  await expect(another).toBeDisabled();
  await expect(page.getByTestId("format-summary")).toHaveText("—");
  await toy.screenshot({ path: testInfo.outputPath("gpt2-unknown-cue.png") });
  await ending.fill("  tl;dr:  ");
  await expect(continuation).toHaveText("Mira took a lost cat home.");
  await page.getByText("See the six fixed snippets", { exact: true }).click();
  await expect(toy.locator("li")).toHaveCount(6);
  await page.getByText("See the six fixed snippets", { exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(toy.locator(".completion-track > span").first()).toHaveCSS("transition-duration", "0s");
  await summarise.click();
  await expect(continuation).toHaveText("Mira took a lost cat home.");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("gpt2.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const words = await page.locator(".chapter-hero, .story-section").allTextContents();
  expect(words.join(" ").trim().split(/\s+/).length).toBeLessThan(800);
  for (const id of ["deeper", "sources"]) {
    await expect(page.locator(`#${id}`)).not.toHaveAttribute("open", "");
    await page.locator(`#${id} summary`).click();
  }
  await expect(page.getByRole("heading", { name: "One training objective, many prompts" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("gpt2-expanded.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("link", { name: "Next · 2020 Scaling laws" }).click();
  await expect(page).toHaveURL(/\/chapters\/scaling-laws\//);
  expect(errors).toEqual([]);
});
