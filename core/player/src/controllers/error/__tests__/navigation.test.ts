import { describe, it, beforeEach, expect, vitest } from "vitest";
import { ErrorController } from "../controller";
import { FlowController } from "../../flow/controller";
import { FlowInstance } from "../../flow/flow";
import { ErrorTypes } from "../types";
import type { Logger } from "../../../logger";
import type { DataController } from "../../data/controller";

describe("ErrorController Navigation", () => {
  let errorController: ErrorController;
  let mockFlowController: FlowController;
  let mockFlowInstance: FlowInstance;
  let mockDataController: DataController;
  let mockLogger: Logger;
  let mockFail: ReturnType<typeof vitest.fn>;

  beforeEach(() => {
    mockLogger = {
      trace: vitest.fn(),
      debug: vitest.fn(),
      info: vitest.fn(),
      warn: vitest.fn(),
      error: vitest.fn(),
    };

    mockDataController = {
      set: vitest.fn(),
      get: vitest.fn(),
      delete: vitest.fn(),
    } as any;

    mockFail = vitest.fn();

    // Mock FlowInstance
    mockFlowInstance = {
      currentState: {
        name: "VIEW_Start",
        value: {
          state_type: "VIEW",
          ref: "start-view",
          transitions: {
            next: "VIEW_Next",
          },
        },
      },
      errorTransition: vitest.fn(),
    } as any;

    // Mock FlowController
    mockFlowController = {
      current: mockFlowInstance,
      reject: vitest.fn(),
    } as any;

    errorController = new ErrorController({
      logger: mockLogger,
      model: mockDataController,
      flow: mockFlowController,
      fail: mockFail,
    });
  });

  describe("errorTransitions navigation", () => {
    it("should navigate using errorTransition method", () => {
      const error = new Error("Test error");
      errorController.captureError(error, ErrorTypes.VIEW);

      // Should call errorTransition with errorType
      expect(mockFlowInstance.errorTransition).toHaveBeenCalledWith(
        ErrorTypes.VIEW,
      );
      expect(mockFail).not.toHaveBeenCalled();
    });

    it("should reject flow when errorTransition throws", () => {
      mockFlowInstance.errorTransition = vitest.fn().mockImplementation(() => {
        throw new Error("No errorTransitions defined");
      });

      const error = new Error("Test error");
      errorController.captureError(error, ErrorTypes.NAVIGATION);

      expect(mockFlowInstance.errorTransition).toHaveBeenCalledWith(
        ErrorTypes.NAVIGATION,
      );
      expect(mockFail).toHaveBeenCalledWith(error);
    });

    it("should pass correct errorType to errorTransition", () => {
      const error = new Error("Binding failed");
      errorController.captureError(error, "binding");

      expect(mockFlowInstance.errorTransition).toHaveBeenCalledWith("binding");
    });

    it("should pass custom errorType to errorTransition", () => {
      const error = new Error("Custom error");
      errorController.captureError(error, "custom_type");

      expect(mockFlowInstance.errorTransition).toHaveBeenCalledWith(
        "custom_type",
      );
    });
  });

  describe("Hook integration", () => {
    it("should skip navigation when plugin bails", () => {
      errorController.hooks.onError.tap("test", () => true);

      const error = new Error("Test error");
      errorController.captureError(error, ErrorTypes.NAVIGATION);

      // Should not navigate when bailed
      expect(mockFlowInstance.errorTransition).not.toHaveBeenCalled();
      expect(mockFail).not.toHaveBeenCalled();
    });

    it("should navigate when plugin does not bail", () => {
      errorController.hooks.onError.tap("test", () => undefined);

      const error = new Error("Test error");
      errorController.captureError(error, ErrorTypes.NAVIGATION);

      expect(mockFlowInstance.errorTransition).toHaveBeenCalledWith(
        ErrorTypes.NAVIGATION,
      );
    });

    it("should navigate when plugin returns false", () => {
      errorController.hooks.onError.tap("test", () => false);

      const error = new Error("Test error");
      errorController.captureError(error, ErrorTypes.VIEW);

      expect(mockFlowInstance.errorTransition).toHaveBeenCalledWith(
        ErrorTypes.VIEW,
      );
    });
  });

  describe("No active flow", () => {
    it("should warn and not navigate when no active flow", () => {
      mockFlowController.current = undefined;

      const error = new Error("Test error");
      errorController.captureError(error, ErrorTypes.VIEW);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "[ErrorController] No active flow instance for error navigation",
      );
      expect(mockFail).not.toHaveBeenCalled();
    });
  });
});
