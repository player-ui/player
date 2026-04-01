import Editor, { loader as monaco } from "@monaco-editor/react";
import { dequal } from "dequal";
import React from "react";
import { useDispatch } from "react-redux";
import { Placeholder, TabsView } from "storybook/internal/components";
import type { TabProps } from "storybook/internal/components";
import { API } from "storybook/manager-api";
import type { CompilationErrorType } from "../../redux";
import {
  setDSLEditorValue,
  setJSONEditorValue,
  useContentKind,
  useDSLEditorValue,
  useJSONEditorValue,
} from "../../redux";
import { useDarkMode } from "../useDarkMode";

if (typeof window !== "undefined") {
  monaco.init().then((m) => {
    m.languages.typescript.javascriptDefaults.setEagerModelSync(true);

    // TODO: Re-add these when we can load `.d.ts` definitions into the editor
    m.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });
    m.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: m.languages.typescript.JsxEmit.React,
    });
  });
}

interface EditorPanelProps {
  /** if the panel is shown */
  active: boolean;

  /** Storybook API */
  api: API;
}

/** the panel for the flow editor */
export const JSONEditorPanel = (props: EditorPanelProps) => {
  const darkMode = useDarkMode(props.api);

  const jsonEditorValue = useJSONEditorValue();

  const jsonValueAsString =
    jsonEditorValue?.state === "loaded"
      ? JSON.stringify(jsonEditorValue.value, null, 2)
      : "";

  const dispatch = useDispatch();

  /** Handle change events */
  const onChange = (val: string | undefined) => {
    if (!val || jsonEditorValue?.state !== "loaded") {
      return;
    }

    try {
      const parsed = JSON.parse(val);
      if (!dequal(parsed, jsonEditorValue.value)) {
        dispatch(
          setJSONEditorValue({
            value: parsed,
          }),
        );
      }
    } catch (e) {
      // Parsing errors for JSON are handled by the editor
    }
  };

  return (
    <Editor
      theme={darkMode ? "dark" : "light"}
      value={jsonValueAsString}
      language="json"
      options={{
        formatOnPaste: true,
      }}
      onChange={(val) => {
        onChange(val);
      }}
    />
  );
};

/** simple comp to showcase dsl errors */
const CompileErrors = ({
  errors,
}: {
  /** The errors to display */
  errors: CompilationErrorType;
}) => {
  if (
    (errors.compileErrors === undefined || errors.compileErrors.length === 0) &&
    (errors.transpileErrors === undefined ||
      errors.transpileErrors.length === 0)
  ) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        zIndex: 100,
        background: "white",
        padding: "8px",
        border: "1px solid red",
        color: "red",
        width: "100%",
      }}
    >
      <h3>Errors</h3>
      {errors.compileErrors?.map((e) => (
        <pre key={e.message}>{e.message}</pre>
      ))}
      {errors.transpileErrors?.map((e) => (
        <pre key={e.message}>{e.message}</pre>
      ))}
    </div>
  );
};

/** A panel with the TSX editor built-in */
const DSLEditorPanel = (props: EditorPanelProps) => {
  const darkMode = useDarkMode(props.api);

  const jsonEditorValue = useJSONEditorValue();
  const dslEditorValue = useDSLEditorValue();
  const dispatch = useDispatch();

  const editorValue =
    dslEditorValue?.state === "loaded" ? dslEditorValue.value : "";
  const flow = jsonEditorValue?.state === "loaded" ? jsonEditorValue.value : "";

  const compilationErrors =
    dslEditorValue?.state === "loaded"
      ? dslEditorValue.compilationErrors
      : undefined;

  const [selected, setSelected] = React.useState("tsx");

  /** Handle editor updates */
  const onTsxEditorChange = (val: string | undefined) => {
    if (val) {
      dispatch(
        setDSLEditorValue({
          value: val,
        }),
      );
    }
  };

  const tabs: Array<TabProps> = [
    {
      id: "tsx",
      title: "TSX",
      children: (
        <>
          {compilationErrors && <CompileErrors errors={compilationErrors} />}
          <Editor
            theme={darkMode ? "vs-dark" : "light"}
            value={editorValue}
            language="typescript"
            path="flow.tsx"
            keepCurrentModel={true}
            options={{
              quickSuggestions: true,
              suggestOnTriggerCharacters: true,
              parameterHints: {
                enabled: true,
              },
            }}
            onChange={onTsxEditorChange}
          />
        </>
      ),
    },
    {
      id: "json",
      title: "JSON (read-only)",
      children: (
        <Editor
          options={{
            readOnly: true,
          }}
          theme={darkMode ? "vs-dark" : "light"}
          path="flow.json"
          keepCurrentModel={true}
          value={flow ? JSON.stringify(flow, null, 2) : "{}"}
          language="json"
        />
      ),
    },
  ];

  return (
    <TabsView tabs={tabs} selected={selected} onSelectionChange={setSelected} />
  );
};

/** The editor panel */
export const EditorPanel = (props: EditorPanelProps) => {
  const contentType = useContentKind();

  if (!props.active) {
    return null;
  }

  if (contentType === "dsl") {
    return <DSLEditorPanel {...props} />;
  }

  if (contentType === "json") {
    return <JSONEditorPanel {...props} />;
  }

  return (
    <Placeholder>This story is not configured to allow flow edits.</Placeholder>
  );
};
