import type { A2UISnapshot } from "@player-ui/player";

const snapshot: A2UISnapshot = {
  surfaceId: "slider-basic",
  dataModel: { settings: { volume: 50 } },
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
