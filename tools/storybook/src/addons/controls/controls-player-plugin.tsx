import React from "react";
import { ReactAsset } from "@player-ui/react";
import {
  TextAsset,
  TransformedInput,
} from "@player-ui/reference-assets-plugin";
import { Form, Span } from "@storybook/components";
import { AssetProviderPlugin } from "@player-ui/asset-provider-plugin-react";

const InputControlAsset = (props: TransformedInput) => {
  const [val, setVal] = React.useState(props.value);

  React.useEffect(() => {
    setVal(props.value);
  }, [props.value]);

  return (
    <Form.Field label={<ReactAsset {...props.label} />}>
      <Form.Input
        value={val}
        onPointerEnterCapture={() => {}}
        onPointerLeaveCapture={() => {}}
        onChange={(evt) => {
          setVal(evt.target.value);
        }}
        onBlur={(evt) => {
          props.set(evt.target.value);
        }}
      />
    </Form.Field>
  );
};

const TextControlAsset = (props: TextAsset) => {
  return <Span>{props.value}</Span>;
};

export const controlsAssetsPlugin = new AssetProviderPlugin([
  ["input", InputControlAsset],
  ["text", TextControlAsset],
]);
