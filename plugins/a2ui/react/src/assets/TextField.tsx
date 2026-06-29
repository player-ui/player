import React from "react";
import type {
  TextFieldType,
  TransformedTextField,
} from "@player-ui/a2ui-plugin";
import { InputComp } from "../components/Input";
import { Label } from "../components/Label";
import { cn, commonProps } from "../utils";

const htmlTypeFor: Record<TextFieldType, string> = {
  shortText: "text",
  longText: "text", // handled separately via textarea
  number: "number",
  obscured: "password",
  date: "date",
};

export const TextField = (props: TransformedTextField) => {
  const {
    id,
    label,
    currentValue,
    set,
    textFieldType = "shortText",
    validationRegexp,
    validation,
  } = props;

  const [local, setLocal] = React.useState<string>(currentValue ?? "");
  React.useEffect(() => {
    setLocal(currentValue ?? "");
  }, [currentValue]);

  const regex = React.useMemo(
    () => (validationRegexp ? new RegExp(validationRegexp) : undefined),
    [validationRegexp],
  );
  const [regexError, setRegexError] = React.useState(false);

  function commit(next: string) {
    if (regex) setRegexError(!regex.test(next));
    set(next);
  }

  const error = validation?.message || (regexError ? "Invalid value" : "");

  const common = {
    id,
    value: local,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${id}-validation` : undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setLocal(e.target.value),
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      commit(e.target.value),
  };

  return (
    <div
      className="player-grid player-w-full player-max-w-sm player-items-center player-gap-1.5"
      {...commonProps(props)}
    >
      {label && <Label htmlFor={id}>{label}</Label>}
      {textFieldType === "longText" ? (
        <textarea
          {...common}
          className={cn(
            "player-flex player-min-h-[60px] player-w-full player-rounded-md player-border player-border-input player-bg-transparent player-px-3 player-py-2 player-text-sm player-shadow-sm",
          )}
        />
      ) : (
        <InputComp {...common} type={htmlTypeFor[textFieldType] ?? "text"} />
      )}
      {error && (
        <Label
          id={`${id}-validation`}
          className="player-text-[0.8rem] player-font-medium player-text-destructive"
        >
          {error}
        </Label>
      )}
    </div>
  );
};
