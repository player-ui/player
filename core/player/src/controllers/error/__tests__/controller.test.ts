import { describe, it, beforeEach, expect, vitest } from "vitest";
import { ErrorController } from "../controller";
import { ErrorSeverity, ErrorTypes } from "../types";
import type { DataController } from "../../data/controller";
import type { FlowController } from "../../flow/controller";
import type { Logger } from "../../../logger";

describe("ErrorController", () => {
  let errorController: ErrorController;
  let mockDataController: DataController;
  let mockFlowController: FlowController;
  let mockLogger: Logger;
  let mockFail: ReturnType<typeof vitest.fn>;

  beforeEach(() => {
    mockDataController = {
      set: vitest.fn(),
      get: vitest.fn(),
      delete: vitest.fn(),
    } as any;

    mockFlowController = {
      current: undefined,
    } as any;

    mockLogger = {
      trace: vitest.fn(),
      debug: vitest.fn(),
      info: vitest.fn(),
      warn: vitest.fn(),
      error: vitest.fn(),
    };

    mockFail = vitest.fn();

    errorController = new ErrorController({
      logger: mockLogger,
      flow: mockFlowController,
      fail: mockFail,
      model: mockDataController,
    });
  });

  describe("captureError", () => {
    it("should capture error with metadata", () => {
      const error = new Error("Test error");

      const playerError = errorController.captureError(
        error,
        ErrorTypes.EXPRESSION,
        ErrorSeverity.ERROR,
        { state: "VIEW_Test" },
      );

      expect(playerError.error).toBe(error);
      expect(playerError.errorType).toBe(ErrorTypes.EXPRESSION);
      expect(playerError.severity).toBe(ErrorSeverity.ERROR);
      expect(playerError.metadata?.state).toBe("VIEW_Test");
    });

    it("should add error to history", () => {
      const error1 = new Error("Error 1");
      const error2 = new Error("Error 2");

      errorController.captureError(error1, "test-error-1");
      errorController.captureError(error2, "test-error-2");

      const history = errorController.getErrors();
      expect(history).toHaveLength(2);
      expect(history[0]?.error).toBe(error1);
      expect(history[1]?.error).toBe(error2);
    });

    it("should set as current error", () => {
      const error = new Error("Test error");
      errorController.captureError(error, "test-error");

      const currentError = errorController.getCurrentError();
      expect(currentError?.error).toBe(error);
    });

    it("should write to data model", () => {
      const error = new Error("Test error");
      errorController.captureError(error, ErrorTypes.EXPRESSION);

      expect(mockDataController.set).toHaveBeenCalledWith(
        [
          [
            "errorState",
            expect.objectContaining({
              message: "Test error",
              name: "Error",
              errorType: ErrorTypes.EXPRESSION,
            }),
          ],
        ],
        expect.objectContaining({
          writeSymbol: expect.any(Symbol),
        }),
      );
    });
  });

  describe("getCurrentError", () => {
    it("should return undefined when no errors", () => {
      expect(errorController.getCurrentError()).toBeUndefined();
    });

    it("should return current error", () => {
      const error = new Error("Test error");
      errorController.captureError(error, "test-error");

      expect(errorController.getCurrentError()?.error).toBe(error);
    });
  });

  describe("getErrors", () => {
    it("should return empty array when no errors", () => {
      expect(errorController.getErrors()).toEqual([]);
    });

    it("should return error history", () => {
      const error1 = new Error("Error 1");
      const error2 = new Error("Error 2");

      errorController.captureError(error1, "error-1");
      errorController.captureError(error2, "error-2");

      const errors = errorController.getErrors();
      expect(errors).toHaveLength(2);
      expect(errors[0]?.error).toBe(error1);
      expect(errors[1]?.error).toBe(error2);
    });
  });

  describe("clearErrors", () => {
    it("should clear all errors and history", () => {
      errorController.captureError(new Error("Error 1"), "error-1");
      errorController.captureError(new Error("Error 2"), "error-2");

      errorController.clearErrors();

      expect(errorController.getCurrentError()).toBeUndefined();
      expect(errorController.getErrors()).toEqual([]);
    });

    it("should delete errorState from data model", () => {
      errorController.captureError(new Error("Test error"), "test-error");

      // Reset mock to track only clearErrors call
      vitest.clearAllMocks();

      errorController.clearErrors();

      expect(mockDataController.delete).toHaveBeenCalledWith(
        "errorState",
        expect.objectContaining({
          writeSymbol: expect.any(Symbol),
        }),
      );
    });

    it("should handle missing data controller gracefully", () => {
      const controller = new ErrorController({
        logger: mockLogger,
        flow: mockFlowController,
        fail: mockFail,
      });
      controller.captureError(new Error("Test error"), "test-error");

      expect(() => controller.clearErrors()).not.toThrow();
    });
  });

  describe("clearCurrentError", () => {
    it("should clear current error but preserve history", () => {
      const error1 = new Error("Error 1");
      const error2 = new Error("Error 2");

      errorController.captureError(error1, "error-1");
      errorController.captureError(error2, "error-2");

      errorController.clearCurrentError();

      expect(errorController.getCurrentError()).toBeUndefined();
      expect(errorController.getErrors()).toHaveLength(2);
    });

    it("should delete errorState from data model", () => {
      errorController.captureError(new Error("Test error"), "test-error");

      // Reset mock to track only clearCurrentError call
      vitest.clearAllMocks();

      errorController.clearCurrentError();

      expect(mockDataController.delete).toHaveBeenCalledWith(
        "errorState",
        expect.objectContaining({
          writeSymbol: expect.any(Symbol),
        }),
      );
    });

    it("should handle missing data controller gracefully", () => {
      const controller = new ErrorController({
        logger: mockLogger,
        flow: mockFlowController,
        fail: mockFail,
      });
      controller.captureError(new Error("Test error"), "test-error");

      expect(() => controller.clearCurrentError()).not.toThrow();
    });
  });

  describe("onError hook", () => {
    it("should allow plugins to observe errors", () => {
      const onErrorSpy = vitest.fn();
      errorController.hooks.onError.tap("test", onErrorSpy);

      const error = new Error("Test error");
      errorController.captureError(error, "test-error");

      expect(onErrorSpy).toHaveBeenCalledTimes(1);
      expect(onErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error,
        }),
      );
    });

    it("should allow plugins to bail by returning true, stopping execution and preventing data model update", () => {
      const observer1 = vitest.fn(() => undefined);
      const skipPlugin = vitest.fn(() => true);
      const observer2 = vitest.fn(() => undefined);

      errorController.hooks.onError.tap("observer1", observer1);
      errorController.hooks.onError.tap("skip-plugin", skipPlugin);
      errorController.hooks.onError.tap("observer2", observer2);

      const error = new Error("Test error");
      const playerError = errorController.captureError(error, "test-error");

      expect(observer1).toHaveBeenCalledTimes(1);
      expect(skipPlugin).toHaveBeenCalledWith(playerError);
      expect(observer2).not.toHaveBeenCalled(); // Execution stops after bail
      // Data model should not be updated when skipped
      expect(mockDataController.set).not.toHaveBeenCalled();
    });

    it("should continue to next plugin when undefined is returned", () => {
      const observer1 = vitest.fn(() => undefined);
      const observer2 = vitest.fn(() => undefined);
      errorController.hooks.onError.tap("observer1", observer1);
      errorController.hooks.onError.tap("observer2", observer2);

      const error = new Error("Test error");
      errorController.captureError(error, "test-error");

      expect(observer1).toHaveBeenCalledTimes(1);
      expect(observer2).toHaveBeenCalledTimes(1);
      // Data model should be updated when not skipped
      expect(mockDataController.set).toHaveBeenCalled();
    });
  });

  describe("custom error types", () => {
    it("should allow custom plugin error types", () => {
      const error = new Error("Custom plugin error");
      const playerError = errorController.captureError(
        error,
        "my-custom-plugin",
        ErrorSeverity.WARNING,
      );

      expect(playerError.errorType).toBe("my-custom-plugin");
      expect(playerError.severity).toBe(ErrorSeverity.WARNING);
    });
  });

  describe("integration with middleware", () => {
    it("should use middleware to protect errorState from external deletes", () => {
      const middleware = errorController.getDataMiddleware();

      // Middleware should block deletes by default
      expect(middleware.name).toBe("error-state-middleware");

      // Capture an error (sets errorState)
      errorController.captureError(new Error("Test error"));
      expect(mockDataController.set).toHaveBeenCalled();

      // Clear error should delete via middleware with writeSymbol
      vitest.clearAllMocks();
      errorController.clearCurrentError();
      expect(mockDataController.delete).toHaveBeenCalledWith(
        "errorState",
        expect.objectContaining({
          writeSymbol: expect.any(Symbol),
        }),
      );
    });
  });
});
