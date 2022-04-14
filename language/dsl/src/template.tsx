import React from 'react';
import type { ObjectNode, JsonNode } from 'react-json-reconciler';
import {
  ArrayNode,
  PropertyNode,
  ValueNode,
  createPortal,
  ProxyNode,
  toJSON,
} from 'react-json-reconciler';
import { OptionalIDSuffixProvider } from './auto-id';
import type { BindingTemplateInstance } from './string-templates';
import type { WithChildren } from './types';

export interface TemplateContextType {
  /** The number of nested templates */
  depth: number;
}

export const TemplateContext = React.createContext<TemplateContextType>({
  depth: 0,
});

export interface TemplateProps {
  /** The source binding */
  data: BindingTemplateInstance;

  /** The target property */
  output?: string;

  /** The template value */
  children: React.ReactNode;
}

/** Add a template instance to the object */
function addTemplateToObject(
  obj: ObjectNode,
  templateObj: ObjectNode,
  templateParentNodeType: string
): () => void {
  // find a template property
  // add one if none exists

  let templateProp = obj.properties.find(
    (p) => p.keyNode.value === 'template' && p.valueNode?.type === 'array'
  );

  if (!templateProp) {
    templateProp = new PropertyNode(new ValueNode('template'), new ArrayNode());
    templateProp.parent = obj;
    obj.properties.push(templateProp);
  }

  const templateItems = templateProp.valueNode as ArrayNode;

  templateItems.items.push(templateObj);
  // eslint-disable-next-line no-param-reassign
  templateObj.parent = templateItems;

  const templateParentProp = obj.properties.find(
    (p) =>
      p.keyNode.value === templateParentNodeType &&
      p.valueNode?.type === 'array'
  );

  if (templateParentProp) {
    const indexOfTemplateParent = obj.properties.indexOf(templateParentProp, 1);
    const templateParentValueNode =
      obj.properties[indexOfTemplateParent]?.valueNode;
    if (templateParentValueNode) {
      const templateParentArray = toJSON(templateParentValueNode);

      // Delete the parent of template if it is an empty array
      if (
        Array.isArray(templateParentArray) &&
        templateParentArray.length === 0
      ) {
        obj.properties.splice(indexOfTemplateParent, 1);
      }
    }
  }

  return () => {
    // Remove the template item from the list
    templateItems.items = templateItems.items.filter((t) => t !== templateObj);

    // Clean up the whole template if it's removed
    if (templateItems.children.length === 0 && templateProp) {
      obj.properties.splice(obj.properties.indexOf(templateProp, 1));
    }
  };
}

/** Context provider wrapper to handle nested templates */
const TemplateProvider = (props: WithChildren) => {
  const baseContext = React.useContext(TemplateContext);

  return (
    <TemplateContext.Provider value={{ depth: baseContext.depth + 1 }}>
      {props.children}
    </TemplateContext.Provider>
  );
};

/** Find the first object node in the tree */
const getParentObject = (node: JsonNode): ObjectNode | undefined => {
  if (node.type === 'object') {
    return node;
  }

  if (node.parent) {
    return getParentObject(node.parent);
  }
};

/** Find the property of the node on the parent */
const getParentProperty = (node: JsonNode): PropertyNode | undefined => {
  if (node.type === 'property') {
    return node;
  }

  if (node.parent) {
    return getParentProperty(node.parent);
  }
};

/** A template allows users to dynamically map over an array of data */
export const Template = (props: TemplateProps) => {
  const baseContext = React.useContext(TemplateContext);
  const [outputProp, setOutputProp] = React.useState<string | undefined>(
    props.output
  );
  const proxyRef = React.useRef<ProxyNode>(null);
  const valueRef = React.useRef<ValueNode>(null);
  const outputElement = React.useMemo(() => new ProxyNode(), []);

  React.useLayoutEffect(() => {
    // Get the output prop
    const propNode = proxyRef.current && getParentProperty(proxyRef.current);

    if (outputProp === undefined && propNode) {
      setOutputProp(propNode.keyNode.value);
    }
  }, [proxyRef, outputProp]);

  React.useEffect(() => {
    const templateObj = outputElement.items[0] as ObjectNode;
    if (proxyRef.current) {
      const parentObject = getParentObject(proxyRef.current);

      if (!parentObject) {
        throw new Error('Unable to find parent to add template to');
      }

      if (!outputProp) {
        return;
      }

      // remove the template when unmounted
      return addTemplateToObject(parentObject, templateObj, outputProp);
    }
  }, [proxyRef, outputProp, outputElement.items]);

  return (
    <proxy ref={proxyRef}>
      {createPortal(
        <OptionalIDSuffixProvider
          wrapperRef={valueRef}
          templateIndex={`_index${
            baseContext.depth === 0 ? '' : baseContext.depth
          }_`}
        >
          <TemplateProvider>
            <object>
              <property name="data">{props.data.toValue()}</property>
              <property name="output">{outputProp}</property>
              <property name="value">{props.children}</property>
            </object>
          </TemplateProvider>
        </OptionalIDSuffixProvider>,
        outputElement
      )}
      <value ref={valueRef} value={undefined} />
    </proxy>
  );
};
