import { API, useParameter } from "@storybook/manager-api";
import type { NamedType, NodeType, ObjectType } from "@player-tools/xlr";
import { WithTooltip, SyntaxHighlighter, Link } from "@storybook/components";
import ts from "typescript";
import React from "react";
import { isPrimitiveTypeNode, TSWriter } from "./ts-convert";
import { useDarkMode } from "../useDarkMode";

interface DocsPanelProps {
  /** if the panel is actively shown to the user */
  active: boolean;

  /** Storybook API */
  api: API;
}

function getKeyName(node: NodeType): string {
  if (node.type === "ref") {
    return node.ref;
  }

  if (node.type === "or") {
    return node.or.map((subnode) => getKeyName(subnode)).join(" | ");
  }

  if (node.type === "and") {
    return node.and.map((subnode) => getKeyName(subnode)).join(" & ");
  }

  if (node.type === "array") {
    return `Array<${getKeyName(node.elementType)}>`;
  }

  if (node.type === "record") {
    return `Record<${getKeyName(node.keyType)}, ${getKeyName(node.valueType)}>`;
  }

  if (isPrimitiveTypeNode(node) && node.type !== "null") {
    return node.type;
  }

  if (node.type === "object" && node.name) {
    return node.name;
  }

  return node.type;
}

function XLRObjectDocs(props: {
  xlr: NamedType<ObjectType>;
  darkMode?: boolean;
}) {
  const tsWriter = new TSWriter();
  const printer = ts.createPrinter();
  const resultFile = ts.createSourceFile(
    "output.d.ts",
    "",
    ts.ScriptTarget.ES2017,
    false, // setParentNodes
    ts.ScriptKind.TS
  );

  return (
    <div style={{ padding: "8px" }}>
      <h2>{props.xlr.title ?? props.xlr.name}</h2>
      <p style={{ whiteSpace: "pre-line" }}>{props.xlr.description}</p>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Required</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(props.xlr.properties)
            .sort((a, b) =>
              // bubble up the required props first
              a[1].required === b[1].required ? 0 : a[1].required ? -1 : 1
            )
            .map(([propKey, propType]) => {
              let nodeText: React.JSX.Element | string = getKeyName(
                propType.node
              );

              if (nodeText === "object") {
                nodeText = propKey;
              }

              if (
                !isPrimitiveTypeNode(propType.node) &&
                propType.node.type !== "ref" &&
                !(
                  propType.node.type === "array" &&
                  propType.node.elementType.type === "ref"
                )
              ) {
                const tsType = tsWriter.convertNamedType({
                  source: props.xlr.source,
                  name: propType.node.name ?? propKey,
                  ...propType.node,
                });

                const tsText = printer.printNode(
                  ts.EmitHint.Unspecified,
                  tsType.type,
                  resultFile
                );

                nodeText = (
                  <WithTooltip
                    trigger="hover"
                    withArrows
                    tooltip={
                      <SyntaxHighlighter language="typescript" bordered>
                        {tsText}
                      </SyntaxHighlighter>
                    }
                  >
                    <Link>{nodeText}</Link>
                  </WithTooltip>
                );
              }

              return (
                <tr key={propKey}>
                  <td>{propKey}</td>
                  <td>{propType.required ? <b>yes</b> : "no"}</td>
                  <td>{nodeText}</td>
                  <td>{propType.node.description}</td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

/** Panel to show doc info about asset props */
export function DocsPanel(props: DocsPanelProps) {
  const assetDocsToRender = useParameter<Array<string> | undefined>(
    "assetDocs"
  );
  const defaultXLRSources = useParameter<Array<any> | undefined>(
    "assetXLRSources"
  );

  const darkMode = useDarkMode(props.api);

  if (!props.active) {
    return null;
  }

  if (assetDocsToRender === undefined && defaultXLRSources === undefined) {
    return <div>Loading...</div>;
  }

  if (defaultXLRSources === undefined) {
    return <div>No assetXLRSources configured. Unable to generate docs.</div>;
  }

  if (assetDocsToRender === undefined) {
    return <div>Story is not configured to generate asset docs.</div>;
  }

  const assetsToRender = assetDocsToRender.map((name) => {
    for (const xlrSource of defaultXLRSources) {
      for (const assetXLR of xlrSource.capabilities.Assets) {
        if (assetXLR.name === name) {
          return assetXLR;
        }
      }

      for (const viewXLR of xlrSource.capabilities.Views) {
        if (viewXLR.name === name) {
          return viewXLR;
        }
      }
    }
  });

  return (
    <div>
      {assetsToRender.map((assetXLR) =>
        assetDocsToRender === undefined ? null : (
          <XLRObjectDocs
            key={assetXLR.name}
            xlr={assetXLR}
            darkMode={Boolean(darkMode)}
          />
        )
      )}
    </div>
  );
}
