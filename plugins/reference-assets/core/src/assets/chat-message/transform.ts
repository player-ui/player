/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type {
  Asset,
  BeforeTransformFunction,
  TransformFunctions,
} from "@player-ui/player";
import { v4 as uuid } from "uuid";
import { NodeType, Builder, addChild } from "@player-ui/player";
import { composeBefore, compose } from "@player-ui/asset-transform-plugin";

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

// export const transform: BeforeTransformFunction<Asset> = (asset, options) => {
//   debugger;
//   const id = uuid();
//   // const flatten = asset.value.flatten ? asset.value.flatten : true;
//   console.log("chatmessage transform", asset);

//   const node1 = Builder.asset({ ...asset.value, type: "text" });
//   const asyncNode = {
//     id,
//     type: "async",
//     value: {
//       type: "value",
//       value: {
//         id,
//       },
//     },
//   };
//   const multiNode = Builder.multiNode(node1, asyncNode);
//   console.log("transformed asset", multiNode);
//   // 1. how multi-node got resolved and displayed in the player? they should be able to be displayed in the player
//   /**
//    * exports[`multi-node > multi-node collection 1`] = `
// {
//   "children": [
//     {
//       "path": [
//         "values",
//       ],
//       "value": {
//         "override": true,
//         "parent": [Circular],
//         "type": "multi-node",
//         "values": [
//    */
//   // 2. does Builder method works for adding multi-node? this is not the same as the multi-node in resolver
//   return multiNode;
// };
// export const transform: BeforeTransformFunction<Asset> = (asset, options) => {
//   const textAsset = Builder.asset({ ...asset.value, type: "text" });
//   // const actionAsset = Builder.asset({
//   //   id: "action1",
//   //   type: "action",
//   //   exp: "{{count}} = 100",
//   // });
//   const id = uuid();
//   const asyncNode = {
//     id,
//     type: "async",
//     value: {
//       id,
//       type: "value",
//       value: {
//         id,
//       },
//     },
//   };
//   // type is asset and it stops to parsing the collection values/// why? it should be
//   // const collectionAsset = Builder.asset({
//   //   id: "collection",
//   //   type: "collection",
//   //   values: [textAsset, asyncNode],
//   // });
//   // how to make value as multinode
//   // values: Builder.value(Builder.multiNode(textAsset, asyncNode)) makes multi-node as children
//   // const collectionAsset = {
//   //   id: "collection",
//   //   type: "collection",
//   //   values: Builder.multiNode(textAsset, asyncNode),
//   // };

//   // const collectionAsset = Builder.multiNode({
//   //   id: "collection",
//   //   type: "collection",
//   //   values: Builder.multiNode(textAsset, asyncNode),
//   // });

//   // const collectionAsset = Builder.multiNode(
//   //   Builder.multiNode(textAsset, asyncNode),
//   // );

//   // debugger;
//   // console.log("transformed asset", collectionAsset);

//   // change to use collection structure directly no builder function

//   const collectionAsset = {
//     override: true,
//     type: NodeType.MultiNode,
//     values: [{ children: [textAsset] }],
//   };
//   // , { children: [asyncNode] }
//   debugger;

//   return collectionAsset;
// };

export const transform: BeforeTransformFunction<Asset> = (asset, options) => {
  debugger;
  const id = uuid();

  const node1 = Builder.asset({ ...asset.value, type: "text" });
  const asyncNode = {
    id,
    type: "async",
    value: {
      type: "value",
      value: {
        id,
      },
    },
  };

  const multiNode = Builder.multiNode(node1, asyncNode);

  const collectionAsset = Builder.asset({
    id: "chat-collection",
    type: "collection",
  });

  Builder.addChild(collectionAsset, ["values"], multiNode);

  console.log("transformed asset", collectionAsset);
  return collectionAsset;
};

export const chatMessageTransform: TransformFunctions = compose(
  composeBefore(transform),
);
