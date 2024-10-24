import React from "react";
import { SuspenseSpinner } from "@player-ui/storybook";
import { Meta, StoryObj } from "@storybook/react";
import { ManagedPlayer } from "@player-ui/react";
import { ReferenceAssetsPlugin } from "@player-ui/reference-assets-plugin-react";
import { AsyncNodePlugin, AsyncNodePluginPlugin } from '@player-ui/async-node-plugin';
import { ExpressionPlugin } from '@player-ui/expression-plugin';
import {
  createFlowManager,
  SIMPLE_FLOWS,
  ERROR_CONTENT_FLOW,
  ERROR_ASSET_FLOW,
} from "./flows/managed";

import OpenAI from "openai";
import { Node, Binding,  ExpressionHandler, ExpressionContext } from "@player-ui/player";

const meta: Meta = {
  title: "React Player/Managed Player",
};

const asyncNodePlugin = new AsyncNodePlugin({
  plugins: [new AsyncNodePluginPlugin()],
});


let deferredResolve: ((value: any) => void) | undefined;

let updateContent: any;

asyncNodePlugin.hooks.onAsyncNode.tap(
  "test",
  async (node: Node.Async, update: (content: any) => void) => {
    const result = new Promise((resolve) => {
      deferredResolve = resolve; // Promise would be resolved only once
    });

    updateContent = update;
    // Return the result to follow the same mechanism as before
    return result;
  },
);


const openai =  new OpenAI({ apiKey: 'org-wqC3iEyD0sgilao4w5U7mYq6', dangerouslyAllowBrowser: true })

async function main(input: string) {
  console.log("main function ")
  const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Say this is a test" }],
      stream: false,
  });

  return stream.choices[0]?.message.content


}


const createAsset = (data: string) => {
  console.log(data)
  console.log("creating new asset")
return {
  asset: {
    id: "next-label-action",
    type: "text",
    value: data,
  }
}
};

/** ExpressionHandler to handle flattening arrays by aliasing */
const flattenFunction: ExpressionHandler<[Binding, Binding]> = (
context
) => {

main("Say this is a test").then(res => {

  deferredResolve && deferredResolve(createAsset(res ?? ""));
});
};


const customExpressionHandler: ExpressionHandler = (ctx: ExpressionContext) => {
  
main("Say this is a test").then(res => {

  deferredResolve && deferredResolve(createAsset(res ?? ""));
});
}


// const expressionPlugin = new ExpressionPlugin([['requestOpenAI', customExpressionHandler]])

const expPlugin = new ExpressionPlugin(
  new Map([
    [
      "requestOpenAI",
      (ctx, arg1) => {

        console.log("expression handler called")
        main("Say this is a test").then(res => {
  deferredResolve && deferredResolve(createAsset(res ?? ""));
});
      },
    ],
  ]),
)

/*flowManager.hooks.expressionEvaluator.tap("name", (expressionEvaluator) => {
  expressionEvaluator.addExpressionFunction('requestOpenAI', flattenFunction);
  
  
  const conditional =
    expressionEvaluator.operators.expressions.get('conditional');
  if (conditional) conditional.resolveParams = false;
  }); */

export default meta;
export const SimpleFlow: StoryObj = {
  
  render: () => {
    return (
      <SuspenseSpinner>
        <ManagedPlayer
        
        plugins={[new ReferenceAssetsPlugin(), asyncNodePlugin, expPlugin]}
        manager={createFlowManager(SIMPLE_FLOWS)}
        />
      </SuspenseSpinner>
    );
  },
};

export const ContentErrorHandling: StoryObj = {
  render: () => {
    return (
      <SuspenseSpinner>
        <ManagedPlayer
          plugins={[new ReferenceAssetsPlugin()]}
          manager={createFlowManager(ERROR_CONTENT_FLOW)}
        />
      </SuspenseSpinner>
    );
  },
};

export const AssetErrorHandling: StoryObj = {
  render: () => {
    return (
      <SuspenseSpinner>
        <ManagedPlayer
          plugins={[new ReferenceAssetsPlugin()]}
          manager={createFlowManager(ERROR_ASSET_FLOW)}
        />
      </SuspenseSpinner>
    );
  },
};
