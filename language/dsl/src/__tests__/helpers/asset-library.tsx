import React from 'react';
import type {
  Asset as AssetType,
  AssetWrapper,
  Binding,
  Expression,
} from '@player-ui/types';
import type { JsonNode, ValueType } from 'react-json-reconciler';
import {
  ArrayNode,
  ObjectNode,
  PropertyNode,
  ValueNode,
} from 'react-json-reconciler';
import { Asset, createSlot } from '../../components';
import type { AssetPropsWithChildren, WithChildren } from '../../types';
import type { BindingTemplateInstance } from '../../string-templates';

// #region - Asset Types

const ActionRoles = [
  'primary',
  'secondary',
  'tertiary',
  'upsell',
  'back',
  'link',
] as const;

export type ActionRole = typeof ActionRoles[number];

export interface TextAsset extends AssetType<'text'> {
  /** value of the text asset */
  value?: string;
}

export interface CollectionAsset extends AssetType<'collection'> {
  /** The collection items to show */
  values?: Array<AssetWrapper>;

  /** The additional information to  show */
  additionalInfo?: AssetWrapper;

  /** The result text to show */
  resultText?: AssetWrapper;

  /** The label defining the collection  */
  label?: AssetWrapper;

  /** Actions attached to the collection */
  actions?: Array<AssetWrapper<ActionAsset>>;
}

export interface ActionAsset extends AssetType<'action'> {
  /** The transition value of the action in the state machine */
  value?: string;

  /** A text-like asset for the action's label */
  label?: AssetWrapper;

  /** An optional expression to execute before transitioning */
  exp?: Expression;

  /** more data */
  metaData?: {
    /** Additional data to beacon */
    beacon?: string;

    /** A semantic hint to render the action in different user contexts */
    role?: ActionRole;

    /** Force transition to the next view without checking for validation TODO need to update this to support an expression */
    skipValidation?: boolean;

    /** Size of the button */
    size?: 'small' | 'medium' | 'large';

    /** true to indicate the button should be disabled */
    disabled?: boolean;
  };
}

export interface InputAsset extends AssetType<'input'> {
  /** The location in the data-model to store the data */
  binding: Binding;

  /** Placeholder text when there is no value */
  placeholder?: string;

  /** Asset container for a field label. */
  label?: AssetWrapper;

  /** More stuff to show under the field */
  note?: AssetWrapper;
}

export interface InfoAsset extends AssetType<'info'> {
  /** Top level title for the view. */
  title?: AssetWrapper;

  /** Displayed below the top level title, typically in smaller text with a different color. */
  subtitle?: AssetWrapper;

  /** Actions for navigating in between views. */
  actions?: Array<AssetWrapper>;

  /** Where the main content goes, this should be the body of the page. */
  primaryInfo?: AssetWrapper;

  /** Below the main content but above the actions, typically used for important links at the bottom of a view. */
  additionalInfo?: AssetWrapper;
}

export interface ArrayProp {
  /** A dummy id */
  id: string;
}
export interface AssetWithArrayProp extends AssetType<'assetWithArray'> {
  /** An array of stuff to mimic validations */
  stuff: ArrayProp[];
  /** Want to make sure this will accept a binding */
  optionalNumber?: number;

  /** and nest into other */
  metaData?: {
    /** more complicated types */
    optionalUnion?:
      | 'foo'
      | 'bar'
      | {
          /** including unions */
          other?: 'bar';
        };
  };
}

// #endregion

// #region - Components

/** Text asset */
export const Text = (props: AssetPropsWithChildren<TextAsset>) => {
  return (
    <Asset type="text" {...props}>
      <property name="value">{props.children}</property>
    </Asset>
  );
};

/** get the parent object of a node */
const getParentObject = (node: JsonNode): ObjectNode | undefined => {
  if (node.type === 'object') {
    return node;
  }

  if (!node.parent) {
    return;
  }

  return getParentObject(node.parent);
};

/** text modifier */
const TextModifier = (props: {
  /** value of modifier */
  value: string;

  /** type of modifier */
  type: string;

  /** the modifier content */
  children: React.ReactNode;
}) => {
  const ref = React.useRef<ValueNode<ValueType>>(null);

  const [modifierName, setModifierName] = React.useState<string>('M0');

  React.useEffect(() => {
    if (!ref.current) {
      return;
    }

    const objParent = getParentObject(ref.current);

    if (objParent?.type === 'object') {
      const existingModifierArray = objParent.properties.find(
        (p) => p.keyNode.value === 'modifiers' && p.valueNode?.type === 'array'
      );

      const newModifierLength = existingModifierArray
        ? (existingModifierArray.valueNode as ArrayNode)?.items.length
        : 0;

      const newModifierName = `M${newModifierLength}`;

      const modifierObject = new ObjectNode();
      modifierObject.properties.push(
        new PropertyNode(new ValueNode('value'), new ValueNode(props.value)),
        new PropertyNode(new ValueNode('type'), new ValueNode(props.type)),
        new PropertyNode(new ValueNode('name'), new ValueNode(newModifierName))
      );

      if (existingModifierArray) {
        (existingModifierArray.valueNode as ArrayNode)?.items.push(
          modifierObject
        );
      } else {
        const modifiers = new ArrayNode();
        modifiers.items.push(modifierObject);
        objParent.properties.push(
          new PropertyNode(new ValueNode('modifiers'), modifiers)
        );
      }

      setModifierName(newModifierName);
    }
  }, []);

  return (
    <value ref={ref}>
      {`[[${modifierName}]]`}
      {props.children}
      {`[[/${modifierName}]]`}
    </value>
  );
};

Text.Modifier = TextModifier;

/** collection asset */
export const Collection = (props: AssetPropsWithChildren<CollectionAsset>) => {
  return <Asset type="collection" {...props} />;
};

/** an asset to test setting keys on arrays  */
export const ArrayProp = (
  props: AssetPropsWithChildren<AssetWithArrayProp>
) => {
  return <Asset type="assetWithArray" {...props} />;
};

Collection.Values = createSlot({
  name: 'values',
  isArray: true,
  wrapInAsset: true,
  TextComp: Text,
});

Collection.Actions = createSlot({
  name: 'actions',
  isArray: true,
});

/** the factory for making a collection */
const CollectionComp = (props: WithChildren) => {
  return (
    <Collection>
      <Collection.Values>{props.children}</Collection.Values>
    </Collection>
  );
};

Collection.Label = createSlot({
  name: 'label',
  TextComp: Text,
  wrapInAsset: true,
  CollectionComp,
});

/** input asset */
export const Input = (
  props: Omit<AssetPropsWithChildren<InputAsset>, 'binding'> & {
    /** A binding type */
    binding?: BindingTemplateInstance;
  }
) => {
  const { binding, children, ...rest } = props;

  return (
    <Asset type="input" {...rest}>
      <property name="binding">{binding?.toValue()}</property>
      {children}
    </Asset>
  );
};

Input.Label = createSlot<{
  /** Some thing not in the asset  */
  customLabelProp?: string;
}>({
  name: 'label',
  TextComp: Text,
  wrapInAsset: true,
  CollectionComp,
});

// #endregion - Components
