import React from "react";
import {
  Input,
  Info,
  Action,
} from "@player-ui/reference-assets-plugin-components";
import { binding as b } from "@player-tools/dsl";
import type { DSLFlow } from "@player-tools/dsl";

const schema = {
  foo: {
    bar: {
      type: "IntegerPosType",
      validation: [
        {
          type: "required",
        },
      ],
    },
  },
};

const view1 = (
  <Info id="input-validation">
    <Info.Title>Some validations can prevent users from advancing</Info.Title>
    <Info.PrimaryInfo>
      <Input id="input" binding={b`foo.bar`}>
        <Input.Label>Input with validation and formatting</Input.Label>
        <Input.Note>It expects a positive integer</Input.Note>
      </Input>
    </Info.PrimaryInfo>
    <Info.Actions>
      <Action value="Next">
        <Action.Label>Continue</Action.Label>
      </Action>
    </Info.Actions>
  </Info>
);

const flow: DSLFlow = {
  id: "input-transition",
  views: [view1],
  schema,
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
