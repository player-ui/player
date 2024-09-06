import React from "react";
import { loader, Editor } from "@monaco-editor/react";

loader.init().catch((e: unknown) => {
  console.error("Error initializing monaco", e);
});

export default function ASTExplorer() {
  return (
    <div className="flex flex-row">
      <Editor
        height="90vh"
        language="json"
        value={JSON.stringify({ foo: "bar" }, null, 2)}
        onChange={(e) => {
          console.log(e);
        }}
      />
      <Editor
        height="90vh"
        language="js"
        value={JSON.stringify({ foo: "bar" }, null, 2)}
        onChange={(e) => {
          console.log(e);
        }}
      />
    </div>
  );
}
