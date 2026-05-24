import { describe, expect, it } from "vitest";
import { embedA2UISnapshot } from "../session/a2ui-bridge";

describe("embedA2UISnapshot", () => {
  it("returns the adapted view root asset for a minimal snapshot", () => {
    const asset = embedA2UISnapshot({
      surfaceId: "surface-1",
      components: [
        { id: "root", component: "Column", children: ["t"] },
        { id: "t", component: "Text", text: "hello" },
      ],
    });
    expect(asset.type).toBe("Column");
    expect(asset.id).toBe("surface-1");
  });

  it("throws when the snapshot is invalid", () => {
    expect(() =>
      embedA2UISnapshot({ surfaceId: "x", components: [] }),
    ).toThrow();
  });

  it("inlines children into nested asset wrappers", () => {
    const asset = embedA2UISnapshot({
      surfaceId: "root-surface",
      components: [
        { id: "root", component: "Column", children: ["child"] },
        { id: "child", component: "Text", text: "inner" },
      ],
    });
    const children = (asset as { children?: Array<{ asset: { id: string } }> })
      .children;
    expect(children).toBeDefined();
    expect(children?.[0]?.asset?.id).toBe("child");
  });
});
