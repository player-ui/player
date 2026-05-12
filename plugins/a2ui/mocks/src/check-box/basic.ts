import type { A2UISnapshot } from "@player-ui/player";

const snapshot: A2UISnapshot = {
  surfaceId: "check-box-basic",
  data: { prefs: { newsletter: false } },
  components: [
    {
      id: "root",
      component: "CheckBox",
      label: "Subscribe to the newsletter",
      value: { path: "/prefs/newsletter" },
    },
  ],
};

export default snapshot;
