import type { A2UISnapshot } from "@player-ui/player";

const snapshot: A2UISnapshot = {
  surfaceId: "date-time-input-basic",
  dataModel: { event: { startsAt: "" } },
  components: [
    {
      id: "root",
      component: "DateTimeInput",
      value: { path: "/event/startsAt" },
      enableDate: true,
      enableTime: true,
    },
  ],
};

export default snapshot;
