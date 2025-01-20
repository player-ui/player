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
          setCompleted(true);
        } else {
          setCurrentFlow((resp as any).value);
        }

        return resp;
      },
    };
  }, [setCurrentFlow]);

  return (
    <div className="grid grid-cols-2 gap-8 py-4">
      <div>
        <h3 className="mb-2" style={{marginTop: "1rem"}}>Content</h3>
      </div>
      <div>
        <h3 className="mb-2">Player View</h3>
      </div>
      <div>
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
              readOnly: true
            }}
          />
      </div>
      <div>
        {completed && <div> Done with demo </div>}
          {!completed && (
            <React.Suspense fallback={<div> Loading... </div>}>
              <ManagedPlayer
                manager={flowManager}
                {...config}
              />
            </React.Suspense>
          )}
      </div>
    </div>
  );
}
