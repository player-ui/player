import type {
  Asset,
  BeforeTransformFunction,
  TransformFunctions,
} from "@player-ui/player";
import { v4 as uuid } from "uuid";
import { NodeType } from "@player-ui/player";
import { composeBefore } from "@player-ui/asset-transform-plugin";

/**
 * In beforeTransform function, pass in flatten marker and call beforeResolve function
 * input: asset
 * @param asset - Asset to apply the transform to
 * @returns - multi-node with async node placeholder
 *
 * example:
 * input:
 * {
  "asset": {
    "id": "some-text",
    "type": "continuous-text"
    "value": "Hello World!"
  }
}
* output:
* {
  "flatten": true,
  ...,
  "values": [
    { assetNode1 },
    { newAsyncNode }
  ]
}
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// export const transform: BeforeTransformFunction<Asset> = (asset) => {
//   // return asset;
//   const id = uuid();
//   // const flatten = asset.value.flatten ? asset.value.flatten : true;
//   console.log("chatmessage transform", asset);
//   const multiNode = {
//     type: NodeType.MultiNode,
//     flatten: true,
//     values: [
//       {
//         asset: {
//           ...asset.value,
//         },
//       },
//       // { ...asset.value },
//       {
//         id: id,
//         async: "true",
//       },
//     ],
//   };
//
//   // multiNode.values.forEach((value) => {
//   //   value.parent = multiNode;
//   // });
//   // console.log("multiNode", multiNode);
//   return {
//     ...asset,
//     value: multiNode,
//   };
// };

export const transform: BeforeTransformFunction<Asset> = (asset) => {
  // return asset;
  const id = uuid();
  // const flatten = asset.value.flatten ? asset.value.flatten : true;
  console.log("asset", asset);
  debugger;
  const multiNode = {
    type: NodeType.MultiNode,
    flatten: true,
    values: [
      {
        asset: {
          value: asset.value,
        },
      },
      {
        id: id,
        // type: NodeType.Async,
        async: "true",
      },
    ],
  };

  // multiNode.values.forEach((value) => {
  //   value.parent = multiNode;
  // });
  // console.log("multiNode", multiNode);
  return multiNode;
};

export const chatMessageTransform: TransformFunctions =
  composeBefore(transform);
