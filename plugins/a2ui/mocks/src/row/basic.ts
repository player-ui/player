import type { A2UISnapshot } from "@player-ui/player";

const snapshot: A2UISnapshot = {
  surfaceId: "row-basic",
  components: [
    {
      id: "root",
      component: "Row",
      children: ["t1", "t2", "t3"],
      justify: "spaceBetween",
    },
    { id: "t1", component: "Text", text: "Left" },
    { id: "t2", component: "Text", text: "Middle" },
    { id: "t3", component: "Text", text: "Right" },
  ],
};

export default snapshot;
