import { expect, test } from "@playwright/test";

test('neural language learning transfers between contexts on mouse, touch and keyboard', async ({page}, info) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const activate = async (el: ReturnType<typeof page.getByRole>) => {
    if (info.project.name === 'mobile-chromium') await el.tap(); else await el.click();
  };
  await page.goto('/#neural-language-model');
  await expect(page.locator('#neural-language-model')).toHaveClass(/is-live/);
  await page.locator('#neural-language-model > a').click();
  await expect(page).toHaveURL('/chapters/neural-language-model/');
  await expect(page.locator('astro-island')).not.toHaveAttribute('ssr', '');
  await page.locator('.chapter-hero').screenshot({path:info.outputPath('neural-hero.png'), animations:'disabled'});
  await page.locator('.neural-diagram').screenshot({path:info.outputPath('neural-diagram.png'), animations:'disabled'});
  const toy = page.locator('.neural-toy');
  const answer = page.getByTestId('neural-conclusion');
  const chance = page.getByTestId('dog-chance');
  const cat = page.getByRole('button', {name:'Teach cat → sleeps', exact:true});
  const car = page.getByRole('button', {name:'Teach car → rolls', exact:true});
  const dog = page.getByRole('slider', {name:'Dog’s word vector'});
  await expect(answer).toHaveText('No lessons yet.');
  await expect(chance).toHaveText('50.0%');
  await activate(cat);
  await expect(answer).toHaveText('Dog leans toward sleeps.');
  await cat.focus(); await page.keyboard.press('Enter');
  await activate(car); await activate(car);
  await expect(page.locator('.neural-unseen .neural-count')).toHaveText('Count lookupNo observations0 examples');
  await expect(page.locator('.neural-step-count')).toContainText('4 / 40');
  await toy.screenshot({path:info.outputPath('neural-transfer.png'), animations:'disabled'});
  await dog.focus(); await page.keyboard.press('End');
  await expect(answer).toHaveText('Dog leans toward rolls.');
  await expect(page.locator('.neural-step-count')).toContainText('4 / 40');
  await page.keyboard.press('Home');
  await expect(answer).toHaveText('Dog leans toward sleeps.');
  await dog.scrollIntoViewIfNeeded(); const box = await dog.boundingBox();
  if (info.project.name === 'mobile-chromium') await page.touchscreen.tap(box!.x + box!.width - 4, box!.y + box!.height / 2);
  else await page.mouse.click(box!.x + box!.width - 4, box!.y + box!.height / 2);
  await expect(dog).toHaveValue('100');
  await expect(answer).toHaveText('Dog leans toward rolls.');
  await expect(chance).toBeInViewport();
  await page.getByText('Inside this toy', {exact:true}).focus(); await page.keyboard.press('Enter');
  await expect(page.locator('.neural-inside')).toHaveAttribute('open', '');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('.neural-probability > span').first()).toHaveCSS('transition-duration', '0s');
  await toy.screenshot({path:info.outputPath('neural-moved.png'), animations:'disabled'});
  await page.getByRole('button', {name:'Reset lessons', exact:true}).focus(); await page.keyboard.press('Enter');
  await expect(answer).toHaveText('No lessons yet.'); await expect(dog).toHaveValue('15');
  await expect(page.locator('.neural-step-count')).toContainText('0 / 40');
  const words = await page.locator('.chapter-hero,.story-section').allTextContents();
  expect(words.join(' ').trim().split(/\s+/).length).toBeLessThan(800);
  await page.getByRole('link', {name:'Play',exact:true}).click();
  await expect(page.locator('#problem')).not.toBeVisible(); await expect(toy).toBeVisible();
  await page.screenshot({path:info.outputPath('neural-play.png'), fullPage:true, animations:'disabled'});
  await page.getByRole('link', {name:'Story',exact:true}).click();
  await expect(page.locator('#problem')).toBeVisible();
  for (const id of ['deeper', 'sources']) {
    await expect(page.locator(`#${id}`)).not.toHaveAttribute('open', '');
    await page.locator(`#${id} summary`).focus(); await page.keyboard.press('Enter');
    await expect(page.locator(`#${id}`)).toHaveAttribute('open', '');
  }
  await page.locator('#deeper').screenshot({path:info.outputPath('neural-deeper.png'), animations:'disabled'});
  expect(await page.locator('#sources a').evaluateAll(links => links.every(a => a.getAttribute('href')?.startsWith('https://')))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('link', {name:/Next · 2010/})).toHaveAttribute('href', '/chapters/rnn-language-model/');
  expect(errors).toEqual([]);
});

test('current systems combine evidence, tools and effort with mouse, touch and keyboard', async ({page}, info) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/');
  await expect(page.getByText('26 chapters live · 30 turning points')).toBeVisible();
  await expect(page.locator('#now')).toHaveClass(/is-live/);
  await page.locator('#now > a').click();
  await expect(page).toHaveURL('/chapters/now/');
  await expect(page.locator('astro-island')).not.toHaveAttribute('ssr', '');
  await page.locator('.chapter-hero').screenshot({path:info.outputPath('now-hero.png')});
  await page.locator('.now-diagram').screenshot({path:info.outputPath('now-diagram.png')});
  const toy = page.locator('.now-toy');
  const answer = page.getByTestId('delivery-answer');
  const notes = page.getByRole('slider', {name:'Notes to send'});
  const budget = page.getByRole('slider', {name:'Routes to try'});
  const lookup = page.getByRole('checkbox', {name:'Fetch gate status'});
  const gate = page.getByRole('checkbox', {name:'Close the gate'});
  const activate = async (element: ReturnType<typeof page.getByRole>) => {
    if(info.project.name === 'mobile-chromium') await element.tap(); else await element.click();
  };
  await expect(answer).toHaveText('Address missing.');
  await budget.focus(); await page.keyboard.press('End');
  await expect(answer).toHaveText('Address missing.');
  await expect(page.locator('.note-missing')).toHaveCount(1);
  await notes.scrollIntoViewIfNeeded();
  const box = await notes.boundingBox();
  if(info.project.name === 'mobile-chromium') await page.touchscreen.tap(box!.x + box!.width - 4, box!.y + box!.height / 2);
  else await page.mouse.click(box!.x + box!.width - 4, box!.y + box!.height / 2);
  await expect(notes).toHaveValue('3');
  await expect(answer).toHaveText('Old map. Closed gate.');
  await toy.screenshot({path:info.outputPath('now-stale-map.png'), animations:'disabled'});
  await budget.focus(); await page.keyboard.press('Home');
  await expect(answer).toHaveText('Old map. Closed gate.');
  await activate(lookup);
  await expect(answer).toHaveText('No route found yet.');
  await expect(answer).toBeInViewport();
  await expect(page.getByTestId('gate-observation')).toHaveText('Tool returns: gate closed.');
  await budget.focus(); await page.keyboard.press('ArrowRight');
  await expect(answer).toHaveText('No route found yet.');
  await page.keyboard.press('ArrowRight');
  await expect(answer).toHaveText('Delivered in 6 minutes.');
  await expect(answer).toBeInViewport();
  await expect.poll(async () => {
    const budgetBounds = await budget.locator('..').boundingBox();
    const statusBounds = await page.locator('.now-result').boundingBox();
    return budgetBounds!.y - statusBounds!.y - statusBounds!.height;
  }).toBeGreaterThanOrEqual(0);
  await page.getByText('Inside this attempt', {exact:false}).click();
  await expect(page.locator('.now-attempts')).toContainText('Gate is closed');
  await expect(page.locator('.now-attempts')).toContainText('Wrong destination');
  await expect(page.locator('.now-attempts')).toContainText('Checks: 3');
  await toy.screenshot({path:info.outputPath('now-delivered.png'), animations:'disabled'});
  await activate(gate);
  await expect(answer).toHaveText('Delivered in 4 minutes.');
  await gate.focus(); await page.keyboard.press('Space');
  await expect(answer).toHaveText('Delivered in 6 minutes.');
  await lookup.focus(); await page.keyboard.press('Space');
  await expect(answer).toHaveText('Old map. Closed gate.');
  await page.getByRole('button', {name:'Reset delivery'}).focus(); await page.keyboard.press('Enter');
  await expect(notes).toHaveValue('2'); await expect(budget).toHaveValue('1');
  await expect(gate).toBeChecked(); await expect(lookup).not.toBeChecked();
  await expect(answer).toHaveText('Address missing.');
  await notes.focus(); await page.keyboard.press('End');
  await page.getByRole('link', {name:'Play',exact:true}).click();
  await expect(answer).toHaveText('Old map. Closed gate.');
  await page.screenshot({path:info.outputPath('now-play.png'), fullPage:true, animations:'disabled'});
  await page.getByRole('link', {name:'Story',exact:true}).click();
  for(const id of ['deeper','sources']) {
    await expect(page.locator(`#${id}`)).not.toHaveAttribute('open','');
    await page.locator(`#${id} summary`).focus(); await page.keyboard.press('Enter');
  }
  const sourceLinks = page.locator('#sources .source-list a');
  for(const href of await sourceLinks.evaluateAll(links => links.map(link => link.getAttribute('href')))) expect(href).toMatch(/^https:\/\//);
  const words = await page.locator('.chapter-hero, .story-section').allTextContents();
  expect(words.join(' ').trim().split(/\s+/).length).toBeLessThan(800);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('.now-chosen-road')).toHaveCSS('animation-name','none');
  await expect(page.locator('.now-notes li').first()).toHaveCSS('transition-duration','0s');
  await page.screenshot({path:info.outputPath('now-story.png'), fullPage:true, animations:'disabled'});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', {name:/Next · 2016 Racing to drop recurrence/}).click();
  await expect(page).toHaveURL('/chapters/drop-recurrence/');
  expect(errors).toEqual([]);
});

test("retrieval reads an editable library with mouse, touch, and keyboard", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page.getByText("26 chapters live · 30 turning points")).toBeVisible();
  await expect(page.locator("#retrieval")).toHaveClass(/is-live/);
  await page.locator("#retrieval > a").click();
  await expect(page).toHaveURL(/\/chapters\/retrieval\//);
  await expect(page.locator("astro-island")).not.toHaveAttribute("ssr", "");
  await page.locator(".chapter-hero").screenshot({ path: testInfo.outputPath("retrieval-hero.png") });
  await page.locator(".retrieval-diagram").screenshot({ path: testInfo.outputPath("retrieval-diagram.png") });
  const toy = page.locator(".retrieval-toy");
  const answer = page.getByTestId("retrieval-answer");
  const notice = page.getByRole("textbox", { name: "A · Museum notice" });
  const garden = page.getByRole("textbox", { name: "C · Garden note" });
  const include = page.getByRole("checkbox", { name: "Include A", exact: true });
  const slider = page.getByRole("slider", { name: "Passages to read" });
  await toy.scrollIntoViewIfNeeded();
  await expect(answer).toHaveText("Moss Museum opens at 10:00.");
  await expect(page.getByTestId("retrieved-a")).toHaveText("Read #1");
  await expect(page.getByTestId("retrieved-c")).toHaveText("Not read");
  await toy.screenshot({ path: testInfo.outputPath("retrieval-default.png") });
  if (testInfo.project.name === "mobile-chromium") await notice.tap();
  else await notice.click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("Moss Museum opens at 12:00.");
  await expect(answer).toHaveText("Moss Museum opens at 12:00.");
  await expect(answer).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath("retrieval-editing.png") });
  await page.getByRole("link", { name: "A · 12:00" }).click();
  await expect(notice).toBeFocused();
  if (testInfo.project.name === "mobile-chromium") await include.tap();
  else await include.click();
  await expect(answer).toHaveText("No opening time found.");
  await expect(page.getByTestId("retrieved-c")).toHaveText("Read #1");
  await toy.screenshot({ path: testInfo.outputPath("retrieval-missing.png") });
  await include.focus();
  await page.keyboard.press("Space");
  await expect(answer).toHaveText("Moss Museum opens at 12:00.");
  await garden.fill("Moss Museum opens at 03:00.");
  await expect(answer).toBeInViewport();
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  if (testInfo.project.name === "mobile-chromium") await page.touchscreen.tap(box!.x + box!.width - 5, box!.y + box!.height / 2);
  else await page.mouse.click(box!.x + box!.width - 5, box!.y + box!.height / 2);
  await expect(slider).toHaveValue("2");
  await expect(answer).toHaveText("Sources disagree.");
  await expect(page.getByTestId("retrieval-evidence")).toHaveText("Different times in: A · 12:00, C · 03:00");
  await toy.screenshot({ path: testInfo.outputPath("retrieval-conflict.png") });
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(answer).toHaveText("Moss Museum opens at 12:00.");
  await page.keyboard.press("End");
  await expect(answer).toHaveText("Sources disagree.");
  const cafe = page.getByRole("radio", { name: "Fern Cafe", exact: true });
  if (testInfo.project.name === "mobile-chromium") await cafe.tap();
  else await cafe.click();
  await expect(answer).toHaveText("Fern Cafe opens at 08:00.");
  await expect(page.getByTestId("retrieved-b")).toHaveText("Read #1");
  await cafe.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(answer).toHaveText("Sources disagree.");
  await page.getByRole("button", { name: "Reset library" }).focus();
  await page.keyboard.press("Enter");
  await expect(answer).toHaveText("Moss Museum opens at 10:00.");
  await expect(notice).toHaveValue("Moss Museum opens at 10:00.");
  await expect(slider).toHaveValue("1");
  await expect(include).toBeChecked();
  await notice.fill("");
  await garden.fill("");
  await expect(answer).toHaveText("No opening time found.");
  await expect(page.getByTestId("retrieval-evidence")).toHaveText("No matching passage reached the reader.");
  await page.getByRole("button", { name: "Reset library" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".retrieval-score > span").first()).toHaveCSS("transition-duration", "0s");
  const words = await page.locator(".chapter-hero, .story-section").allTextContents();
  expect(words.join(" ").trim().split(/\s+/).length).toBeLessThan(800);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("retrieval.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const id of ["deeper", "sources"]) {
    await expect(page.locator(`#${id}`)).not.toHaveAttribute("open", "");
    await page.locator(`#${id} summary`).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(`#${id}`)).toHaveAttribute("open", "");
  }
  await expect(page.getByRole("heading", { name: "One passage per answer, or per token?" })).toBeVisible();
  await page.locator("#deeper .disclosure-body").screenshot({ path: testInfo.outputPath("retrieval-technical.png") });
  await page.locator("#sources .disclosure-body").screenshot({ path: testInfo.outputPath("retrieval-sources.png") });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("retrieval-expanded.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("link", { name: /Next · 2022 Learning from human feedback/ }).click();
  await expect(page).toHaveURL(/\/chapters\/human-feedback\//);
  await expect(page.locator(".feedback-toy")).toBeVisible();
  expect(errors).toEqual([]);
});

test("scaling laws trades model size for text with mouse, touch, and keyboard", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page.getByText("26 chapters live · 30 turning points")).toBeVisible();
  await expect(page.locator("#scaling-laws")).toHaveClass(/is-live/);
  await page.locator("#scaling-laws > a").click();
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
  await page.getByRole("link", { name: "Play The Transformer" }).click();
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
  await page.getByRole("link", { name: "Math & sources", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "One attention head" }),
  ).toBeVisible();
  await page.goto("/chapters/chinchilla/");
  await expect(
    page.getByRole("heading", { name: "Buy enough reading, too." }),
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
  await expect(page.getByText("26 chapters live · 30 turning points")).toBeVisible();
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
  await expect(page.getByText("26 chapters live · 30 turning points")).toBeVisible();
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
  await expect(page.getByText("26 chapters live · 30 turning points")).toBeVisible();
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

test("GPT-3 examples specify a task with mouse, touch, and keyboard", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page.getByText("26 chapters live · 30 turning points")).toBeVisible();
  await expect(page.locator("#gpt-3")).toHaveClass(/is-live/);
  await page.locator("#gpt-3 > a").click();
  await expect(page).toHaveURL(/\/chapters\/gpt-3\//);
  await expect(page.locator("astro-island")).not.toHaveAttribute("ssr", "");
  await page.locator(".chapter-hero").screenshot({ path: testInfo.outputPath("gpt3-hero.png") });
  await page.locator(".gpt3-diagram").screenshot({ path: testInfo.outputPath("gpt3-diagram.png") });
  const toy = page.locator(".gpt3-toy");
  const slider = page.getByRole("slider", { name: "Examples in the prompt" });
  const count = page.getByTestId("fitting-count");
  const answer = page.getByTestId("pattern-answer");
  await toy.scrollIntoViewIfNeeded();
  await expect(slider).toHaveValue("1");
  await expect(count).toHaveText("4 of 4 fit");
  await expect(answer).toHaveText("Several answers fit");
  await toy.screenshot({ path: testInfo.outputPath("gpt3-ambiguous.png") });
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(page.getByText("No demonstrations yet.", { exact: true })).toBeVisible();
  await expect(slider).toHaveAttribute("aria-valuetext", "0 examples; No examples; 4 rules fit");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(count).toHaveText("1 of 4 fit");
  await expect(answer).toHaveText("gold blue");
  await expect(page.getByTestId("rule-swap")).toHaveClass("rule-fits");
  await expect(page.locator(".pattern-rules .rule-out")).toHaveCount(3);
  await toy.screenshot({ path: testInfo.outputPath("gpt3-few-shot.png") });
  const setB = page.getByRole("radio", { name: "Set B", exact: true });
  if (testInfo.project.name === "mobile-chromium") await setB.tap();
  else await setB.click();
  await expect(answer).toHaveText("blue blue");
  await expect(page.getByTestId("rule-first")).toHaveClass("rule-fits");
  await setB.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(answer).toHaveText("gold blue");
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  if (testInfo.project.name === "mobile-chromium") {
    await page.touchscreen.tap(box!.x + box!.width - 5, box!.y + box!.height / 2);
  } else {
    await page.mouse.click(box!.x + box!.width - 5, box!.y + box!.height / 2);
  }
  await expect(slider).toHaveValue("3");
  await expect(answer).toHaveText("gold blue");
  const conflict = page.getByRole("checkbox", { name: "Give example 3 a conflicting answer" });
  if (testInfo.project.name === "mobile-chromium") await conflict.tap();
  else await conflict.click();
  await expect(count).toHaveText("0 of 4 fit");
  await expect(answer).toHaveText("No rule fits");
  await toy.screenshot({ path: testInfo.outputPath("gpt3-conflict.png") });
  await conflict.focus();
  await page.keyboard.press("Space");
  await expect(answer).toHaveText("gold blue");
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(answer).toHaveText("Several answers fit");
  await conflict.focus();
  await page.keyboard.press("Space");
  await expect(slider).toHaveValue("3");
  await expect(answer).toHaveText("No rule fits");
  await conflict.uncheck();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByTestId("rule-swap")).toHaveCSS("transition-duration", "0s");
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(count).toHaveText("4 of 4 fit");
  await page.keyboard.press("End");
  await expect(answer).toHaveText("gold blue");
  const words = await page.locator(".chapter-hero, .story-section").allTextContents();
  expect(words.join(" ").trim().split(/\s+/).length).toBeLessThan(800);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("gpt3.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const id of ["deeper", "sources"]) {
    await expect(page.locator(`#${id}`)).not.toHaveAttribute("open", "");
    await page.locator(`#${id} summary`).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(`#${id}`)).toHaveAttribute("open", "");
  }
  await expect(page.getByRole("heading", { name: "Conditioning is different from training" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("gpt3-expanded.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("link", { name: "Next · 2020 Look it up" }).click();
  await expect(page).toHaveURL(/\/chapters\/retrieval\//);
  await expect(page.getByRole("heading", { name: "Look it up", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("human comparisons teach a scorer with mouse, touch, and keyboard", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page.getByText("26 chapters live · 30 turning points")).toBeVisible();
  await expect(page.locator("#human-feedback")).toHaveClass(/is-live/);
  await page.locator("#human-feedback > a").click();
  await expect(page).toHaveURL(/\/chapters\/human-feedback\//);
  await expect(page.locator("astro-island")).not.toHaveAttribute("ssr", "");
  await page.locator(".chapter-hero").screenshot({ path: testInfo.outputPath("feedback-hero.png") });
  await page.locator(".feedback-diagram").screenshot({ path: testInfo.outputPath("feedback-diagram.png") });
  const toy = page.locator(".feedback-toy");
  const lengthPair = page.getByRole("group", { name: "1 · Which length works better?" });
  const wordingPair = page.getByRole("group", { name: "2 · Which wording works better?" });
  const shortWeight = page.getByTestId("short-weight");
  const everydayWeight = page.getByTestId("everyday-weight");
  const a = page.getByTestId("feedback-probability-0");
  const b = page.getByTestId("feedback-probability-1");
  const c = page.getByTestId("feedback-probability-2");
  const slider = page.getByRole("slider", { name: "Chase the score" });
  await toy.scrollIntoViewIfNeeded();
  await expect(shortWeight).toHaveText("+0.00");
  await expect(everydayWeight).toHaveText("+0.00");
  await expect(a).toHaveText("33.3%");
  await toy.screenshot({ path: testInfo.outputPath("feedback-default.png"), style: ".feedback-learning { position: static !important; }" });
  const choose = async (locator: ReturnType<typeof page.getByRole>) => {
    if (testInfo.project.name === "mobile-chromium") await locator.tap();
    else await locator.click();
  };
  await choose(lengthPair.getByRole("radio", { name: /^Prefer A/ }));
  expect(Number(await shortWeight.textContent())).toBeGreaterThan(0);
  await expect(shortWeight).toBeInViewport();
  await expect(everydayWeight).toHaveText("+0.00");
  await choose(wordingPair.getByRole("radio", { name: /^Prefer A/ }));
  expect(Number(await everydayWeight.textContent())).toBeGreaterThan(0);
  await expect(everydayWeight).toBeInViewport();
  expect(parseFloat((await a.textContent())!)).toBeGreaterThan(33.3);
  await expect(c).toHaveText((await a.textContent())!);
  await page.screenshot({ path: testInfo.outputPath("feedback-comparing.png") });
  await page.waitForTimeout(220);
  await toy.screenshot({ path: testInfo.outputPath("feedback-learned.png"), style: ".feedback-learning { position: static !important; }" });
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(a).toHaveText("33.3%");
  await expect(b).toHaveText("33.3%");
  await page.keyboard.press("End");
  expect(parseFloat((await b.textContent())!)).toBeLessThan(0.1);
  await page.waitForTimeout(220);
  await page.locator(".feedback-sampler").screenshot({ path: testInfo.outputPath("feedback-chasing.png") });
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  if (testInfo.project.name === "mobile-chromium") await page.touchscreen.tap(box!.x + box!.width * 0.4, box!.y + box!.height / 2);
  else await page.mouse.click(box!.x + box!.width * 0.4, box!.y + box!.height / 2);
  expect(Number(await slider.inputValue())).toBeGreaterThan(0);
  expect(Number(await slider.inputValue())).toBeLessThan(5);
  await lengthPair.getByRole("radio", { name: /^Prefer A/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(lengthPair.getByRole("radio", { name: /^Prefer B/ })).toBeChecked();
  expect(Number(await shortWeight.textContent())).toBeLessThan(0);
  await wordingPair.getByRole("radio", { name: /^Prefer A/ }).focus();
  await page.keyboard.press("ArrowRight");
  expect(Number(await everydayWeight.textContent())).toBeLessThan(0);
  await slider.focus();
  await page.keyboard.press("End");
  expect(parseFloat((await b.textContent())!)).toBeGreaterThan(99);
  await expect(c).toHaveText((await a.textContent())!);
  await page.waitForTimeout(220);
  await toy.screenshot({ path: testInfo.outputPath("feedback-reversed.png"), style: ".feedback-learning { position: static !important; }" });
  await page.getByRole("button", { name: "Reset comparisons" }).focus();
  await page.keyboard.press("Enter");
  await expect(shortWeight).toHaveText("+0.00");
  await expect(everydayWeight).toHaveText("+0.00");
  await expect(slider).toHaveValue("2");
  await expect(toy.locator("input:checked")).toHaveCount(0);
  await choose(lengthPair.getByRole("radio", { name: /^Prefer A/ }));
  await choose(wordingPair.getByRole("radio", { name: /^Prefer A/ }));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".feedback-track > span").first()).toHaveCSS("transition-duration", "0s");
  const words = await page.locator(".chapter-hero, .story-section").allTextContents();
  expect(words.join(" ").trim().split(/\s+/).length).toBeLessThan(800);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("feedback.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const id of ["deeper", "sources"]) {
    await expect(page.locator(`#${id}`)).not.toHaveAttribute("open", "");
    await page.locator(`#${id} summary`).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(`#${id}`)).toHaveAttribute("open", "");
  }
  await expect(page.getByRole("heading", { name: "One comparison, one score difference" })).toBeVisible();
  await page.locator("#deeper .disclosure-body").screenshot({ path: testInfo.outputPath("feedback-technical.png") });
  await page.locator("#sources .disclosure-body").screenshot({ path: testInfo.outputPath("feedback-sources.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("link", { name: /Next · 2022 The ChatGPT moment/ }).click();
  await expect(page).toHaveURL(/\/chapters\/chatgpt\//);
  await expect(page.locator(".conversation-toy")).toBeVisible();
  expect(errors).toEqual([]);
});

for (const chapter of ["chatgpt", "gpt-4"]) {
  test(`${chapter} teaches input context with mouse touch and keyboard`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("console", m => { if(m.type() === "error") errors.push(m.text()); });
    await page.goto("/");
    await expect(page.getByText("26 chapters live · 30 turning points")).toBeVisible();
    await expect(page.locator(`#${chapter}`)).toHaveClass(/is-live/);
    await page.locator(`#${chapter} > a`).click();
    await expect(page).toHaveURL(`/chapters/${chapter}/`);
    await expect(page.locator("astro-island")).not.toHaveAttribute("ssr", "");
    await page.locator(".chapter-hero").screenshot({path:testInfo.outputPath(`${chapter}-hero.png`)});
    await page.locator(".idea-diagram").screenshot({path:testInfo.outputPath(`${chapter}-diagram.png`)});
    const toy = page.locator(chapter === "chatgpt" ? ".conversation-toy" : ".vision-toy");
    const activate = async (locator: ReturnType<typeof page.getByRole>) => {
      if(testInfo.project.name === "mobile-chromium") await locator.tap(); else await locator.click();
    };
    await toy.screenshot({style: ".chapter-answer { position: static !important; }",path:testInfo.outputPath(`${chapter}-default.png`)});
    const slider = page.getByRole("slider");
    if(chapter === "chatgpt") {
      const answer=page.getByTestId("conversation-answer");
      await expect(answer).toHaveText("We’re visiting Oslo.");
      await activate(page.getByRole("checkbox"));
      await page.getByRole("combobox").selectOption("Lima");
      await expect(answer).toHaveText("We’re visiting Lima.");
      await expect(answer).toBeInViewport();
      await slider.focus(); await page.keyboard.press("Home");
      await expect(answer).toHaveText("Which city did you mean?");
      await expect(page.locator(".turn-dropped")).toHaveCount(4);
      await toy.screenshot({style: ".chapter-answer { position: static !important; }",path:testInfo.outputPath(`${chapter}-missing.png`)});
      await page.keyboard.press("End");
      await expect(answer).toHaveText("We’re visiting Lima.");
      await page.getByRole("checkbox").focus(); await page.keyboard.press("Space");
      await expect(answer).toHaveText("We’re visiting Oslo.");
    } else {
      const answer=page.getByTestId("vision-answer");
      await expect(answer).toHaveText("I need the picture to count.");
      await expect(slider).toBeDisabled();
      await activate(page.getByRole("button", {name:/Cell 1:/}));
      await expect(answer).toHaveText("I need the picture to count.");
      await activate(page.getByRole("checkbox"));
      await expect(answer).toHaveText("3 circles.");
      await expect(answer).toBeInViewport();
      await page.getByRole("button", {name:/Cell 1:/}).focus(); await page.keyboard.press("Enter");
      await expect(answer).toHaveText("4 circles.");
      await slider.focus(); await page.keyboard.press("Home");
      await expect(answer).toHaveText("2–8 circles possible.");
      await activate(page.getByRole("button", {name:/Cell 9:/}));
      await expect(answer).toHaveText("2–8 circles possible.");
      await toy.screenshot({style: ".chapter-answer { position: static !important; }",path:testInfo.outputPath(`${chapter}-partial.png`)});
      await slider.focus(); await page.keyboard.press("End");
      await expect(answer).toHaveText("3 circles.");
    }
    await slider.scrollIntoViewIfNeeded();
    const box=await slider.boundingBox();
    if(testInfo.project.name === "mobile-chromium") await page.touchscreen.tap(box!.x+box!.width*.5,box!.y+box!.height/2);
    else await page.mouse.click(box!.x+box!.width*.5,box!.y+box!.height/2);
    await expect(slider).toHaveValue("2");
    await page.screenshot({path:testInfo.outputPath(`${chapter}-interacting.png`)});
    await toy.screenshot({style: ".chapter-answer { position: static !important; }",path:testInfo.outputPath(`${chapter}-changed.png`)});
    await page.getByRole("button",{name:/Reset/}).focus(); await page.keyboard.press("Enter");
    if(chapter === "chatgpt") await expect(page.getByTestId("conversation-answer")).toHaveText("We’re visiting Oslo.");
    else await expect(page.getByTestId("vision-answer")).toHaveText("I need the picture to count.");
    await page.emulateMedia({reducedMotion:"reduce"});
    if(chapter === "chatgpt") await expect(page.locator(".conversation-turns li").first()).toHaveCSS("transition-duration","0s");
    const words=await page.locator(".chapter-hero, .story-section").allTextContents();
    expect(words.join(" ").split(/\s+/).length).toBeLessThan(800);
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:testInfo.outputPath(`${chapter}-full.png`),fullPage:true});
    for(const id of ["deeper","sources"]) {
      await expect(page.locator(`#${id}`)).not.toHaveAttribute("open", "");
      await page.locator(`#${id} summary`).focus(); await page.keyboard.press("Enter");
      await expect(page.locator(`#${id}`)).toHaveAttribute("open", "");
      await page.locator(`#${id} .disclosure-body`).screenshot({path:testInfo.outputPath(`${chapter}-${id}.png`)});
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.locator(".next-chapter").click();
    await expect(page).toHaveURL(`/chapters/${chapter === "chatgpt" ? "gpt-4" : "chinchilla"}/`);
    expect(errors).toEqual([]);
  });
}

for (const chapter of ['chinchilla','open-models','mixture-of-experts','tools-and-agents','dpo','chain-of-thought','reasoning']) {
 test(`${chapter} experiment responds and renders`,async({page},info)=>{
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error') errors.push(m.text());});
  await page.goto(`/chapters/${chapter}/`);
  await expect(page.locator('astro-island')).not.toHaveAttribute('ssr','');
  const slider=page.getByRole('slider');
  const answer=page.getByTestId('experiment-answer');
  await slider.focus();await page.keyboard.press('Home');
  const first=await answer.textContent();
  await page.keyboard.press('End');
  if(chapter!=='tools-and-agents') expect(await answer.textContent()).not.toEqual(first);
  await slider.scrollIntoViewIfNeeded();
  const box=await slider.boundingBox();
  if(info.project.name==='mobile-chromium') await page.touchscreen.tap(box!.x+box!.width/2,box!.y+box!.height/2);
  else await page.mouse.click(box!.x+box!.width/2,box!.y+box!.height/2);
  await expect.poll(async()=>Number(await slider.inputValue())).toBeGreaterThan(Number(await slider.getAttribute('min')));
  await expect.poll(async()=>Number(await slider.inputValue())).toBeLessThan(Number(await slider.getAttribute('max')));
  const activate=async(locator:ReturnType<typeof page.getByRole>)=>{if(info.project.name==='mobile-chromium')await locator.tap();else await locator.click();};
  if(chapter==='tools-and-agents') {
   await activate(page.getByRole('button',{name:'Calculate total'}));
   await expect(page.getByText('Missing observation: look up the price first.')).toBeVisible();
   await activate(page.getByRole('button',{name:'Look up price'}));
   await activate(page.getByRole('button',{name:'Calculate total'}));
   await expect(answer).toContainText('Total: $');
   await slider.focus();await page.keyboard.press('Home');await expect(answer).toHaveText('No total yet');
  }
  if(await page.getByRole('checkbox').count()){
   await activate(page.getByRole('checkbox'));await expect(page.getByRole('checkbox')).toBeChecked();
   await page.getByRole('checkbox').focus();await page.keyboard.press('Space');await expect(page.getByRole('checkbox')).not.toBeChecked();
  }
  if(chapter==='open-models'){await page.getByRole('combobox').selectOption('4');await expect(answer).toContainText('weights fit');}
  await page.locator('.later-toy').screenshot({animations:'disabled',path:info.outputPath(`${chapter}-toy.png`)});
  await page.getByRole('button',{name:'Reset experiment'}).focus();await page.keyboard.press('Enter');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.screenshot({path:info.outputPath(`${chapter}-full.png`),fullPage:true});
  for(const id of ['deeper','sources']) {await expect(page.locator(`#${id}`)).not.toHaveAttribute('open','');await page.locator(`#${id} summary`).click();}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const words=await page.locator('.chapter-hero,.story-section').allTextContents();expect(words.join(' ').split(/\s+/).length).toBeLessThan(800);
  expect(errors).toEqual([]);
 });
}

test('first visit offers a discovery, timeline shortcuts, and an honest repository link',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('astro-island')).not.toHaveAttribute('ssr','');
 const stage=page.locator('.lineage-stage');
 const bert=stage.getByRole('button',{name:/2018 BERT/});
 if(info.project.name==='mobile-chromium') await bert.tap();else await bert.click();
 await expect(stage.locator('.stage-object')).toHaveAttribute('data-selected','bert');
 await expect(stage.locator('.stage-play')).toHaveAttribute('href','/chapters/bert/#play');
 await stage.getByRole('button',{name:/2025 Reasoning models/}).focus();await page.keyboard.press('Enter');
 await expect(stage.locator('.stage-object')).toHaveAttribute('data-selected','reasoning');
 await stage.getByRole('button',{name:/2017 The Transformer/}).click();
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(stage.locator('.object-art')).toHaveCSS('animation-name','none');
 await stage.screenshot({animations:'disabled',path:info.outputPath('home-opening.png')});
 await page.screenshot({path:info.outputPath('home-revised.png'),fullPage:true});
 await page.getByRole('button',{name:'2017 · Transformers'}).click();
 await expect(page.locator('#transformer')).toBeInViewport();
 await expect(page.locator('.repo-link')).toHaveAttribute('href','https://github.com/TheSyBuilder/how-llms-happened');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.goto('/chapters/dpo/');await expect(page.locator('astro-island')).not.toHaveAttribute('ssr','');
 await expect(page.locator('.discovery details')).not.toHaveAttribute('open','');
 await page.locator('.discovery summary').click();await expect(page.locator('.discovery details')).toHaveAttribute('open','');
 const before=await page.getByTestId('experiment-answer').textContent();
 const teach=page.getByRole('button',{name:'Teach the preferred answer'});
 if(info.project.name==='mobile-chromium')await teach.tap();else await teach.click();
 await expect(page.locator('.training-counter')).toContainText('1 gradient updates');
 expect(await page.getByTestId('experiment-answer').textContent()).not.toEqual(before);
 await teach.focus();await page.keyboard.press('Enter');await expect(page.locator('.training-counter')).toContainText('2 gradient updates');
 await page.locator('.later-toy').screenshot({animations:'disabled',path:info.outputPath('dpo-learning.png')});
 await page.getByRole('button',{name:'Reset experiment'}).click();await expect(page.locator('.training-counter')).toContainText('0 gradient updates');
 await page.getByRole('button',{name:'Copy experiment link'}).click();await expect(page.locator('.share-status')).not.toBeEmpty();
 await expect(page.locator('.share-status')).toHaveAttribute('role','status');
 expect(errors).toEqual([]);
});


test('game switcher and progressive reading keep research one step away',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/');
 const open=page.getByRole('button',{name:/^Explore/});
 if(info.project.name==='mobile-chromium')await open.tap();else await open.click();
 const dialog=page.getByRole('dialog',{name:'Pick your next idea.'});
 await expect(dialog).toBeVisible();
 const search=page.getByRole('searchbox',{name:'Search experiments and papers'});await expect(search).toBeFocused();
 await search.fill('nothing matches');await expect(page.locator('.switcher-empty')).toBeVisible();
 await search.fill('BERT');await expect(dialog.locator('li:visible')).toHaveCount(1);
 await expect(dialog.getByRole('link',{name:/Original paper:/})).toHaveAttribute('href',/^https:\/\//);
 await dialog.screenshot({path:info.outputPath('switcher.png')});
 await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(open).toBeFocused();
 await page.keyboard.press('ControlOrMeta+k');await expect(dialog).toBeVisible();await search.fill('BERT');
 await dialog.locator('.switcher-game').filter({hasText:'BERT'}).click();
 await expect(page).toHaveURL('/chapters/bert/#play');
 await expect(page.locator('.chapter-page')).toHaveAttribute('data-view','play');
 await expect(page.locator('#problem')).not.toBeVisible();
 await expect(page.locator('#idea')).not.toBeVisible();
 await expect(page.locator('.bert-toy')).toBeVisible();
 await expect(page.locator('.toy-method')).not.toHaveAttribute('open','');
 await page.getByRole('checkbox',{name:'Right context'}).check();
 await expect(page.getByTestId('completion-plane')).toHaveText('100%');
 await expect(page.locator('.nav-paper')).toHaveAttribute('target','_blank');
 await page.screenshot({path:info.outputPath('focused-game.png'),fullPage:true,animations:'disabled'});
 await page.getByRole('link',{name:'Story',exact:true}).click();await expect(page.locator('#problem')).toBeVisible();
 await page.getByRole('link',{name:'Math & sources',exact:true}).click();
 await expect(page.locator('#deeper')).toBeVisible();await expect(page.locator('#deeper')).toHaveAttribute('open','');
 await expect(page.locator('#play')).not.toBeVisible();
 await page.getByRole('link',{name:'Play',exact:true}).click();
 await expect(page.getByTestId('completion-plane')).toHaveText('100%');
 await page.goBack();await expect(page.locator('.chapter-page')).toHaveAttribute('data-view','reference');
 await page.goForward();await expect(page.locator('.chapter-page')).toHaveAttribute('data-view','play');
 await page.getByRole('link',{name:/Next experiment:/}).click();await expect(page).toHaveURL('/chapters/gpt-2/#play');
 await page.getByRole('button',{name:/Switch experiment/}).click();await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByRole('button',{name:'Close experiments'}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});

test('hidden discoveries reward curiosity without interrupting the story', async ({page}, info) => {
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/');
 const date=page.getByRole('button',{name:'Open the 1913 time capsule'});
 if(info.project.name==='mobile-chromium')await date.tap();else await date.click();
 const dialog=page.locator('.curiosity-dialog');
 await expect(dialog).toBeVisible();
 await expect(page.getByRole('heading',{name:'Before chat, there were letters.'})).toBeVisible();
 await expect(page.locator('.letter-odds')).toContainText('0 / 2');
 await expect(page.locator('.letter-odds')).toContainText('3 / 3');
 await page.getByRole('button',{name:'See the pattern',exact:true}).focus();await page.keyboard.press('Enter');
 await expect(page.locator('.letter-tape')).toHaveText('CVCVCV');
 await page.getByRole('button',{name:'queue',exact:true}).click();
 await expect(page.locator('.letter-tape')).toHaveText('CVVVV');
 await expect(page.locator('.letter-odds')).toContainText('3 / 3');
 await page.getByLabel('Your tiny text').fill('👋 123');await expect(page.locator('.letter-tape')).toContainText('Add a few English letters');
 await expect(page.locator('.letter-odds')).toContainText('No pairs yet');
 await page.getByRole('button',{name:'banana',exact:true}).click();
 await dialog.screenshot({path:info.outputPath('time-capsule.png'),animations:'disabled'});
 await page.keyboard.press('ControlOrMeta+k');await expect(page.locator('.experiment-switcher')).not.toBeVisible();
 await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(date).toBeFocused();
 const footer=page.getByRole('button',{name:'One more token?',exact:true});
 if(info.project.name==='mobile-chromium')await footer.tap();else await footer.click();
 await expect(dialog).toBeVisible();await expect(page.getByRole('heading',{name:'One more token?'})).toBeVisible();
 await page.getByRole('button',{name:'a ≈70%',exact:true}).click();
 const moon=page.locator('.secret-token').filter({hasText:'moon'});
 await expect(moon).toContainText('10%');
 await page.getByRole('button',{name:'Cool',exact:true}).click();await expect(moon).toContainText('1%');
 await page.getByRole('button',{name:'Hot',exact:true}).click();await expect(moon).toContainText('17%');
 await dialog.screenshot({path:info.outputPath('sentence-odds.png'),animations:'disabled'});
 await moon.click();
 await page.getByRole('button',{name:'Draw a token'}).focus();await page.keyboard.press('Enter');
 await expect(page.locator('.ticket-count')).toHaveText('3 / 6 tokens');
 await page.getByRole('button',{name:'in 100%',exact:true}).click();
 await page.locator('.secret-token').filter({hasText:'riddles'}).click();
 await page.locator('.secret-token').click();
 await expect(page.locator('.secret-sentence')).toContainText('a moon');
 await expect(page.locator('.secret-sentence')).toContainText('in riddles.');
 await expect(page.getByRole('button',{name:'Make another'})).toBeVisible();
 await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.token-arrives')).toHaveCSS('animation-name','none');
 await expect(page.getByRole('button',{name:'Close discovery'})).toBeInViewport();
 await expect(page.getByRole('heading',{name:'One more token?'})).toBeInViewport();
 await dialog.screenshot({path:info.outputPath('sentence-machine.png'),animations:'disabled'});
 await page.getByRole('button',{name:'Make another'}).click();await expect(page.locator('.ticket-count')).toHaveText('0 / 6 tokens');
 await page.getByRole('button',{name:'Draw a token'}).click();await expect(page.locator('.ticket-count')).toHaveText('1 / 6 tokens');
 await page.getByRole('button',{name:'Start again',exact:true}).click();await expect(page.locator('.ticket-count')).toHaveText('0 / 6 tokens');
 await page.getByRole('button',{name:'Close discovery'}).click();await expect(footer).toBeFocused();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});

test('timeline stays oriented across scrubbing, scrolling and the final chapters', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#timeline');
  const slider = page.getByRole('slider', { name: 'Chapter in timeline' });
  const previous = page.getByRole('button', { name: 'Previous turning point', exact: true });
  const next = page.getByRole('button', { name: 'Next turning point', exact: true });
  const title = page.locator('[data-timeline-title]');
  const strip = page.locator('.timeline-strip');
  const activate = async (element: ReturnType<typeof page.getByRole>) => {
    if (info.project.name === 'mobile-chromium') await element.tap(); else await element.click();
  };
  await expect(previous).toBeDisabled();
  await expect(slider).toHaveValue('1');
  await expect(title).toHaveText('Guessing the next letter');
  await activate(page.getByRole('button', { name: '2026 · Today' }));
  await expect(slider).toHaveValue('30');
  await expect(next).toBeDisabled();
  await expect(page.locator('#now')).toBeInViewport();
  // The final few cards must each be reachable, including on wide screens.
  await activate(previous);
  await expect(title).toHaveText('Reasoning models');
  await expect(slider).toHaveValue('29');
  await activate(previous);
  await expect(slider).toHaveValue('28');
  await activate(next);
  await expect(slider).toHaveValue('29');
  await slider.focus(); await page.keyboard.press('End');
  await expect(slider).toHaveAttribute('aria-valuetext', '2026: Where we are now, 30 of 30');
  await page.keyboard.press('Home');
  await expect(slider).toHaveValue('1');
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  if (info.project.name === 'mobile-chromium') await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2);
  else await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
  expect(Number(await slider.inputValue())).toBeGreaterThan(10);
  expect(Number(await slider.inputValue())).toBeLessThan(20);
  await strip.focus(); await page.keyboard.press('End');
  await expect(title).toHaveText('Where we are now');
  await page.keyboard.press('ArrowLeft');
  await expect(title).toHaveText('Reasoning models');
  await page.keyboard.press('Home');
  await expect(title).toHaveText('Guessing the next letter');
  // A native scroll gesture must also update the scrubber and its label.
  await strip.evaluate(el => el.scrollTo({ left: 765, behavior: 'instant' }));
  await expect(slider).not.toHaveValue('1');
  await activate(page.getByRole('button', { name: '2017 · Transformers' }));
  await expect(title).toHaveText('The Transformer');
  await expect(page.locator('#transformer')).toBeInViewport();
  await page.locator('.timeline-section').screenshot({ path: info.outputPath('timeline-navigator.png'), animations: 'disabled' });
  await page.locator('#transformer > a').click();
  await page.getByRole('link', { name: '← The timeline' }).click();
  await expect(page.locator('#transformer')).toBeInViewport();
  await expect(title).toHaveText('The Transformer');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('recurrence alternatives carry a clue with mouse, touch and keyboard', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const activate = async (element: ReturnType<typeof page.getByRole>) => {
    if (info.project.name === 'mobile-chromium') await element.tap(); else await element.click();
  };
  await page.goto('/#drop-recurrence');
  await expect(page.getByText('26 chapters live · 30 turning points')).toBeVisible();
  await expect(page.locator('#drop-recurrence')).toHaveClass(/is-live/);
  await page.locator('#drop-recurrence > a').click();
  await expect(page).toHaveURL('/chapters/drop-recurrence/');
  await expect(page.locator('astro-island')).not.toHaveAttribute('ssr', '');
  await page.screenshot({ path: info.outputPath('recurrence-story.png'), fullPage: true, animations: 'disabled' });
  await page.locator('.recurrence-diagram').screenshot({ path: info.outputPath('recurrence-diagram.png') });
  const toy = page.locator('.recurrence-toy');
  const answer = page.getByTestId('signal-answer');
  const hops = page.getByRole('slider', { name: 'Dependent hops' });
  const next = page.getByRole('button', { name: 'One more hop →' });
  await expect(answer).toHaveText('Word 8 is still out of reach.');
  await expect(page.locator('.signal-result')).toContainText('2 / 8');
  await activate(next);
  await expect(hops).toHaveValue('2');
  await expect(page.locator('.signal-result')).toContainText('3 / 8');
  await activate(page.getByRole('button', { name: 'Widening windows', exact: true }));
  await expect(page.locator('.signal-result')).toContainText('4 / 8');
  await next.focus(); await page.keyboard.press('Enter');
  await expect(hops).toHaveValue('3');
  await expect(answer).toHaveText('Word 8 has the clue.');
  await toy.screenshot({ path: info.outputPath('recurrence-widening.png'), animations: 'disabled' });
  await activate(page.getByRole('button', { name: 'Local windows', exact: true }));
  await expect(answer).toHaveText('Word 8 is still out of reach.');
  await expect(page.locator('.signal-result')).toContainText('4 / 8');
  await hops.focus(); await page.keyboard.press('End');
  await expect(answer).toHaveText('Word 8 has the clue.');
  await expect(next).toBeDisabled();
  await page.keyboard.press('Home');
  await expect(page.locator('.signal-result')).toContainText('1 / 8');
  await expect(page.locator('.signal-wire')).toHaveCount(0);
  await hops.scrollIntoViewIfNeeded(); const box = await hops.boundingBox();
  if (info.project.name === 'mobile-chromium') await page.touchscreen.tap(box!.x + box!.width - 4, box!.y + box!.height / 2);
  else await page.mouse.click(box!.x + box!.width - 4, box!.y + box!.height / 2);
  await expect(hops).toHaveValue('7');
  await activate(page.getByRole('button', { name: 'One by one', exact: true }));
  await expect(page.locator('.signal-network')).toContainText('Each new position waits');
  await toy.screenshot({ path: info.outputPath('recurrence-chain.png'), animations: 'disabled' });
  await page.getByRole('button', { name: 'Reset signal' }).focus(); await page.keyboard.press('Enter');
  await expect(hops).toHaveValue('1');
  await expect(page.getByRole('button', { name: 'Local windows', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const direct = page.getByRole('button', { name: 'Direct attention', exact: true });
  await direct.focus(); await page.keyboard.press('Enter');
  await expect(answer).toHaveText('Word 8 has the clue.');
  await expect(page.locator('.signal-wire')).toHaveCount(64);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.signal-wire.carries').first()).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.signal-node').first()).toHaveCSS('transition-duration', '0s');
  await toy.screenshot({ path: info.outputPath('recurrence-attention.png'), animations: 'disabled' });
  await page.getByRole('link', { name: 'Play', exact: true }).click();
  await expect(answer).toHaveText('Word 8 has the clue.');
  await page.screenshot({ path: info.outputPath('recurrence-play.png'), fullPage: true, animations: 'disabled' });
  await page.getByRole('link', { name: 'Story', exact: true }).click();
  const words = await page.locator('.chapter-hero, .story-section').allTextContents();
  expect(words.join(' ').trim().split(/\s+/).length).toBeLessThan(800);
  for (const id of ['deeper', 'sources']) {
    await expect(page.locator(`#${id}`)).not.toHaveAttribute('open', '');
    await page.locator(`#${id} summary`).focus(); await page.keyboard.press('Enter');
  }
  await page.screenshot({ path: info.outputPath('recurrence-deeper.png'), fullPage: true, animations: 'disabled' });
  const links = await page.locator('#sources .source-list a').evaluateAll(links => links.map(a => a.getAttribute('href')));
  expect(links.length).toBe(7);
  expect(links.every(href => href?.startsWith('https://'))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('link', { name: /Next · 1913/ })).toHaveAttribute('href', '/chapters/next-letter/');
  expect(errors).toEqual([]);
});

for(const slug of ['next-letter','zero-counts','speech','word-vectors','elman','lstm']) {
 test(`${slug} historical chapter teaches its mechanism on all inputs`,async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const activate=async(el:ReturnType<typeof page.getByRole>)=>{if(info.project.name==='mobile-chromium')await el.tap();else await el.click();};
  await page.goto(`/chapters/${slug}/`);await expect(page.locator('astro-island')).not.toHaveAttribute('ssr','');
  await page.locator('.chapter-hero').screenshot({path:info.outputPath(`${slug}-hero.png`),animations:'disabled'});
  await page.locator('.early-diagram').screenshot({path:info.outputPath(`${slug}-diagram.png`),animations:'disabled'});
  const toy=page.locator('.early-toy');
  await toy.screenshot({path:info.outputPath(`${slug}-initial.png`),animations:'disabled'});
  if(slug==='next-letter'){
   const print=page.getByRole('button',{name:'Print next letter'});await activate(print);await expect(page.locator('.letter-tape-output')).toHaveText('AB');
   await print.focus();await page.keyboard.press('Enter');await expect(page.locator('.letter-tape-output')).toHaveText('ABA');
   await activate(page.getByRole('checkbox',{name:'Remember the last letter'}));await expect(page.locator('.early-result')).toContainText('A: 50% · B: 50%');
   await page.getByLabel('Training strip').fill('nothing');await expect(print).toBeDisabled();
   await page.getByRole('button',{name:'Reset press'}).click();await activate(page.getByRole('button',{name:'In clusters'}));await expect(page.locator('.early-result')).toContainText('A: 75%');
  } else if(slug==='zero-counts'){
   const range=page.getByRole('slider',{name:'Reserve for unseen words'});await range.focus();await page.keyboard.press('ArrowRight');
   await expect(page.locator('.early-result')).toContainText('juice gets 2.5%');
   await activate(page.getByRole('checkbox',{name:'Favour the broader traveller'}));await expect(page.locator('.early-result')).toContainText('juice gets 1.0%');
   await activate(page.getByRole('button',{name:/water/}));await expect(page.locator('.early-result')).toContainText('water gets 4.0%');
   await page.getByRole('button',{name:'Reset shelf'}).click();await expect(page.locator('.early-result')).toContainText('juice is ruled out');
  } else if(slug==='speech'){
   const result=page.locator('.speech-caption');await expect(result).toContainText('ice cream');
   await activate(page.getByRole('button',{name:'In a ghost story'}));await expect(result).toContainText('I scream');
   const range=page.getByRole('slider',{name:'Sound evidence for “ice cream”'});await range.focus();await page.keyboard.press('End');await expect(result).toContainText('ice cream');
   await page.getByRole('button',{name:'Reset decoder'}).click();const lm=page.getByRole('checkbox',{name:'Use the language model'});await lm.focus();await page.keyboard.press('Space');await expect(result).toContainText('I scream');
   const prior=page.getByRole('slider',{name:'Language prior for “ice cream”'});await expect(prior).toBeDisabled();
   await activate(lm);await range.focus();await page.keyboard.press('End');await prior.focus();await page.keyboard.press('Home');await expect(result).toContainText('A tie');
  } else if(slug==='word-vectors'){
   await expect(page.locator('.early-result')).toContainText('shore');await activate(page.getByRole('button',{name:'Move to finance'}));await expect(page.locator('.early-result')).toContainText('coin');
   const river=page.getByRole('slider',{name:'River coordinate'});await river.focus();await page.keyboard.press('End');await expect(river).toHaveValue('95');
   await page.getByRole('button',{name:'Reset map'}).focus();await page.keyboard.press('Enter');await expect(river).toHaveValue('90');
  } else if(slug==='elman'){
   await activate(page.getByRole('button',{name:'Read one more word'}));await expect(page.locator('.early-result')).toContainText('Both readers just saw “bank”');
   const copy=page.getByRole('checkbox',{name:'Copy the previous hidden state'});await activate(copy);await expect(page.locator('.early-result')).toContainText('Their states match');
   await expect(page.locator('.reader-lane').first()).toContainText('water 50.0%');await copy.focus();await page.keyboard.press('Space');await expect(page.locator('.early-result')).toContainText('different histories');
   await page.getByRole('button',{name:'Reset reader'}).click();await expect(page.getByRole('slider',{name:'Words read'})).toHaveValue('1');
  } else {
   await activate(page.getByRole('button',{name:'Protect',exact:true}));const apply=page.getByRole('button',{name:'Apply this step'});await activate(apply);await apply.focus();await page.keyboard.press('Enter');
   await expect(page.locator('.gate-preview')).toContainText('Stored now1.00');
   await activate(page.getByRole('button',{name:'Hide',exact:true}));await expect(page.locator('.gate-visible')).toContainText('0.00');
   await expect(page.locator('.gate-preview')).toContainText('After this step1.00');await activate(page.getByRole('button',{name:'Replace',exact:true}));await expect(page.locator('.gate-preview')).toContainText('After this step-1.00');
   await page.getByRole('button',{name:'Reset memory'}).click();await expect(page.locator('.gate-preview')).toContainText('After this step0.30');
  }
  // Exercise a real pointer on every range-based toy, beyond programmatic changes.
  const slider=toy.getByRole('slider').first();
  if(await slider.count()){
   await slider.scrollIntoViewIfNeeded();const box=await slider.boundingBox();
   if(info.project.name==='mobile-chromium')await page.touchscreen.tap(box!.x+box!.width-4,box!.y+box!.height/2);else await page.mouse.click(box!.x+box!.width-4,box!.y+box!.height/2);
   await expect(slider).toHaveValue((await slider.getAttribute('max'))!);
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  const bars=toy.locator('.early-bar > span,.cup > span');if(await bars.count())await expect(bars.first()).toHaveCSS('transition-duration','0s');
  if(slug==='next-letter')await expect(toy.locator('.fresh-letter')).toHaveCSS('animation-name','none');
  await toy.screenshot({path:info.outputPath(`${slug}-changed.png`),animations:'disabled'});
  const count=await page.locator('.chapter-hero,.story-section').allTextContents();expect(count.join(' ').trim().split(/\s+/).length).toBeLessThan(800);
  await page.getByRole('link',{name:'Play',exact:true}).click();await expect(page.locator('#problem')).not.toBeVisible();await expect(toy).toBeVisible();
  await page.getByRole('link',{name:'Story',exact:true}).click();await expect(page.locator('#problem')).toBeVisible();
  for(const id of ['deeper','sources']){await expect(page.locator(`#${id}`)).not.toHaveAttribute('open','');await page.locator(`#${id} summary`).focus();await page.keyboard.press('Enter');await expect(page.locator(`#${id}`)).toHaveAttribute('open','');}
  await page.locator('#deeper').screenshot({path:info.outputPath(`${slug}-deeper.png`),animations:'disabled'});
  expect(await page.locator('#sources a').evaluateAll(links=>links.every(a=>a.getAttribute('href')?.startsWith('https://')))).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
 });
}
