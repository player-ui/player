import type { A2UISnapshot } from "@player-ui/a2ui-plugin";

const snapshot: A2UISnapshot = {
  surfaceId: "text-field-basic",
  data: { user: { name: "" } },
  components: [
    {
      id: "root",
      component: "TextField",
      label: "Your name",
      value: { path: "/user/name" },
      textFieldType: "shortText",
    },
  ],
};

export default snapshot;
