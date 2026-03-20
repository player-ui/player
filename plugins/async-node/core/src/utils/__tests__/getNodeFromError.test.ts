import { describe, expect, it, vi, beforeEach } from "vitest";
import { getNodeFromError } from "../getNodeFromError";
import { isAsyncPlayerError } from "../isAsyncPlayerError";
import {
  ErrorMetadata,
  ErrorSeverity,
  ErrorTypes,
  NodeType,
  PlayerError,
  PlayerErrorMetadata,
} from "@player-ui/player";
import { AsyncPluginContext } from "../../internal-types";
import { ASYNC_ERROR_TYPE } from "../../AsyncNodeError";

vi.mock("../isAsyncPlayerError");

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

const createPlayerError = (
  errorType: string,
  metadata?: ErrorMetadata,
): PlayerError => ({
  error: new ErrorWithProps("Error", errorType, ErrorSeverity.ERROR, metadata),
  errorType,
  skipped: false,
  metadata,
  severity: ErrorSeverity.ERROR,
});

const createContext = (): AsyncPluginContext => ({
  assetIdCache: new Map(),
  asyncNodeCache: new Map(),
  generatedByMap: new Map(),
  inProgressNodes: new Set(),
  view: {} as any,
  viewController: {} as any,
});

describe("getNodeFromError", () => {
  beforeEach(() => {
    vi.mocked(isAsyncPlayerError).mockReturnValue(false);
  });
  describe("render errors", () => {
    it("should be undefined when no string assetId is in the error metadata", () => {
      const result = getNodeFromError(
        createPlayerError(ErrorTypes.RENDER, {}),
        createContext(),
      );

      expect(result).toBeUndefined();
    });

    it("should be undefined the assetId is not in the context cache", () => {
      const result = getNodeFromError(
        createPlayerError(ErrorTypes.RENDER, { assetId: "test-id" }),
        createContext(),
      );

      expect(result).toBeUndefined();
    });

    it("should be the node from the assetIdCache if the assetId is available", () => {
      const context = createContext();
      context.assetIdCache.set("test-id", {
        type: NodeType.Value,
        value: {
          prop: "value",
        },
      });
      const result = getNodeFromError(
        createPlayerError(ErrorTypes.RENDER, { assetId: "test-id" }),
        context,
      );

      expect(result).toStrictEqual({
        type: NodeType.Value,
        value: {
          prop: "value",
        },
      });
    });
  });

  describe("view errors", () => {
    const notRealNodes = [undefined, null, [], "node"];
    it.each(notRealNodes)(
      "should return undefined for any view error without a node",
      (node) => {
        const result = getNodeFromError(
          createPlayerError(ErrorTypes.VIEW, { node }),
          createContext(),
        );

        expect(result).toBeUndefined();
      },
    );

    it("should return the node property if it is a node", () => {
      const result = getNodeFromError(
        createPlayerError(ErrorTypes.VIEW, {
          node: {
            type: NodeType.Value,
            value: {
              prop: "value",
            },
          },
        }),
        createContext(),
      );

      expect(result).toStrictEqual({
        type: NodeType.Value,
        value: {
          prop: "value",
        },
      });
    });
  });

  describe("async errors", () => {
    it("should return undefined if the error is not recognized as an async error", () => {
      const result = getNodeFromError(
        {
          error: new ErrorWithProps(
            "Error",
            ASYNC_ERROR_TYPE,
            ErrorSeverity.ERROR,
            {
              node: {
                type: NodeType.Value,
                value: {
                  prop: "value",
                },
              },
            },
          ),
          errorType: ASYNC_ERROR_TYPE,
          skipped: false,
        },
        createContext(),
      );

      expect(result).toBeUndefined();
    });

    const undefinedNodeMetadata = [undefined, {}, { node: undefined }];
    it.each(undefinedNodeMetadata)(
      "should return undefined if the node from the error is undefined",
      (metadata) => {
        vi.mocked(isAsyncPlayerError).mockReturnValue(true);
        const result = getNodeFromError(
          createPlayerError(ASYNC_ERROR_TYPE, metadata),
          createContext(),
        );

        expect(result).toBeUndefined();
      },
    );

    it("should return the node from the metadata if it's avaialble", () => {
      vi.mocked(isAsyncPlayerError).mockReturnValue(true);
      const result = getNodeFromError(
        createPlayerError(ASYNC_ERROR_TYPE, {
          node: {
            type: NodeType.Value,
            value: {
              prop: "value",
            },
          },
        }),
        createContext(),
      );

      expect(result).toStrictEqual({
        type: NodeType.Value,
        value: {
          prop: "value",
        },
      });
    });
  });

  describe("other errors", () => {
    it("should return undefined for all other errors", () => {
      const result = getNodeFromError(
        createPlayerError("UNKNOWN", {}),
        createContext(),
      );

      expect(result).toBeUndefined();
    });
  });
});
