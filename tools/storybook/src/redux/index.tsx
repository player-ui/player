/* eslint-disable no-param-reassign */
import React from "react";
import type { Flow } from "@player-ui/react";
import { DSLCompiler } from "@player-tools/dsl";
import {
  configureStore,
  createAction,
  createAsyncThunk,
  createReducer,
} from "@reduxjs/toolkit";
import { Provider, useDispatch, useSelector } from "react-redux";
import {
  createStateSyncMiddleware,
  initStateWithPrevTab,
} from "redux-state-sync";
import { execute } from "../dsl";
import type { RenderTarget } from "../types";
import type { EventType } from "../state";

const compiler = new DSLCompiler();

export type LoadingState = "loading" | "loaded" | "error";

export const resetEditor = createAction("@@player/flow/reset");

export const setDSLEditorValue = createAction<{
  /** The state of the editor */
  value: string;
}>("setDSLEditorValue");

export const setCompiledEditorResult = createAction<{
  /** The state of the editor */
  result?: Flow;

  /** Any errors from the compilation */
  errors?: CompilationErrorType;
}>("setCompiledEditorResult");

export const setEditorContentType = createAction<{
  /** The state of the editor */
  contentType: "dsl" | "json" | undefined;
}>("setEditorContentType");

export const setJSONEditorValue = createAction<{
  /** The state of the editor */
  value: Flow;
}>("setJSONEditorValue");

export const updateAndCompileDSLFlow = createAsyncThunk<
  void,
  {
    /** Other external modules to include */
    additionalModules?: Record<string, any>;
  }
>("editor/dsl/compile", async (context, thunkAPI) => {
  const content = (thunkAPI.getState() as any).editor.dsl?.value;

  if (!content) {
    throw new Error("No content to compile");
  }

  try {
    const transpiledResult = await execute(content, {
      additionalModules: context.additionalModules,
    });

    if (transpiledResult) {
      const compiled = await compiler.serialize(transpiledResult.default);

      thunkAPI.dispatch(
        setCompiledEditorResult({ result: compiled?.value as any }),
      );
    }
  } catch (e: any) {
    thunkAPI.dispatch(
      setCompiledEditorResult({
        errors: {
          transpileErrors: [
            {
              message: e.message,
            },
          ],
        },
      }),
    );
  }
});

export const setPlatform = createAction<{
  /** The platform to render on */
  platform: RenderTarget["platform"];
}>("@@player/platform/set");

export const unsetPlatform = createAction("@@player/platform/unset");

const platformReducer = createReducer<{
  /** The platform to render on */
  platform?: RenderTarget["platform"];
}>(
  {
    platform: "web",
  },
  (builder) => {
    builder.addCase(setPlatform, (state, action) => {
      state.platform = action.payload.platform;
    });

    builder.addCase(unsetPlatform, (state) => {
      state.platform = undefined;
    });
  },
);

export type CompilationErrorType = {
  /** Errors running esbuild */
  transpileErrors?: Array<{
    /** The error message */
    message: string;
  }>;

  /** Errors converting the JS into JSON */
  compileErrors?: Array<{
    /** The error message */
    message: string;
  }>;
};

export const setCompilationErrors = createAction<CompilationErrorType>(
  "setCompilationErrors",
);

const flowEditorReducer = createReducer<{
  /** The primary content type for the editor */
  contentType?: "json" | "dsl";

  /** The state of the JSON portion of the editor */
  json?:
    | {
        /** The state of the editor */
        state: "loading" | "error" | "initial";
      }
    | {
        /** The state of the editor */
        state: "loaded";
        /** The value of the editor */
        value: Flow;
      };

  /** The state of the DSL portion of the editor */
  dsl?:
    | {
        /** The state of the editor */
        state: "loading" | "error" | "initial";
      }
    | {
        /** The state of the editor */
        state: "loaded";
        /** The value of the editor */
        value: string;
        /** Set if this value needs to be converted into JSON */
        needsCompile: boolean;

        /** Problems with compilation */
        compilationErrors?: CompilationErrorType;
      };
}>(
  {
    json: { state: "initial" },
    dsl: { state: "initial" },
    contentType: undefined,
  },
  (builder) => {
    builder.addCase(setEditorContentType, (state, action) => {
      state.contentType = action.payload.contentType;

      if (action.payload.contentType === "json") {
        state.dsl = { state: "initial" };
      }
    });

    builder.addCase(setDSLEditorValue, (state, action) => {
      state.dsl = {
        state: "loaded",
        value: action.payload.value,
        needsCompile: true,
        compilationErrors: undefined,
      };
    });

    builder.addCase(setCompilationErrors, (state, action) => {
      if (state.dsl?.state === "loaded") {
        state.dsl.compilationErrors = action.payload;
      }
    });

    builder.addCase(updateAndCompileDSLFlow.pending, (state) => {
      state.json = { state: "loading" };
    });

    builder.addCase(resetEditor, (state) => {
      state.json = { state: "initial" };
      state.dsl = { state: "initial" };
    });

    builder.addCase(updateAndCompileDSLFlow.rejected, (state) => {
      state.dsl = { state: "error" };
    });

    builder.addCase(setCompiledEditorResult, (state, action) => {
      if (state.dsl?.state === "loaded") {
        state.dsl.needsCompile = false;
        state.dsl.compilationErrors = action.payload.errors;
      }

      if (action.payload.result) {
        state.json = { state: "loaded", value: action.payload.result };
      }
    });

    builder.addCase(setJSONEditorValue, (state, action) => {
      state.json = { state: "loaded", value: action.payload.value };
    });
  },
);

export const addEvents = createAction<Array<EventType>>("@@player/events/add");
export const clearEvents = createAction("@@player/events/clear");

const eventsReducer = createReducer<Array<EventType>>([], (builder) => {
  builder.addCase(addEvents, (state, action) => {
    state.push(...action.payload);
  });

  builder.addCase(clearEvents, () => {
    return [];
  });
});

const STATE_SYNC_CHANNEL_NAME = (() => {
  if (
    typeof window !== "undefined" &&
    window.sessionStorage.getItem("player:channel")
  ) {
    return window?.sessionStorage.getItem("player:channel") as string;
  }

  const channel =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  if (typeof window !== "undefined") {
    window?.sessionStorage.setItem("player:channel", channel);
  }

  return channel;
})();

export const store = configureStore({
  reducer: {
    editor: flowEditorReducer,
    platform: platformReducer,
    events: eventsReducer,
  },
  middleware: (getDefaultMiddleware) => {
    return [
      ...getDefaultMiddleware(),
      createStateSyncMiddleware({
        channel: STATE_SYNC_CHANNEL_NAME,
        blacklist: [
          "editor/dsl/compile/pending",
          "editor/dsl/compile/fulfilled",
          "editor/dsl/compile/rejected",
        ],
      }),
    ];
  },
  devTools: true,
});

initStateWithPrevTab(store);

/** A State provider with the store pre-added */
export const StateProvider = (props: React.PropsWithChildren<any>) => {
  return <Provider {...props} store={store} />;
};

/** Get the value of the JSON editor */
export const useJSONEditorValue = () => {
  return useSelector((state: ReturnType<typeof store.getState>) => {
    return state.editor.json;
  });
};

/** Get the value of the DSL editor */
export const useDSLEditorValue = () => {
  const dslEditorValue = useSelector((state: StateType) => {
    return state.editor.dsl;
  });

  return dslEditorValue;
};

/** Grab the current editor type */
export const useContentKind = (contentTypeToSet?: "json" | "dsl") => {
  const dispatch = useDispatch();

  const contentType = useSelector<StateType>((state: StateType) => {
    return state.editor.contentType;
  });

  React.useEffect(() => {
    if (contentTypeToSet && contentTypeToSet !== contentType) {
      dispatch(
        setEditorContentType({
          contentType: contentTypeToSet,
        }),
      );
    }
  }, [contentType, contentTypeToSet, dispatch]);

  return contentType;
};

/** A hook to handle initializing and updating the JSON value of the flow from the DSL content */
export const useCompiledEditorValue = (
  initialValue: string,
  options?: {
    /** Things to add to the compilation */
    additionalModules?: Record<string, any>;
  },
) => {
  useContentKind("dsl");

  const dispatch = useDispatch();

  const dslEditorValue = useSelector((s: StateType) => {
    return s.editor.dsl;
  });

  /** Fire off the initial set to reset it on story change */
  React.useEffect(() => {
    store.dispatch(setDSLEditorValue({ value: initialValue }));
  }, []);

  React.useEffect(() => {
    if (dslEditorValue?.state === "initial") {
      dispatch(setDSLEditorValue({ value: initialValue }));
    }
  }, [dslEditorValue, initialValue]);

  React.useEffect(() => {
    if (dslEditorValue?.state === "loaded" && dslEditorValue.needsCompile) {
      dispatch(
        updateAndCompileDSLFlow({
          additionalModules: options?.additionalModules,
        }),
      );
    }
  }, [dslEditorValue, options?.additionalModules]);

  return dslEditorValue;
};

/** A hook to handle initializing and updating the JSON value of the flow editor (for use when _not_ using DSL content) */
export const useInitialJsonEditorValue = (initialValue: Flow) => {
  const dispatch = useDispatch();
  useContentKind("json");

  const jsonEditorValue = useSelector((s: StateType) => {
    return s.editor.json;
  });

  /** Fire off the initial set to reset it on story change */
  React.useEffect(() => {
    store.dispatch(setJSONEditorValue({ value: initialValue }));
  }, []);

  React.useEffect(() => {
    if (jsonEditorValue?.state === "initial") {
      dispatch(setJSONEditorValue({ value: initialValue }));
    }
  }, [jsonEditorValue, initialValue]);

  return jsonEditorValue;
};

export type StateType = ReturnType<typeof store.getState>;
