import { describe, it, beforeEach, expect, vitest } from "vitest";
import { ErrorController } from "../controller";
import { ErrorSeverity, ErrorTypes } from "../types";
import type { DataController } from "../../data/controller";
import type { Logger } from "../../../logger";

describe("ErrorController", () => {
  let errorController: ErrorController;
  let mockDataController: DataController;
  let mockLogger: Logger;

  beforeEach(() => {
    mockDataController = {
      set: vitest.fn(),
      get: vitest.fn(),
      delete: vitest.fn(),
    } as any;

    mockLogger = {
      trace: vitest.fn(),
      debug: vitest.fn(),
      info: vitest.fn(),
      warn: vitest.fn(),
      error: vitest.fn(),
    };

    errorController = new ErrorController({
      logger: mockLogger,
      model: mockDataController,
    });
  });

  describe("captureError", () => {
    it("should capture error with metadata", () => {
      const error = new Error("Test error");
      const metadata = {
        errorType: ErrorTypes.EXPRESSION,
        severity: ErrorSeverity.ERROR,
        state: "VIEW_Test",
      };

      const playerError = errorController.captureError(error, metadata);

      expect(playerError.error).toBe(error);
      expect(playerError.metadata.errorType).toBe(ErrorTypes.EXPRESSION);
      expect(playerError.metadata.severity).toBe(ErrorSeverity.ERROR);
      expect(playerError.metadata.state).toBe("VIEW_Test");
      expect(playerError.metadata.timestamp).toBeDefined();
    });

    it("should add error to history", () => {
      const error1 = new Error("Error 1");
      const error2 = new Error("Error 2");

      errorController.captureError(error1);
      errorController.captureError(error2);

      const history = errorController.getErrors();
      expect(history).toHaveLength(2);
      expect(history[0]?.error).toBe(error1);
      expect(history[1]?.error).toBe(error2);
    });

    it("should set as current error", () => {
      const error = new Error("Test error");
      errorController.captureError(error);

      const currentError = errorController.getCurrentError();
      expect(currentError?.error).toBe(error);
    });

    it("should write to data model", () => {
      const error = new Error("Test error");
      errorController.captureError(error, {
        errorType: ErrorTypes.EXPRESSION,
      });

      expect(mockDataController.set).toHaveBeenCalledWith([
        [
          "errorState",
          expect.objectContaining({
            message: "Test error",
            name: "Error",
            errorType: ErrorTypes.EXPRESSION,
          }),
        ],
      ]);
    });
  });

  describe("formatErrorForData", () => {
    it("should format error with default formatter", () => {
      const error = new Error("Test error");
      const playerError = errorController.captureError(error, {
        errorType: ErrorTypes.VIEW,
        severity: ErrorSeverity.ERROR,
        state: "VIEW_Test",
        context: { viewId: "test-view" },
      });

      const formatted = errorController.formatErrorForData(playerError);

      expect(formatted).toEqual({
        message: "Test error",
        name: "Error",
        errorType: ErrorTypes.VIEW,
        severity: ErrorSeverity.ERROR,
        assetId: undefined,
        assetType: undefined,
        bindingPath: undefined,
        context: { viewId: "test-view" },
      });
    });

    it("should include asset context", () => {
      const error = new Error("Test error");
      const playerError = errorController.captureError(error, {
        assetContext: {
          asset: { id: "test-asset", type: "form" } as any,
          bindingPath: "user.email",
        },
      });

      const formatted = errorController.formatErrorForData(playerError);

      expect(formatted.assetId).toBe("test-asset");
      expect(formatted.assetType).toBe("form");
      expect(formatted.bindingPath).toBe("user.email");
    });
  });

  describe("getCurrentError", () => {
    it("should return undefined when no errors", () => {
      expect(errorController.getCurrentError()).toBeUndefined();
    });

    it("should return current error", () => {
      const error = new Error("Test error");
      errorController.captureError(error);

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

      errorController.captureError(error1);
      errorController.captureError(error2);

      const errors = errorController.getErrors();
      expect(errors).toHaveLength(2);
      expect(errors[0]?.error).toBe(error1);
      expect(errors[1]?.error).toBe(error2);
    });
  });

  describe("clearErrors", () => {
    it("should clear all errors and history", () => {
      errorController.captureError(new Error("Error 1"));
      errorController.captureError(new Error("Error 2"));

      errorController.clearErrors();

      expect(errorController.getCurrentError()).toBeUndefined();
      expect(errorController.getErrors()).toEqual([]);
    });

    it("should delete errorState from data model", () => {
      errorController.captureError(new Error("Test error"));

      // Reset mock to track only clearErrors call
      vitest.clearAllMocks();

      errorController.clearErrors();

      expect(mockDataController.delete).toHaveBeenCalledWith("errorState");
    });

    it("should handle missing data controller gracefully", () => {
      const controller = new ErrorController({ logger: mockLogger });
      controller.captureError(new Error("Test error"));

      expect(() => controller.clearErrors()).not.toThrow();
    });
  });

  describe("clearCurrentError", () => {
    it("should clear current error but preserve history", () => {
      const error1 = new Error("Error 1");
      const error2 = new Error("Error 2");

      errorController.captureError(error1);
      errorController.captureError(error2);

      errorController.clearCurrentError();

      expect(errorController.getCurrentError()).toBeUndefined();
      expect(errorController.getErrors()).toHaveLength(2);
    });

    it("should delete errorState from data model", () => {
      errorController.captureError(new Error("Test error"));

      // Reset mock to track only clearCurrentError call
      vitest.clearAllMocks();

      errorController.clearCurrentError();

      expect(mockDataController.delete).toHaveBeenCalledWith("errorState");
    });

    it("should handle missing data controller gracefully", () => {
      const controller = new ErrorController({ logger: mockLogger });
      controller.captureError(new Error("Test error"));

      expect(() => controller.clearCurrentError()).not.toThrow();
    });
  });

  describe("onError hook", () => {
    it("should allow plugins to observe errors", () => {
      const onErrorSpy = vitest.fn();
      errorController.hooks.onError.tap("test", onErrorSpy);

      const error = new Error("Test error");
      errorController.captureError(error);

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
      const playerError = errorController.captureError(error);

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
      errorController.captureError(error);

      expect(observer1).toHaveBeenCalledTimes(1);
      expect(observer2).toHaveBeenCalledTimes(1);
      // Data model should be updated when not skipped
      expect(mockDataController.set).toHaveBeenCalled();
    });
  });

  describe("custom error types", () => {
    it("should allow custom plugin error types", () => {
      const error = new Error("Custom plugin error");
      const playerError = errorController.captureError(error, {
        errorType: "my-custom-plugin",
        severity: ErrorSeverity.WARNING,
      });

      expect(playerError.metadata.errorType).toBe("my-custom-plugin");

      const formatted = errorController.formatErrorForData(playerError);
      expect(formatted.errorType).toBe("my-custom-plugin");
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

      // Clear error should delete via middleware
      vitest.clearAllMocks();
      errorController.clearCurrentError();
      expect(mockDataController.delete).toHaveBeenCalledWith("errorState");
    });
  });
});
