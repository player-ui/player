import * as React from "react";
import { BASE_PREFIX, DOCS_BASE_URL } from "./constants";

interface VersionSelectorProps {
  route: string;
}

const useGetReleasedVersions = () => {
  const [releasedVersions, setReleasedVersions] = React.useState<
    {
      label: string;
      path: string;
    }[]
  >([]);

  React.useEffect(() => {
    const send = async () => {
      const response = await fetch(
        "https://api.github.com/repos/player-ui/player-ui.github.io/contents/",
      );

      const data = await response.json();
      const versions = data
        .filter((d: any) => d.type === "dir" && d.name.match(/^\d/))
        .map((d: any) => ({
          label: d.name,
          path: d.name,
        }));
      setReleasedVersions(versions);
    };

    send().catch(() => {});
  }, []);

  return releasedVersions;
};
const VersionSelector = (props: VersionSelectorProps) => {
  const location = props.route ?? "";
  const released = useGetReleasedVersions();

  return (
    <select
      aria-label="Select the version of the Player docs you with to see"
      value={BASE_PREFIX || "latest"}
      style={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
      onChange={(e) => {
        console.error("test");
        window.location.href = `${DOCS_BASE_URL}${e.target.value}/${location}`;
      }}
    >
      <option value="latest">Latest</option>
      <option value="next">Next</option>
      {released.map((r) => (
        <option key={r.label} value={r.path}>
          {r.label}
        </option>
      ))}
    </select>
  );
};

export default VersionSelector;
