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
            error: "VIEW_Error",
          },
        },
      },
      transition: vitest.fn(),
      flowTransition: vitest.fn(),
      getFlowErrorState: vitest.fn().mockReturnValue(undefined),
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

  describe("Node-level errorState", () => {
    it("should navigate using node-level errorState when defined", () => {
      // Set errorState on current state
      mockFlowInstance.currentState!.value.errorState = "error";

      const error = new Error("Test error");
      errorController.captureError(error, ErrorTypes.VIEW);

      // Should call transition (node-level) with the errorState value
      expect(mockFlowInstance.transition).toHaveBeenCalledWith("error");
      expect(mockFail).not.toHaveBeenCalled();
    });

    it("should fall through to flow-level when transition throws", () => {
      mockFlowInstance.currentState!.value.errorState = "error";
      mockFlowInstance.transition = vitest.fn().mockImplementation((val) => {
        if (val === "error") {
          throw new Error("Node transition failed");
        }
      });
      mockFlowInstance.getFlowErrorState = vitest
        .fn()
        .mockReturnValue("flowError");

      const error = new Error("Test error");
      errorController.captureError(error, ErrorTypes.NAVIGATION);

      expect(mockFlowInstance.transition).toHaveBeenCalledWith("error");
      expect(mockFlowInstance.flowTransition).toHaveBeenCalledWith("flowError");
      expect(mockFail).not.toHaveBeenCalled();
    });
  });

  describe("Flow-level errorState", () => {
    it("should navigate to flow-level errorState when node-level not defined", () => {
      // No node-level errorState
      mockFlowInstance.currentState!.value.errorState = undefined;
      mockFlowInstance.getFlowErrorState = vitest.fn().mockReturnValue("error");

      const error = new Error("Test error");
      errorController.captureError(error, ErrorTypes.NAVIGATION);

      expect(mockFlowInstance.flowTransition).toHaveBeenCalledWith("error");
      expect(mockFail).not.toHaveBeenCalled();
    });

    it("should fall through to flow rejection when flow-level fails", () => {
      mockFlowInstance.currentState!.value.errorState = undefined;
      mockFlowInstance.getFlowErrorState = vitest.fn().mockReturnValue("error");
      mockFlowInstance.flowTransition = vitest.fn().mockImplementation(() => {
        throw new Error("Transition failed");
      });

      const error = new Error("Test error");
      errorController.captureError(error, ErrorTypes.NAVIGATION);

      expect(mockFlowInstance.flowTransition).toHaveBeenCalledWith("error");
      expect(mockFail).toHaveBeenCalledWith(error);
    });
  });

  describe("Flow rejection (fallback)", () => {
    it("should reject flow when no errorState defined", () => {
      mockFlowInstance.currentState!.value.errorState = undefined;
      mockFlowInstance.getFlowErrorState = vitest
        .fn()
        .mockReturnValue(undefined);

      const error = new Error("Test error");
      errorController.captureError(error, ErrorTypes.NAVIGATION);

      expect(mockFail).toHaveBeenCalledWith(error);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining("Rejecting flow with error"),
      );
    });
  });

  describe("Hook integration", () => {
    it("should skip navigation when plugin bails", () => {
      mockFlowInstance.currentState!.value.errorState = "error";

      errorController.hooks.onError.tap("test", () => true);

      const error = new Error("Test error");
      errorController.captureError(error, ErrorTypes.NAVIGATION);

      // Should not navigate when bailed
      expect(mockFlowInstance.transition).not.toHaveBeenCalled();
      expect(mockFlowInstance.flowTransition).not.toHaveBeenCalled();
      expect(mockFail).not.toHaveBeenCalled();
    });

    it("should navigate when plugin does not bail", () => {
      mockFlowInstance.currentState!.value.errorState = "error";

      errorController.hooks.onError.tap("test", () => undefined);

      const error = new Error("Test error");
      errorController.captureError(error, ErrorTypes.NAVIGATION);

      expect(mockFlowInstance.transition).toHaveBeenCalledWith("error");
    });
  });

  describe("Dictionary-based error transitionToError", () => {
    it("should transitionToError to specific error state based on errorType (node-level)", () => {
      mockFlowInstance.currentState!.value.errorState = {
        binding: "binding_error",
        expression: "expression_error",
        validation: "validation_error",
      };

      errorController.captureError(new Error("Binding failed"), "binding");

      expect(mockFlowInstance.transition).toHaveBeenCalledWith("binding_error");
    });

    it("should use * wildcard when errorType doesn't match (node-level)", () => {
      mockFlowInstance.currentState!.value.errorState = {
        binding: "binding_error",
        "*": "generic_error",
      };

      errorController.captureError(new Error("Unknown error"), "unknown");

      expect(mockFlowInstance.transition).toHaveBeenCalledWith("generic_error");
    });

    it("should fall through when no match and no wildcard (node-level)", () => {
      mockFlowInstance.currentState!.value.errorState = {
        binding: "binding_error",
      };

      mockFlowInstance.getFlowErrorState = vitest
        .fn()
        .mockReturnValue("flow_error");

      errorController.captureError(new Error("Expression error"), "expression");

      // Should fall through to flow-level
      expect(mockFlowInstance.flowTransition).toHaveBeenCalledWith(
        "flow_error",
      );
    });

    it("should transitionToError to specific error state based on errorType (flow-level)", () => {
      mockFlowInstance.currentState!.value.errorState = undefined;
      mockFlowInstance.getFlowErrorState = vitest
        .fn()
        .mockReturnValue("network_error");

      errorController.captureError(new Error("Network timeout"), "network");

      expect(mockFlowInstance.flowTransition).toHaveBeenCalledWith(
        "network_error",
      );
    });

    it("should use * wildcard when errorType doesn't match (flow-level)", () => {
      mockFlowInstance.currentState!.value.errorState = undefined;
      mockFlowInstance.getFlowErrorState = vitest
        .fn()
        .mockReturnValue("generic_error");

      errorController.captureError(new Error("Unknown error"), "unknown");

      expect(mockFlowInstance.flowTransition).toHaveBeenCalledWith(
        "generic_error",
      );
    });

    it("should preserve string-based errorState behavior", () => {
      mockFlowInstance.currentState!.value.errorState = "simple_error";

      errorController.captureError(new Error("Any error"), "binding");

      expect(mockFlowInstance.transition).toHaveBeenCalledWith("simple_error");
    });
  });
});
