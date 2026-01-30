import { describe, it, beforeEach, expect, vitest } from "vitest";
import { ErrorStateMiddleware } from "../middleware";
import { BindingParser } from "../../../binding";
import type { DataModelImpl } from "../../../data";
import { LocalModel } from "../../../data";
import type { Logger } from "../../../logger";

describe("ErrorStateMiddleware", () => {
  let middleware: ErrorStateMiddleware;
  let baseDataModel: DataModelImpl;
  let mockLogger: Logger;
  let parser: BindingParser;
  let writeSymbol: symbol;

  beforeEach(() => {
    mockLogger = {
      trace: vitest.fn(),
      debug: vitest.fn(),
      info: vitest.fn(),
      warn: vitest.fn(),
      error: vitest.fn(),
    };

    writeSymbol = Symbol("test-write");
    middleware = new ErrorStateMiddleware({
      logger: mockLogger,
      writeSymbol,
    });
    baseDataModel = new LocalModel({ foo: "bar" });

    parser = new BindingParser({
      get: () => undefined,
      set: () => undefined,
      evaluate: () => undefined,
    });
  });

  describe("set", () => {
    it("should block writes to errorState without writeSymbol", () => {
      const binding = parser.parse("errorState");
      const updates = middleware.set(
        [[binding, { message: "test" }]],
        undefined,
        baseDataModel,
      );

      // Should not write to base model
      expect(baseDataModel.get(binding)).toBeUndefined();

      // Should log warning
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Blocked write to protected path: errorState"),
      );

      // Should return no-op update
      expect(updates.length).toBe(1);
      expect(updates[0]!.binding).toBe(binding);
      expect(updates[0]!.newValue).toBeUndefined();
      expect(updates[0]!.oldValue).toBeUndefined();
    });

    it("should block writes to nested errorState paths", () => {
      const binding = parser.parse("errorState.message");
      middleware.set([[binding, "test message"]], undefined, baseDataModel);

      expect(baseDataModel.get(binding)).toBeUndefined();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          "Blocked write to protected path: errorState.message",
        ),
      );
    });

    it("should allow writes to other paths", () => {
      const binding = parser.parse("foo");
      const updates = middleware.set(
        [[binding, "newValue"]],
        undefined,
        baseDataModel,
      );

      expect(baseDataModel.get(binding)).toBe("newValue");
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(updates.length).toBe(1);
      expect(updates[0]!.newValue).toBe("newValue");
    });

    it("should allow writes when authorized with writeSymbol", () => {
      const binding = parser.parse("errorState");

      const updates = middleware.set(
        [[binding, { message: "test" }]],
        { writeSymbol: writeSymbol },
        baseDataModel,
      );

      expect(baseDataModel.get(binding)).toEqual({ message: "test" });
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(updates.length).toBe(1);
      expect(updates[0]!.newValue).toEqual({ message: "test" });
    });

    it("should block writes with wrong writeSymbol", () => {
      const binding = parser.parse("errorState");
      const wrongSymbol = Symbol("wrong-auth");

      middleware.set(
        [[binding, { message: "test" }]],
        { writeSymbol: wrongSymbol },
        baseDataModel,
      );

      expect(baseDataModel.get(binding)).toBeUndefined();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it("should handle mixed transactions with blocked and allowed paths", () => {
      const errorBinding = parser.parse("errorState");
      const fooBinding = parser.parse("foo");

      const updates = middleware.set(
        [
          [errorBinding, { message: "blocked" }],
          [fooBinding, "allowed"],
        ],
        undefined,
        baseDataModel,
      );

      // foo should be updated
      expect(baseDataModel.get(fooBinding)).toBe("allowed");

      // errorState should not be updated
      expect(baseDataModel.get(errorBinding)).toBeUndefined();

      // Should have logged warning for errorState
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Blocked write to protected path: errorState"),
      );

      // Should have updates for both paths
      expect(updates.length).toBe(2);
    });
  });

  describe("get", () => {
    it("should always allow reads", () => {
      const binding = parser.parse("errorState");

      // Set value directly on base model
      baseDataModel.set([[binding, { message: "test" }]]);

      const value = middleware.get(binding, undefined, baseDataModel);
      expect(value).toEqual({ message: "test" });
    });
  });

  describe("delete", () => {
    it("should block deletes to errorState without writeSymbol", () => {
      const binding = parser.parse("errorState");

      // Set value first
      baseDataModel.set([[binding, { message: "test" }]]);

      middleware.delete(binding, undefined, baseDataModel);

      // Should still exist
      expect(baseDataModel.get(binding)).toEqual({ message: "test" });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Blocked delete of protected path: errorState"),
      );
    });

    it("should allow deletes when authorized with writeSymbol", () => {
      const binding = parser.parse("errorState");

      // Set value first
      baseDataModel.set([[binding, { message: "test" }]]);

      middleware.delete(binding, { writeSymbol: writeSymbol }, baseDataModel);

      expect(baseDataModel.get(binding)).toBeUndefined();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it("should block deletes with wrong writeSymbol", () => {
      const binding = parser.parse("errorState");
      const wrongSymbol = Symbol("wrong-auth");

      // Set value first
      baseDataModel.set([[binding, { message: "test" }]]);

      middleware.delete(binding, { writeSymbol: wrongSymbol }, baseDataModel);

      expect(baseDataModel.get(binding)).toEqual({ message: "test" });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Blocked delete of protected path: errorState"),
      );
    });

    it("should allow deletes to other paths", () => {
      const binding = parser.parse("foo");

      middleware.delete(binding, undefined, baseDataModel);

      expect(baseDataModel.get(binding)).toBeUndefined();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it("should allow deletes to nested errorState paths when authorized", () => {
      const binding = parser.parse("errorState.nested.path");

      // Set value first
      baseDataModel.set([[binding, "test"]]);

      middleware.delete(binding, { writeSymbol: writeSymbol }, baseDataModel);

      expect(baseDataModel.get(binding)).toBeUndefined();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
  });
});
