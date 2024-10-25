import { initialize, transform } from "esbuild-wasm/lib/browser";
import * as React from "react";
import * as PlayerDSL from "@player-tools/dsl";
import * as ReferenceAssets from "@player-ui/reference-assets-plugin-components";
import { loader, Editor } from "@monaco-editor/react";
import stringify from "stringify-object";

const { DSLCompiler } = PlayerDSL;

const initialDSLContent = `import React from 'react';
import { Info, Text } from '@player-ui/reference-assets-plugin-components';

const view1 = (
  <Info id="view-1">
    <Info.Title>
      <Text>Title</Text>
    </Info.Title>
  </Info>
);

export default {
  id: 'test-flow',
  views: [view1],
    navigation: {
    BEGIN: 'FLOW_1',
    FLOW_1: {
      startState: 'VIEW_1',
      VIEW_1: {
        state_type: 'VIEW',
        ref: view1,
        transitions: {
          '*': 'END_Done'
        }
      },
      END_Done: {
        state_type: 'END',
        outcome: 'done'
      }
    }
  }
}
`;

let initializedPromise: undefined | Promise<void>;
async function setup() {
  if (initializedPromise) {
    return initializedPromise;
  }

  initializedPromise = initialize({
    worker: true,
    wasmURL: "https://unpkg.com/esbuild-wasm@0.19.12/esbuild.wasm",
  });

  return initializedPromise;
}

/** Eval the code and check imports */
export const compileDSLCode = async (code: string) => {
  try {
    await setup();
  } catch (e) {
    console.error(e);
  }

  const result = await transform(code, {
    loader: "tsx",
    format: "cjs",
    tsconfigRaw: {
      compilerOptions: {
        jsx: "react",
      },
    },
  });

  const mods = {
    react: React,
    "@player-tools/dsl": PlayerDSL,
    "@player-ui/reference-assets-plugin-components": ReferenceAssets,
  };

  // eslint-disable-next-line no-eval
  const mod = eval(`(function(require, module){ ${result.code}})`);

  const exp: {
    /** Exports of the running module */
    exports?: any;
  } = {};
  /** a patch for `require` */
  const req = (name: string) => {
    return (mods as any)[name];
  };

  mod(req, exp);

  const compiler = new DSLCompiler();

  const compileResult = await compiler.serialize(exp.exports.default);
  return compileResult.value;
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

export default function DSLContentPlayground() {
  const theme = localStorage.getItem("starlight-theme") ?? "light";

  const [dslContent, setDSLContent] = React.useState<string | undefined>(
    initialDSLContent,
  );

  const [compiledOutput, setCompiledOutput] = React.useState<any>();
  const [compileErrors, setCompiledErrors] = React.useState<any>();

  React.useEffect(() => {
    compileDSLCode(initialDSLContent)
      .then((c) => {
        setCompiledOutput(c);
      })
      .catch((e) => {
        console.error("Compile Errors", e);
        setCompiledErrors(e);
      });
  }, []);

  const parsed = stringify(compiledOutput, {
    indent: "  ",
    inlineCharacterLimit: 12,
  });

  return (
    <div className="flex flex-col lg:flex-row [&_*]:!mt-0 ">
      <div className="w-full">
        <h5 className="mb-2">Flow (DSL)</h5>
        <Editor
          height="90vh"
          width="100%"
          language="typescript"
          theme={`vs-${theme}`}
          value={dslContent}
          path="flow.tsx"
          keepCurrentModel={true}
          options={{
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
            parameterHints: {
              enabled: true,
            },
          }}
          onChange={async (value) => {
            console.log(value);
            try {
              if (!value) {
                setCompiledOutput(undefined);
                return;
              }
              setDSLContent(value);

              const code = await compileDSLCode(value);
              console.log({ code });
              setCompiledOutput(code);
              setCompiledErrors(undefined);
            } catch (e) {
              console.error(e);
              console.error("Compile Errors", e);
              setCompiledErrors(e);
              setCompiledOutput(undefined);
            }
          }}
        />
      </div>
      <div className="w-full">
        <h5 className="mb-2">Compiled Flow (JSON)</h5>
        <Editor
          height="90vh"
          width="100%"
          language="json"
          options={{
            readOnly: true,
          }}
          theme={`vs-${theme}`}
          value={compileErrors ? compileErrors.toString() : parsed}
        />
      </div>
    </div>
  );
}
