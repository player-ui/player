import { useBeacon } from "@player-ui/beacon-plugin-react";
import type {
  TransformedChoice,
  TransformedChoiceItem,
} from "@player-ui/reference-assets-plugin";
import type { ChoiceItemProps } from "../../components/ChoiceItem";

/** Hook to get the props for all choice asset items */
export const useChoiceItems = (
  props: TransformedChoice,
): Array<ChoiceItemProps> => {
  const beacon = useBeacon({
    asset: props,
    action: "clicked",
    element: "choice",
  });

  return (
    props.items?.map((item: TransformedChoiceItem) => {
      const { id, value, label } = item;
      return {
        id,
        label,
        name: props.id,
        value: (value ?? "").toString(),
        checked: value === props.value,
        onChange: () => {
          beacon();
          item.select();
        },
      };
    }) ?? []
  );
};
