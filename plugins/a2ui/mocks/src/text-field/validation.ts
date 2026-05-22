import type { A2UISnapshot } from "@player-ui/a2ui-plugin";

const snapshot: A2UISnapshot = {
  surfaceId: "text-field-validation",
  data: { user: { email: "" } },
  components: [
    {
      id: "root",
      component: "TextField",
      label: "Email",
      value: { path: "/user/email" },
      textFieldType: "shortText",
      validationRegexp: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$",
    },
  ],
};

export default snapshot;
