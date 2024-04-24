import React from "react";
import { Image } from "@player-ui/reference-assets-plugin-components";
import type { DSLFlow } from "@player-tools/dsl";

const view1 = (
  <Image
    metaData={{
      ref: "https://player-ui.github.io/latest/logo/logo-light-large.png",
    }}
  >
    <Image.Caption>Image caption</Image.Caption>
  </Image>
);

const flow: DSLFlow = {
  id: "image-with-caption",
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
