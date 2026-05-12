import type { A2UISnapshot } from "@player-ui/player";

/**
 * Templated children: the adapter expands `children: { path, componentId }`
 * into a Player `template` block. The label component reads `{path: ""}` —
 * the per-item context — and the adapter rewrites that to `<scope>._index_`.
 */
const snapshot: A2UISnapshot = {
  surfaceId: "list-basic",
  dataModel: {
    items: ["Apples", "Oranges", "Pears", "Bananas"],
  },
  components: [
    {
      id: "root",
      component: "List",
      direction: "vertical",
      children: { path: "/items", componentId: "rowItem" },
    },
    {
      id: "rowItem",
      component: "Text",
      text: { path: "" },
    },
  ],
};

export default snapshot;
