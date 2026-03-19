import { describe, it, beforeEach, expect, vitest } from "vitest";
import { ErrorStateMiddleware } from "../middleware";
import { BindingInstance, BindingParser } from "../../../binding";
import type {
  BatchSetTransaction,
  DataModelImpl,
  DataModelOptions,
} from "../../../data";
import { LocalModel } from "../../../data";
import type { Logger } from "../../../logger";

describe("ErrorStateMiddleware", () => {
  let middleware: ErrorStateMiddleware;
  let baseDataModel: DataModelImpl;
  // Shortcut to using middleware with baseDataModel as "next"
  let pipelineModel: DataModelImpl;
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

    pipelineModel = {
      get: (binding: BindingInstance, options?: DataModelOptions) =>
        middleware.get(binding, options, baseDataModel),
      set: (transaction: BatchSetTransaction, options?: DataModelOptions) =>
        middleware.set(transaction, options, baseDataModel),
      delete: (binding: BindingInstance, options?: DataModelOptions) =>
        middleware.delete(binding, options, baseDataModel),
    };
  });

  describe("set", () => {
    it("should not write to the base data model", () => {
      const binding = parser.parse("errorState");
      pipelineModel.set([[binding, { message: "test" }]], {
        writeSymbol,
      });

      expect(pipelineModel.get(binding)).toStrictEqual({ message: "test" });
      expect(baseDataModel.get(binding)).toBeUndefined();
    });
    it("should block writes to errorState without writeSymbol", () => {
      const binding = parser.parse("errorState");
      const updates = pipelineModel.set([[binding, { message: "test" }]]);

      // Should not write to base model
      expect(pipelineModel.get(binding)).toBeUndefined();

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
      pipelineModel.set([[binding, "test message"]]);

      expect(pipelineModel.get(binding)).toBeUndefined();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          "Blocked write to protected path: errorState.message",
        ),
      );
    });

    it("should allow writes to other paths", () => {
      const binding = parser.parse("foo");
      const updates = pipelineModel.set([[binding, "newValue"]]);

      expect(pipelineModel.get(binding)).toBe("newValue");
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(updates.length).toBe(1);
      expect(updates[0]!.newValue).toBe("newValue");
    });

    it("should allow writes when authorized with writeSymbol", () => {
      const binding = parser.parse("errorState");

      const updates = pipelineModel.set([[binding, { message: "test" }]], {
        writeSymbol: writeSymbol,
      });

      expect(pipelineModel.get(binding)).toEqual({ message: "test" });
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(updates.length).toBe(1);
      expect(updates[0]!.newValue).toEqual({ message: "test" });
    });

    it("should block writes with wrong writeSymbol", () => {
      const binding = parser.parse("errorState");
      const wrongSymbol = Symbol("wrong-auth");

      pipelineModel.set([[binding, { message: "test" }]], {
        writeSymbol: wrongSymbol,
      });

      expect(pipelineModel.get(binding)).toBeUndefined();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it("should handle mixed transactions with blocked and allowed paths", () => {
      const errorBinding = parser.parse("errorState");
      const fooBinding = parser.parse("foo");

      const updates = pipelineModel.set([
        [errorBinding, { message: "blocked" }],
        [fooBinding, "allowed"],
      ]);

      // foo should be updated
      expect(pipelineModel.get(fooBinding)).toBe("allowed");

      // errorState should not be updated
      expect(pipelineModel.get(errorBinding)).toBeUndefined();

      // Should have logged warning for errorState
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Blocked write to protected path: errorState"),
      );

      // Should have updates for both paths
      expect(updates.length).toBe(2);
    });
  });

  describe("get", () => {
    it("should not read error state from the base model", () => {
      const binding = parser.parse("errorState");

      // Set value directly on base model
      baseDataModel.set([[binding, { message: "test" }]]);

      expect(pipelineModel.get(binding)).toBeUndefined();
    });

    it("should read without needing any permissions", () => {
      const binding = parser.parse("errorState");
      pipelineModel.set([[binding, { message: "test" }]], { writeSymbol });

      const value = pipelineModel.get(binding);
      expect(value).toStrictEqual({ message: "test" });
    });
  });

  describe("delete", () => {
    it("should block deletes to errorState without writeSymbol", () => {
      const binding = parser.parse("errorState");

      // Set value first
      pipelineModel.set([[binding, { message: "test" }]], { writeSymbol });

      pipelineModel.delete(binding);

      // Should still exist
      expect(pipelineModel.get(binding)).toEqual({ message: "test" });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Blocked delete of protected path: errorState"),
      );
    });

    it("should allow deletes when authorized with writeSymbol", () => {
      const binding = parser.parse("errorState");

      // Set value first
      pipelineModel.set([[binding, { message: "test" }]], { writeSymbol });

      pipelineModel.delete(binding, { writeSymbol: writeSymbol });

      expect(pipelineModel.get(binding)).toBeUndefined();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it("should block deletes with wrong writeSymbol", () => {
      const binding = parser.parse("errorState");
      const wrongSymbol = Symbol("wrong-auth");

      // Set value first
      pipelineModel.set([[binding, { message: "test" }]], { writeSymbol });

      pipelineModel.delete(binding, { writeSymbol: wrongSymbol });

      expect(pipelineModel.get(binding)).toEqual({ message: "test" });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Blocked delete of protected path: errorState"),
      );
    });

    it("should allow deletes to other paths", () => {
      const binding = parser.parse("foo");

      pipelineModel.delete(binding);

      expect(baseDataModel.get(binding)).toBeUndefined();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it("should allow deletes to nested errorState paths when authorized", () => {
      const binding = parser.parse("errorState.nested.path");

      // Set value first
      pipelineModel.set([[binding, "test"]], { writeSymbol });

      pipelineModel.delete(binding, { writeSymbol: writeSymbol });

      expect(pipelineModel.get(binding)).toBeUndefined();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
  });
});
