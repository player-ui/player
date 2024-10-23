import React from "react";
import { loader, Editor } from "@monaco-editor/react";
import {
  ApplicabilityPlugin,
  AssetPlugin,
  BindingParser,
  ExpressionEvaluator,
  LocalModel,
  MultiNodePlugin,
  Parser,
  SchemaController,
  SwitchPlugin,
  TemplatePlugin,
  withParser,
} from "@player-ui/player";
import type { Node } from "@player-ui/player";
import JSON5 from "json5";
import stringify from "stringify-object";

const parser = new Parser();

const model = withParser(new LocalModel(), new BindingParser().parse);
const expressionEvaluator = new ExpressionEvaluator({
  model,
});
const options = {
  evaluate: expressionEvaluator.evaluate,
  schema: new SchemaController(),
  data: {
    format: (binding: any, val: any) => val,
    formatValue: (val: any) => val,
    model,
  },
};

new AssetPlugin().applyParser(parser);
new TemplatePlugin(options).applyParser(parser);
new ApplicabilityPlugin().applyParser(parser);
new SwitchPlugin(options).applyParser(parser);
new MultiNodePlugin().applyParser(parser);

const initialView = {
  _comment: "Insert your View's AST here",
  id: "view",
  type: "info",
  title: {
    asset: {
      id: "page-title",
      type: "text",
      value: "Title of the page",
    },
  },
  actions: [
    {
      asset: {
        id: "prev-action",
        type: "action",
        value: "Prev",
        label: {
          asset: {
            id: "prev-action-label",
            type: "text",
            value: "Back",
          },
        },
      },
    },
    {
      asset: {
        id: "next-action",
        type: "action",
        value: "Next",
        label: {
          asset: {
            id: "next-action-label",
            type: "text",
            value: "Continue",
          },
        },
      },
    },
  ],
};

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

export default function ASTExplorer() {
  const theme = localStorage.getItem("starlight-theme") ?? "light";

  const [flow, setFlow] = React.useState<string | undefined>(
    JSON.stringify(initialView, null, 2),
  );
  const [astTree, setTree] = React.useState<Node.View | undefined>(
    parser.parseView(initialView),
  );
  const parsed = stringify(astTree, { indent: "  ", inlineCharacterLimit: 12 });

  return (
    <div className="flex flex-col lg:flex-row [&_*]:!mt-0 ">
      <div className="w-full">
        <h5 className="mb-2">View (JSON)</h5>
        <Editor
          height="90vh"
          width="100%"
          language="json"
          theme={`vs-${theme}`}
          value={flow}
          onChange={(value) => {
            try {
              if (!value) {
                setTree(undefined);
                return;
              }
              setFlow(value);

              const normalized = JSON5.parse(value);
              const newAST = parser.parseView(normalized);
              console.error(newAST);
              setTree(newAST);
            } catch (e) {
              setTree(undefined);
            }
          }}
        />
      </div>
      <div className="w-full">
        <h5 className="mb-2">View (AST)</h5>
        <Editor
          height="90vh"
          width="100%"
          language="javascript"
          options={{
            readOnly: true,
          }}
          theme={`vs-${theme}`}
          value={parsed}
        />
      </div>
    </div>
  );
}
