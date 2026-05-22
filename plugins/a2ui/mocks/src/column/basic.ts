import type { A2UISnapshot } from "@player-ui/a2ui-plugin";

const snapshot: A2UISnapshot = {
  surfaceId: "column-basic",
  components: [
    {
      id: "root",
      component: "Column",
      children: ["a", "b", "c"],
      align: "start",
    },
    { id: "a", component: "Text", text: "First", variant: "h3" },
    { id: "b", component: "Text", text: "Second" },
    { id: "c", component: "Text", text: "Third" },
  ],
};

export default snapshot;
