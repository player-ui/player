import type { A2UISnapshot } from "@player-ui/a2ui-plugin";

const snapshot: A2UISnapshot = {
  surfaceId: "divider-basic",
  components: [
    {
      id: "root",
      component: "Column",
      children: ["top", "div", "bottom"],
    },
    { id: "top", component: "Text", text: "Above" },
    { id: "div", component: "Divider", axis: "horizontal" },
    { id: "bottom", component: "Text", text: "Below" },
  ],
};

export default snapshot;
