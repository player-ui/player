import type { A2UISnapshot } from "@player-ui/player";

const snapshot: A2UISnapshot = {
  surfaceId: "text-field-validation",
  dataModel: { user: { email: "" } },
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
