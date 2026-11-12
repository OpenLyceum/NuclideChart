/**
 * Layout regression: in every screen and locale, the content placed in each layout
 * region (chart, settings strip, panels, footer) stays inside the layout bounds
 * and never overlaps another region's content. Longer French and Spanish labels must
 * shrink, not spill.
 *
 * Run with `npx playwright test tests/browser`. Set SCREENSHOT_DIR to also save a PNG of
 * each screen and locale (plus projector mode in English) for review.
 */

import { expect, type Page, test } from "@playwright/test";
import type { Bounds2 } from "scenerystack/dot";
import type { Node } from "scenerystack/scenery";

type SimWindow = {
  phet?: {
    joist?: {
      sim?: {
        selectedScreenProperty?: { value?: { hasView(): boolean; view: Node & { layoutBounds: Bounds2 } } };
      };
    };
  };
};

type Box = { minX: number; minY: number; maxX: number; maxY: number };

const SCREENS = [1, 2, 3, 4, 5, 6] as const;
const LOCALES = ["en", "fr", "es"] as const;

async function open(page: Page, screen: number, query: string): Promise<void> {
  await page.goto(`/?screens=${screen}&ea&${query}`);
  await page.waitForFunction(
    () => (window as unknown as SimWindow).phet?.joist?.sim?.selectedScreenProperty?.value?.hasView() === true,
    undefined,
    { timeout: 60_000 },
  );
  // Let fonts load and layout settle.
  // biome-ignore lint/suspicious/noPlaywrightWaitForTimeout: there is no event for "fonts loaded and laid out".
  await page.waitForTimeout(800);
}

/** The view-coordinate bounds of the content in each AlignBox region, plus the layout bounds. */
function regionContents(page: Page): Promise<{ layout: Box; boxes: Box[] }> {
  return page.evaluate(() => {
    const view = (window as unknown as SimWindow).phet?.joist?.sim?.selectedScreenProperty?.value?.view;
    if (view === undefined) {
      throw new Error("no view");
    }
    const toBox = (b: Bounds2): Box => ({ minX: b.minX, minY: b.minY, maxX: b.maxX, maxY: b.maxY });
    const boxes: Box[] = [];
    for (const child of view.children) {
      if (child.constructor.name === "AlignBox" && child.children[0] !== undefined) {
        boxes.push(toBox(child.localToParentBounds(child.children[0].bounds)));
      }
    }
    return { layout: toBox(view.layoutBounds), boxes };
  });
}

function overlaps(a: Box, b: Box): boolean {
  const tolerance = 0.5;
  return (
    a.minX < b.maxX - tolerance &&
    b.minX < a.maxX - tolerance &&
    a.minY < b.maxY - tolerance &&
    b.minY < a.maxY - tolerance
  );
}

for (const locale of LOCALES) {
  for (const screen of SCREENS) {
    test(`screen ${screen} in ${locale}: regions stay inside the layout and never overlap`, async ({ page }) => {
      await open(page, screen, `locale=${locale}`);
      const { layout, boxes } = await regionContents(page);
      expect(boxes.length).toBeGreaterThanOrEqual(3);
      for (const box of boxes) {
        expect(box.minX).toBeGreaterThanOrEqual(layout.minX - 0.5);
        expect(box.minY).toBeGreaterThanOrEqual(layout.minY - 0.5);
        expect(box.maxX).toBeLessThanOrEqual(layout.maxX + 0.5);
        expect(box.maxY).toBeLessThanOrEqual(layout.maxY + 0.5);
      }
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i];
          const b = boxes[j];
          if (a !== undefined && b !== undefined) {
            expect(overlaps(a, b), `region ${i} overlaps region ${j}`).toBe(false);
          }
        }
      }
      const dir = process.env["SCREENSHOT_DIR"];
      if (dir) {
        await page.screenshot({ path: `${dir}/screen-${screen}-${locale}.png` });
      }
    });
  }
}

test("projector mode renders every screen", async ({ page }) => {
  for (const screen of SCREENS) {
    await open(page, screen, "colorProfile=projector");
    const dir = process.env["SCREENSHOT_DIR"];
    if (dir) {
      await page.screenshot({ path: `${dir}/screen-${screen}-projector.png` });
    }
  }
});

test("home screen shows all six screen icons", async ({ page }) => {
  await page.goto("/?ea");
  await page.waitForFunction(() => (window as unknown as SimWindow).phet?.joist?.sim !== undefined, undefined, {
    timeout: 60_000,
  });
  await expect(
    page.getByRole("button", { name: /^(Chart|Binding Energy|Shells|Isobars|Half-Lives|Decay Chains) Screen$/ }),
  ).toHaveCount(6);
  const dir = process.env["SCREENSHOT_DIR"];
  if (dir) {
    await page.screenshot({ path: `${dir}/home.png` });
  }
});
