import type { A2UISnapshot } from "@player-ui/a2ui-plugin";

const snapshot: A2UISnapshot = {
  surfaceId: "slider-basic",
  data: { settings: { volume: 50 } },
  components: [
    {
      id: "root",
      component: "Slider",
      value: { path: "/settings/volume" },
      minValue: 0,
      maxValue: 100,
      accessibility: "Volume",
    },
  ],
};

export default snapshot;
