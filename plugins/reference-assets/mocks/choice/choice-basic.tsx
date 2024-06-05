import React from "react";
import { Choice } from "@player-ui/reference-assets-plugin-components";
import { binding as b } from "@player-tools/dsl";
import type { DSLFlow } from "@player-tools/dsl";

const view1 = (
  <Choice id="choice" binding={b`foo.bar`}>
    <Choice.Title>This is a list of choices</Choice.Title>
    <Choice.Note>This is a note</Choice.Note>
    <Choice.Items>
      <Choice.Item id="item-1" value="Item 1">
        <Choice.Item.Label>Item 1</Choice.Item.Label>
      </Choice.Item>
      <Choice.Item id="item-2" value="Item 2">
        <Choice.Item.Label>Item 2</Choice.Item.Label>
      </Choice.Item>
      <Choice.Item id="item-3" value="Item 3">
        <Choice.Item.Label>Item 3</Choice.Item.Label>
      </Choice.Item>
    </Choice.Items>
  </Choice>
);

const flow: DSLFlow = {
  id: "choice-basic",
  views: [view1],
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: view1,
        transitions: {
          "*": "END_Done",
        },
      },
      END_Done: {
        state_type: "END",
        outcome: "DONE",
      },
    },
  },
};

export default flow;
