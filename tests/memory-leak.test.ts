/**
 * Memory-leak regression suite (fleet standard).
 *
 * Disposable nodes are created and disposed repeatedly by the shared harness (tests/helpers/memoryLeak.ts),
 * which checks that each is garbage collected. The views that redraw by replacing children are checked
 * separately: redrawing many times must not add listeners to the long-lived string Properties.
 */

import { ChartTransform } from "scenerystack/bamboo";
import { describe, expect, it } from "vitest";
import { BindingEnergyModel, BindingView } from "../src/binding-energy/model/BindingEnergyModel.js";
import { BindingChartNode } from "../src/binding-energy/view/BindingChartNode.js";
import { SharedModel } from "../src/common/model/SharedModel.js";
import { DataCreditNode } from "../src/common/view/DataCreditNode.js";
import { PlotFrameNode } from "../src/common/view/PlotFrameNode.js";
import { PointCloudNode } from "../src/common/view/PointCloudNode.js";
import { StringManager } from "../src/i18n/StringManager.js";
import { describeDisposalLeaks } from "./helpers/memoryLeak.js";

describeDisposalLeaks([
  {
    name: "PointCloudNode",
    create: () => new PointCloudNode(new ChartTransform({ viewWidth: 100, viewHeight: 100 })),
  },
  { name: "PlotFrameNode", create: () => new PlotFrameNode(200, 150) },
  { name: "DataCreditNode", create: () => new DataCreditNode(200) },
]);

/** Listener count of a Property (public at runtime, private in the type declarations). */
const listenerCount = (property: object): number =>
  (property as unknown as { getListenerCount(): number }).getListenerCount();

describe("redraws do not accumulate listeners", () => {
  it("switching the Binding Energy view leaves the axis-title listeners unchanged", () => {
    const common = StringManager.getInstance().getCommonStrings();
    const strings = StringManager.getInstance().getBindingEnergyStrings();
    const a11y = StringManager.getInstance().getBindingEnergyA11yStrings();
    const model = new BindingEnergyModel(new SharedModel());
    new BindingChartNode(model, 400, 300, {
      accessibleName: a11y.controls.cursorStringProperty,
      accessibleHelpText: a11y.controls.cursorHelpStringProperty,
    });
    const before = listenerCount(common.axes.massNumberStringProperty);
    const gapBefore = listenerCount(strings.noA5A8StringProperty);
    for (let i = 0; i < 10; i++) {
      for (const view of BindingView.enumeration.values) {
        model.viewProperty.value = view;
      }
    }
    model.viewProperty.value = BindingView.CURVE;
    expect(listenerCount(common.axes.massNumberStringProperty)).toBe(before);
    expect(listenerCount(strings.noA5A8StringProperty)).toBe(gapBefore);
  });
});
