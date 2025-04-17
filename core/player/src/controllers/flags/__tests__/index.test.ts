import { describe, it, expect } from "vitest";
import { FlagController } from "../controller";
import { PlayerFlags } from "../types";

describe("Controller Functionality", () => {
  const mockFlags: PlayerFlags = {
    duplicateIDLogLevel: "error",
  };

  it("Basic Functionality", () => {
    const controller = new FlagController(mockFlags);

    expect(controller.getFlag("duplicateIDLogLevel")).toBe("error");

    controller.updateFlags({ duplicateIDLogLevel: "debug" });

    expect(controller.getFlag("duplicateIDLogLevel")).toBe("debug");
  });

  it("Hooks", () => {
    const controller = new FlagController(mockFlags);

    controller.hooks.overrideFlag.tap("test", (value, key) => {
      expect(value).toBe("error");
      expect(key).toBe("duplicateIDLogLevel");

      return "warning";
    });

    expect(controller.getFlag("duplicateIDLogLevel")).toBe("warning");
  });
});
