import React from "react";
import type {
  WithChildren,
  AssetPropsWithChildren,
  BindingTemplateInstance,
  ExpressionTemplateInstance,
  DSLSchema as PlayerDSLSchema,
  DataTypeReference,
  DataTypeRefs,
  ValidatorFunctionRefs,
  WithPlayerTypes,
} from "@player-tools/dsl";
import {
  createSlot,
  Asset,
  View,
  getObjectReferences,
  toJsonProperties,
  ObjectWithIndexTracking,
  GeneratedIDProperty,
  toJsonElement,
} from "@player-tools/dsl";
import type { Asset as AssetType } from "@player-ui/player";
import type {
  ActionAsset,
  TextAsset,
  CollectionAsset,
  InfoAsset,
  InputAsset,
  ImageAsset,
  ChoiceAsset,
  ChoiceItem as ChoiceItemType,
  ChatMessageAsset,
  ThrowingAsset,
} from "@player-ui/reference-assets-plugin";
import { dataTypes, validators } from "@player-ui/common-types-plugin";

export const dataRefs = getObjectReferences<
  typeof dataTypes,
  DataTypeRefs<typeof dataTypes>
>(dataTypes);

export const validationRefs = getObjectReferences<
  typeof validators,
  ValidatorFunctionRefs<typeof validators>
>(validators);

export type DSLSchema = PlayerDSLSchema<
  DataTypeReference<typeof dataTypes, ValidatorFunctionRefs<typeof validators>>
>;

export const Text = (
  props: Omit<AssetPropsWithChildren<TextAsset>, "value"> & {
    value?: string;
  },
) => {
  return (
    <Asset type="text" {...props}>
      <property name="value">{props.children}</property>
    </Asset>
  );
};

export const Collection = (props: AssetPropsWithChildren<CollectionAsset>) => {
  return <Asset type="collection" {...props} />;
};

const CollectionComp = (props: AssetPropsWithChildren<AssetType>) => {
  return (
    <Collection>
      <Collection.Values>{props.children}</Collection.Values>
    </Collection>
  );
};

/** A utility for quickly creating named slots using the text and collection factories */
const slotFactory = (name: string, isArray = false, wrapInAsset = true) =>
  createSlot({
    name,
    TextComp: Text,
    CollectionComp,
    isArray,
    wrapInAsset,
  });

export const LabelSlot = slotFactory("label");
export const ValueSlot = slotFactory("value");
export const TitleSlot = slotFactory("title");
export const NoteSlot = slotFactory("note");
export const SubtitleSlot = slotFactory("subtitle");
export const ActionsSlot = slotFactory("actions", true);
export const PrimaryInfoSlot = slotFactory("primaryInfo");
export const ItemsSlot = slotFactory("items", true, false);

Collection.Values = createSlot({
  name: "values",
  isArray: true,
  TextComp: Text,
  wrapInAsset: true,
});

Collection.Label = LabelSlot;

export const Action = (
  props: Omit<AssetPropsWithChildren<ActionAsset>, "exp"> & {
    /** An optional expression to execute before transitioning */
    exp?: ExpressionTemplateInstance | Array<ExpressionTemplateInstance>;
  },
) => {
  const { exp, children, ...rest } = props;

  return (
    <Asset type="action" {...rest}>
      <property name="exp">
        {Array.isArray(exp)
          ? toJsonElement(exp.map((e) => e.toValue()))
          : exp?.toValue()}
      </property>
      {children}
    </Asset>
  );
};

Action.Label = LabelSlot;

export const Image = (props: AssetPropsWithChildren<ImageAsset>) => {
  return <Asset type="image" {...props} />;
};

Image.Caption = slotFactory("caption");

export const Input = (
  props: Omit<AssetPropsWithChildren<InputAsset>, "binding"> & {
    /** The binding */
    binding: BindingTemplateInstance;
  },
) => {
  const { binding, children, ...rest } = props;
  return (
    <Asset type="input" {...rest}>
      <property name="binding">{binding.toValue()}</property>
      {children}
    </Asset>
  );
};

Input.Label = LabelSlot;
Input.Note = NoteSlot;

export const Info = (props: AssetPropsWithChildren<InfoAsset>) => {
  return <View type="info" {...props} />;
};

Info.Title = TitleSlot;
Info.Subtitle = SubtitleSlot;
Info.PrimaryInfo = PrimaryInfoSlot;
Info.Actions = ActionsSlot;
Info.Footer = slotFactory("footer");

export const Choice = (
  props: Omit<AssetPropsWithChildren<ChoiceAsset>, "binding"> & {
    /** The binding */
    binding: BindingTemplateInstance;
  },
) => {
  const { binding, children, ...rest } = props;
  return (
    <Asset type="choice" {...rest}>
      <property name="binding">{binding.toValue()}</property>
      {children}
    </Asset>
  );
};

Choice.Title = TitleSlot;
Choice.Note = NoteSlot;
Choice.Items = ItemsSlot;

const ChoiceItem = (
  props: WithChildren<
    WithPlayerTypes<
      Omit<ChoiceItemType, "id"> & {
        id?: string;
      }
    >
  >,
) => {
  const { children, id, ...rest } = props;

  return (
    <ObjectWithIndexTracking>
      {id && (
        <property name="id">
          <value>{id}</value>
        </property>
      )}
      {!id && <GeneratedIDProperty />}
      {toJsonProperties(rest, { propertiesToSkip: ["applicability"] })}
      {children}
    </ObjectWithIndexTracking>
  );
};

ChoiceItem.Label = LabelSlot;
Choice.Item = ChoiceItem;

export const ChatMessage = (
  props: Omit<AssetPropsWithChildren<ChatMessageAsset>, "id"> & {
    id: string;
  },
) => {
  const { id, children } = props;
  return (
    <Asset type="chat-message">
      <property name="id">{id}</property>
      {children}
    </Asset>
  );
};

ChatMessage.Value = ValueSlot;

export const Throwing = (
  props: AssetPropsWithChildren<ThrowingAsset>,
): React.ReactElement => {
  return <Asset type="throwing" {...props} />;
};
