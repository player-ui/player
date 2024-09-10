import * as React from "react";
import { ReferenceAssetsPlugin } from "@player-ui/reference-assets-plugin-react";
import "@player-ui/reference-assets-plugin-react/dist/index.css";
import { loader, Editor } from "@monaco-editor/react";
import { ManagedPlayer, type Flow, type FlowManager } from "@player-ui/react";
import { basicFlowManager } from "./sample-flow-manager";

loader
  .init()
  .then((m) => {
    m.languages.typescript.javascriptDefaults.setEagerModelSync(true);

    // TODO: Re-add these when we can load `.d.ts` definitions into the editor
    m.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });
    m.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: m.languages.typescript.JsxEmit.React,
    });
  })
  .catch((e: unknown) => {
    console.error("Error initializing monaco", e);
  });

export default function PlayerPreview() {
  const theme = localStorage.getItem("starlight-theme") ?? "light";

  const config = React.useMemo(
    () => ({
      plugins: [new ReferenceAssetsPlugin()],
    }),
    [],
  );

  const [completed, setCompleted] = React.useState(false);

  const [currentFlow, setCurrentFlow] = React.useState<Flow | undefined>();

  const flowManager = React.useMemo<FlowManager>(() => {
    return {
      next: async (prev) => {
        const resp = await basicFlowManager.next(prev);

        if (resp.done) {
          setCurrentFlow(undefined);
        } else {
          setCurrentFlow((resp as any).value);
        }

        return resp;
      },
    };
  }, [setCurrentFlow]);

  return (
    <div className="flex flex-col lg:flex-row [&_*]:!mt-0 ">
      <div className="w-full">
        <h5 className="mb-2">Flow (DSL)</h5>
        <Editor
          height="90vh"
          width="100%"
          language="typescript"
          theme={`vs-${theme}`}
          value={JSON.stringify(currentFlow, null, 2)}
          path="flow.tsx"
          keepCurrentModel={true}
          options={{
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
            parameterHints: {
              enabled: true,
            },
          }}
        />
      </div>
      <div className="w-full">
        <h5 className="mb-2">Player View</h5>
        {completed && <div> Done </div>}
        {!completed && (
          <React.Suspense fallback={<div> Loading... </div>}>
            <ManagedPlayer
              manager={flowManager}
              {...config}
              onComplete={() => {
                setCompleted(true);
              }}
            />
          </React.Suspense>
        )}
      </div>
    </div>
  );
}
