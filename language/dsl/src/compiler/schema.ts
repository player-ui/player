import type { Schema, Language } from '@player-ui/types';
import signale from 'signale';
import { dequal } from 'dequal';
import { SyncWaterfallHook } from 'tapable-ts';
import { binding as b } from '..';
import type { BindingTemplateInstance } from '../string-templates';

const bindingSymbol = Symbol('binding');

export const SchemaTypeName = Symbol('Schema Rename');

interface SchemaChildren {
  /** Object property that will be used to create the intermediate type */
  name: string;

  /** Object properties children that will be parsed */
  child: object;
}

type SchemaNode = (Schema.DataType | Language.DataTypeRef) & {
  /** Overwrite the name of the generated type */
  [SchemaTypeName]?: string;
};

/**
 * Type Guard for the `Schema.DataType` and `Language.DataTypeRef` type
 * A bit hacky but since `Schema.Schema` must have a `Schema.DataType` as
 * the final product we have to call it that even if it is a `Language.DataTypeRef`
 */
const isTypeDef = (property: SchemaNode): property is Schema.DataType => {
  return (property as Schema.DataType).type !== undefined;
};

/**
 * Generator for `Schema.Schema` Objects
 */
export class SchemaGenerator {
  private children: Array<SchemaChildren>;
  private generatedDataTypeNames: Map<string, SchemaNode>;

  public hooks = {
    createSchemaNode: new SyncWaterfallHook<
      [
        node: Schema.DataType,
        originalProperty: Record<string | symbol, unknown>
      ]
    >(),
  };

  constructor() {
    this.children = [];
    this.generatedDataTypeNames = new Map();
  }

  /**
   * Converts an object to a `Schema.Schema` representation
   * Note: uses iteration to prevent potentially very deep recursion on large objects
   */
  public toSchema = (schema: any): Schema.Schema => {
    const newSchema: Schema.Schema = {
      ROOT: {},
    };

    this.children = [];
    this.generatedDataTypeNames.clear();

    Object.keys(schema).forEach((property) => {
      const subType = schema[property] as SchemaNode;
      const subTypeName: string = subType[SchemaTypeName] ?? property;
      newSchema.ROOT[property] = this.hooks.createSchemaNode.call(
        this.processChildren(subTypeName, subType),
        subType as any
      );
    });

    while (this.children.length > 0) {
      const c = this.children.pop();
      if (c === undefined) {
        break;
      }

      const { name, child } = c;
      const typeDef = {} as any;

      Object.keys(child).forEach((property) => {
        const subType = (child as any)[property] as SchemaNode;
        const subTypeName: string = subType[SchemaTypeName] ?? property;
        typeDef[property] = this.hooks.createSchemaNode.call(
          this.processChildren(subTypeName, subType),
          subType as any
        );
      });
      newSchema[name] = typeDef;
    }

    return newSchema;
  };

  /**
   * Processes the children of an object Node
   * Newly discovered children get added to the provided array
   */
  private processChildren(
    property: string,
    subType: SchemaNode
  ): Schema.DataType {
    if (isTypeDef(subType)) {
      return subType;
    }

    let intermediateType;

    if (Array.isArray(subType)) {
      if (subType.length > 1) {
        signale.warn(
          `Type ${property} has multiple types in array, should only contain one top level object type. Only taking first defined type`
        );
      }

      intermediateType = this.makePlaceholderArrayType(property);
      this.children.push({ name: intermediateType.type, child: subType[0] });
    } else {
      intermediateType = this.makePlaceholderType(property);
      this.children.push({ name: intermediateType.type, child: subType });
    }

    if (this.generatedDataTypeNames.has(intermediateType.type)) {
      if (
        !dequal(
          subType,
          this.generatedDataTypeNames.get(intermediateType.type) as object
        )
      ) {
        throw new Error(
          `Error: Generated two intermediate types with the name: ${intermediateType.type} that are of different shapes`
        );
      }

      // remove last added type since we don't need to reprocess it
      this.children.pop();
    }

    this.generatedDataTypeNames.set(intermediateType.type, subType);
    return intermediateType;
  }

  /**
   * Make an intermediate `Schema.DataType` object given a name
   */
  private makePlaceholderType = (typeName: string): Schema.DataType => {
    return {
      type: `${typeName}Type`,
    };
  };

  /**
   * Make an intermediate `Schema.DataType` object with array support given a name
   */
  private makePlaceholderArrayType(typeName: string): Schema.DataType {
    return {
      type: `${typeName}Type`,
      isArray: true,
    };
  }
}

export type MakeArrayIntoIndexRef<T extends any[]> = {
  [key: number]: MakeBindingRefable<T[0]>;
  /** Used when referencing bindings from within a template */
  _index_: MakeBindingRefable<T[0]>;
} & BindingTemplateInstance;

export type MakeBindingRefable<T> = {
  [P in keyof T]: T[P] extends any[]
    ? MakeArrayIntoIndexRef<T[P]>
    : MakeBindingRefable<T[P]>;
} & BindingTemplateInstance;

/**
 * Adds bindings to an object so that the object can be directly used in JSX
 */
export function makeBindingsForObject<Type>(
  obj: Type,
  arrayAccessorKeys = ['_index_']
): MakeBindingRefable<Type> {
  /** Proxy to track binding callbacks */
  const accessor = (paths: string[]) => {
    const bindingMap = new WeakMap<any, BindingTemplateInstance>();

    return {
      ownKeys(target: any) {
        return Reflect.ownKeys(target);
      },

      get(target: any, key: any): any {
        const bindingKeys = Object.keys(target);

        if (!bindingMap.has(target)) {
          bindingMap.set(target, b`${paths.join('.')}`);
        }

        if (key === bindingSymbol) {
          return paths;
        }

        if (
          Array.isArray(target) &&
          (arrayAccessorKeys.includes(key) || typeof key === 'number')
        ) {
          return new Proxy(target[0], accessor(paths.concat([key])));
        }

        if (bindingKeys.includes(key) && typeof target[key] === 'object') {
          return new Proxy(target[key], accessor(paths.concat([key])));
        }

        const createdInstance = bindingMap.get(target) as any;
        return createdInstance?.[key];
      },
    };
  };

  return new Proxy(obj, accessor([])) as MakeBindingRefable<Type>;
}

/**
 * Generates binding for an object property
 */
export const getBindingFromObject = (obj: any) => {
  const baseBindings = obj[bindingSymbol] as string[];
  if (!Array.isArray(baseBindings) || baseBindings.length === 0) {
    throw new Error(`Unable to get binding for ${obj}`);
  }

  return b`${baseBindings.join('.')}`;
};

/**
 * Returns the binding string from an object path
 */
export const getBindingStringFromObject = (obj: any) => {
  return getBindingFromObject(obj).toString();
};

/**
 * Returns the ref string from an object path
 */
export const getRefStringFromObject = (obj: any) => {
  return getBindingFromObject(obj).toRefString();
};
