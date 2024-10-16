import {
  FlowManager,
  CompletedState,
  Flow,
  FinalState,
} from "@player-ui/react";
import flow1 from "./flow-1.json";
import flow2 from "./flow-2.json";
import flow3 from "./flow-3.json";

const basicFlows = [flow1, flow2, flow3];

/** Simple function to delay by a set time */
const delay = (time: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

export function createStaticFlowManager(flows: Array<Flow>): FlowManager {
  return {
    next: async (previousResult?: CompletedState) => {
      if (!previousResult) {
        const firstFlow = flows[0] as Flow;
        return { done: false, value: firstFlow };
      }

      const prevIndex = flows.findIndex((v) => v.id === previousResult.flow.id);
      const nextIndex =
        prevIndex + (previousResult.endState.outcome === "back" ? -1 : 1);

      if (nextIndex < 0 || nextIndex >= flows.length) {
        return { done: true } as FinalState;
      }

      await delay(Math.random() * 500);

      const nextFlow = flows[nextIndex] as Flow;
      return { done: false, value: nextFlow };
    },
  };
}

export const basicFlowManager: FlowManager = createStaticFlowManager(
  basicFlows as Array<Flow>,
);
