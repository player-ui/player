import { describe, it, beforeEach, expect, vitest } from "vitest";
import { ErrorController } from "../controller";
import { FlowController } from "../../flow/controller";
import { FlowInstance } from "../../flow/flow";
import {
  ErrorMetadata,
  ErrorSeverity,
  ErrorTypes,
  PlayerErrorMetadata,
} from "../types";
import type { Logger } from "../../../logger";
import type { DataController } from "../../data/controller";

/** Test class to create an error with any additional properties */
class ErrorWithProps extends Error implements PlayerErrorMetadata {
  constructor(
    message: string,
    public type: string,
    public severity?: ErrorSeverity,
    public metadata?: ErrorMetadata,
  ) {
    super(message);
  }
}

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
      getErrorTransitionState: vitest.fn(() => true),
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
      const error = new ErrorWithProps("Test error", ErrorTypes.VIEW);
      errorController.captureError(error);

      // Should call errorTransition with errorType
      expect(mockFlowInstance.errorTransition).toHaveBeenCalledWith(
        ErrorTypes.VIEW,
      );
      expect(mockFail).not.toHaveBeenCalled();
    });

    it("should navigate using a wildcard transition when no error type is available", () => {
      const error = new Error("Test error");
      errorController.captureError(error);

      // Should call errorTransition with errorType
      expect(mockFlowInstance.errorTransition).toHaveBeenCalledWith("*");
      expect(mockFail).not.toHaveBeenCalled();
    });

    it("should reject flow when errorTransition throws", () => {
      mockFlowInstance.errorTransition = vitest.fn().mockImplementation(() => {
        throw new Error("No errorTransitions defined");
      });

      const error = new ErrorWithProps("Test error", ErrorTypes.NAVIGATION);
      errorController.captureError(error);

      expect(mockFlowInstance.errorTransition).toHaveBeenCalledWith(
        ErrorTypes.NAVIGATION,
      );
      expect(mockFail).toHaveBeenCalledWith(error);
    });

    it("should pass correct errorType to errorTransition", () => {
      const error = new ErrorWithProps("Binding failed", "binding");
      errorController.captureError(error);

      expect(mockFlowInstance.errorTransition).toHaveBeenCalledWith("binding");
    });

    it("should pass custom errorType to errorTransition", () => {
      const error = new ErrorWithProps("Custom error", "custom_type");
      errorController.captureError(error);

      expect(mockFlowInstance.errorTransition).toHaveBeenCalledWith(
        "custom_type",
      );
    });

    it("should fail the player state when there is no available transition", () => {
      vitest
        .mocked(mockFlowController.current?.getErrorTransitionState)
        ?.mockReturnValue(undefined);
      const error = new ErrorWithProps("Test error", ErrorTypes.VIEW);
      errorController.captureError(error);
      expect(mockFail).toHaveBeenCalled();
    });
  });

  describe("Hook integration", () => {
    it("should skip navigation when plugin bails", () => {
      errorController.hooks.onError.tap("test", () => true);

      const error = new ErrorWithProps("Test error", ErrorTypes.NAVIGATION);
      errorController.captureError(error);

      // Should not navigate when bailed
      expect(mockFlowInstance.errorTransition).not.toHaveBeenCalled();
      expect(mockFail).not.toHaveBeenCalled();
    });

    it("should navigate when plugin does not bail", () => {
      errorController.hooks.onError.tap("test", () => undefined);

      const error = new ErrorWithProps("Test error", ErrorTypes.NAVIGATION);
      errorController.captureError(error);

      expect(mockFlowInstance.errorTransition).toHaveBeenCalledWith(
        ErrorTypes.NAVIGATION,
      );
    });

    it("should navigate when plugin returns false", () => {
      errorController.hooks.onError.tap("test", () => false);

      const error = new ErrorWithProps("Test error", ErrorTypes.VIEW);
      errorController.captureError(error);

      expect(mockFlowInstance.errorTransition).toHaveBeenCalledWith(
        ErrorTypes.VIEW,
      );
    });
  });

  describe("No active flow", () => {
    it("should warn and not navigate when no active flow", () => {
      mockFlowController.current = undefined;

      const error = new ErrorWithProps("Test error", ErrorTypes.VIEW);
      errorController.captureError(error);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "[ErrorController] No active flow instance for error navigation",
      );
      expect(mockFail).not.toHaveBeenCalled();
    });
  });
});
