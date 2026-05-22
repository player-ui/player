import type { A2UISnapshot } from "@player-ui/a2ui-plugin";

const snapshot: A2UISnapshot = {
  surfaceId: "icon-basic",
  components: [
    {
      id: "root",
      component: "Row",
      children: ["i1", "i2", "i3", "i4"],
    },
    { id: "i1", component: "Icon", name: "check", accessibility: "Check" },
    { id: "i2", component: "Icon", name: "x", accessibility: "Close" },
    { id: "i3", component: "Icon", name: "search", accessibility: "Search" },
    { id: "i4", component: "Icon", name: "user", accessibility: "User" },
  ],
};

export default snapshot;
