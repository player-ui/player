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
import { AsyncNodeInfo, AsyncPluginContext } from "../../internal-types";
import { ASYNC_ERROR_TYPE, AsyncNodeError } from "../../AsyncNodeError";

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

const createPlayerErrorForError = (
  error: Error & PlayerErrorMetadata,
): PlayerError => ({
  error,
  errorType: error.type,
  metadata: error.metadata,
  severity: error.severity,
  skipped: false,
});

const createContext = (
  baseContext?: Partial<AsyncPluginContext>,
): AsyncPluginContext => ({
  assetIdCache: new Map(),
  asyncNodeCache: new Map(),
  generatedByMap: new Map(),
  inProgressNodes: new Set(),
  originalParentMap: new Map(),
  view: {} as any,
  viewController: {} as any,
  ...baseContext,
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

    it("should return undefined if the node from the error is undefined", () => {
      vi.mocked(isAsyncPlayerError).mockReturnValue(true);
      const result = getNodeFromError(
        createPlayerError(ASYNC_ERROR_TYPE, undefined),
        createContext(),
      );

      expect(result).toBeUndefined();
    });

    it("should return the node the asyncNodeCache if an id matches", () => {
      vi.mocked(isAsyncPlayerError).mockReturnValue(true);
      const cacheEntry: AsyncNodeInfo = {
        asyncNode: {
          type: NodeType.Async,
          id: "test-id",
          value: {
            type: NodeType.Value,
            value: {
              prop: "value cached",
            },
          },
        },
        updateNodes: new Set(),
      };
      const result = getNodeFromError(
        createPlayerErrorForError(
          new AsyncNodeError({
            type: NodeType.Async,
            id: "test-id",
            value: {
              type: NodeType.Value,
              value: {
                prop: "value",
              },
            },
          }),
        ),
        createContext({
          asyncNodeCache: new Map([["test-id", cacheEntry]]),
        }),
      );

      expect(result).toStrictEqual({
        type: NodeType.Async,
        id: "test-id",
        value: {
          type: NodeType.Value,
          value: {
            prop: "value cached",
          },
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
