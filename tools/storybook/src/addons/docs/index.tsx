import { API, useParameter } from "@storybook/manager-api";
import type { NamedType, NodeType, ObjectType } from "@player-tools/xlr";
import { isPrimitiveTypeNode } from "@player-tools/xlr-utils";
import React from "react";

interface DocsPanelProps {
  /** if the panel is actively shown to the user */
  active: boolean;

  /** Storybook API */
  api: API;
}

function XLRObjectDocs(props: { xlr: NamedType<ObjectType> }) {
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
              return (
                <tr key={propKey}>
                  <td>{propKey}</td>
                  <td>{propType.required ? <b>yes</b> : "no"}</td>
                  <td>
                    {propType.node.type === "ref"
                      ? propType.node.ref
                      : propType.node.type}
                  </td>
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
          <XLRObjectDocs key={assetXLR.name} xlr={assetXLR} />
        )
      )}
    </div>
  );
}
