import React from 'react';
import type {
  AssetPropsWithChildren,
  BindingTemplateInstance,
} from '@player-tools/dsl';
import { createSlot, Asset } from '@player-tools/dsl';
import type { Asset as AssetType } from '@player-ui/player';
import type {
  ActionAsset,
  TextAsset,
  CollectionAsset,
  InfoAsset,
  InputAsset,
  ChoiceAsset
} from '@player-ui/reference-assets-plugin';

export const Text = (
  props: Omit<AssetPropsWithChildren<TextAsset>, 'value'> & {
    value?: string;
  }
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
const slotFactory = (name: string, isArray = false) =>
  createSlot({
    name,
    TextComp: Text,
    CollectionComp,
    isArray,
    wrapInAsset: true,
  });

export const LabelSlot = slotFactory('label');
export const ValueSlot = slotFactory('value');
export const TitleSlot = slotFactory('title');
export const SubtitleSlot = slotFactory('subtitle');
export const NoteSlot = slotFactory('note');
export const ActionsSlot = slotFactory('actions', true);
export const PrimaryInfoSlot = slotFactory('primaryInfo');
export const ChoicesSlot = slotFactory('choices', true);

Collection.Values = createSlot({
  name: 'values',
  isArray: true,
  TextComp: Text,
  wrapInAsset: true,
});

Collection.Label = LabelSlot;

export const Action = (props: AssetPropsWithChildren<ActionAsset>) => {
  return <Asset type="action" {...props} />;
};

Action.Label = LabelSlot;

export const Input = (
  props: Omit<AssetPropsWithChildren<InputAsset>, 'binding'> & {
    /** The binding */
    binding: BindingTemplateInstance;
  }
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

export const Info = (props: AssetPropsWithChildren<InfoAsset>) => {
  return <Asset type="info" {...props} />;
};

Info.Title = TitleSlot;
Info.Subtitle = SubtitleSlot;
Info.PrimaryInfo = PrimaryInfoSlot;
Info.Actions = ActionsSlot;

export const Choice = (
  props: Omit<AssetPropsWithChildren<ChoiceAsset>, 'binding'> & {
    /** The binding */
    binding: BindingTemplateInstance;
  }
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
Choice.Choices = ChoicesSlot;

export const ChoicesEntry = (

) => {
  
}