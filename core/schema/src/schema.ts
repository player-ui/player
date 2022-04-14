import { SyncWaterfallHook } from 'tapable';
import type { BindingInstance } from '@player-ui/binding';
import type { Schema as SchemaType, Formatting } from '@player-ui/types';
import type {
  ValidationProvider,
  ValidationObject,
} from '@player-ui/validator';
import type { FormatDefinition, FormatOptions, FormatType } from './types';

/** A function that returns itself */
const identify = (val: any) => val;

/** Expand the authored schema into a set of paths -> DataTypes */
export function parse(
  schema: SchemaType.Schema
): Map<string, SchemaType.DataType> {
  const expandedPaths = new Map<string, SchemaType.DataType>();

  if (!schema.ROOT) {
    return expandedPaths;
  }

  const parseQueue: Array<{
    /** The node to process */
    node: SchemaType.Node;

    /** The path in the data-model this node represents */
    path: Array<string>;

    /** A set of visited DataTypes to prevent loops */
    visited: Set<string>;
  }> = [{ node: schema.ROOT, path: [], visited: new Set() }];

  while (parseQueue.length > 0) {
    const next = parseQueue.shift();

    if (!next) {
      break;
    }

    const { node, path, visited } = next;

    Object.entries(node).forEach(([prop, type]) => {
      const nestedPath = [...path, prop];

      const nestedPathStr = nestedPath.join('.');

      if (expandedPaths.has(nestedPathStr)) {
        // We've gone in a loop. Panic
        throw new Error(
          "Path has already been processed. There's either a loop somewhere or a bug"
        );
      }

      if (visited.has(type.type)) {
        throw new Error(
          `Path already contained type: ${type.type}. This likely indicates a loop in the schema`
        );
      }

      expandedPaths.set(nestedPathStr, type);

      if (type.isArray) {
        nestedPath.push('[]');
      }

      if (type.type && schema[type.type]) {
        parseQueue.push({
          path: nestedPath,
          node: schema[type.type],
          visited: new Set([...visited, type.type]),
        });
      }
    });
  }

  return expandedPaths;
}

/**
 * The Schema is the central hub for all data invariants, and metaData associated with the data-model itself
 * Outside of the types defined in the JSON payload, it doesn't manage or keep any state.
 * It simply servers as an orchestrator for other modules to interface w/ the schema.
 */
export class SchemaController implements ValidationProvider {
  private formatters: Map<string, FormatType<any, any, FormatOptions>> =
    new Map();

  private types: Map<string, SchemaType.DataType<any>> = new Map();
  private schema: Map<string, SchemaType.DataType> = new Map();

  private bindingSchemaNormalizedCache: Map<BindingInstance, string> =
    new Map();

  public readonly hooks = {
    resolveTypeForBinding: new SyncWaterfallHook<
      SchemaType.DataType | undefined,
      BindingInstance
    >(['dataType', 'binding']),
  };

  constructor(schema?: SchemaType.Schema) {
    this.schema = schema ? parse(schema) : new Map();
  }

  public addFormatters(fns: Array<FormatType<any, any, FormatOptions>>) {
    fns.forEach((def) => {
      this.formatters.set(def.name, def);
    });
  }

  public addDataTypes(types: Array<SchemaType.DataType<any>>) {
    types.forEach((t) => {
      this.types.set(t.type, t);
    });
  }

  getValidationsForBinding(
    binding: BindingInstance
  ): Array<ValidationObject> | undefined {
    const typeDef = this.getApparentType(binding);

    if (!typeDef?.validation?.length) {
      return undefined;
    }

    // Set the defaults for schema-level validations
    return typeDef.validation.map((vRef) => ({
      severity: 'error',
      trigger: 'change',
      ...vRef,
    }));
  }

  private normalizeBinding(binding: BindingInstance): string {
    const cached = this.bindingSchemaNormalizedCache.get(binding);
    if (cached) {
      return cached;
    }

    const normalized = binding
      .asArray()
      .map((p) => (typeof p === 'number' ? '[]' : p))
      .join('.');

    this.bindingSchemaNormalizedCache.set(binding, normalized);

    return normalized;
  }

  public getType(binding: BindingInstance): SchemaType.DataType | undefined {
    return this.hooks.resolveTypeForBinding.call(
      this.schema.get(this.normalizeBinding(binding)),
      binding
    );
  }

  public getApparentType(
    binding: BindingInstance
  ): SchemaType.DataType | undefined {
    const schemaType = this.getType(binding);

    if (schemaType === undefined) {
      return undefined;
    }

    const baseType = this.getTypeDefinition(schemaType?.type);

    if (baseType === undefined) {
      return schemaType;
    }

    return {
      ...baseType,
      ...schemaType,
      validation: [
        ...(schemaType.validation ?? []),
        ...(baseType.validation ?? []),
      ],
    };
  }

  public getTypeDefinition(dataType: string) {
    return this.types.get(dataType);
  }

  public getFormatterForType(
    formatReference: Formatting.Reference
  ): FormatDefinition<unknown, unknown> | undefined {
    const { type: formatType, ...options } = formatReference;

    const formatter = this.formatters.get(formatType);

    if (!formatter) {
      return;
    }

    return {
      format: formatter.format
        ? (val) => formatter.format?.(val, options)
        : identify,
      deformat: formatter.deformat
        ? (val) => formatter.deformat?.(val, options)
        : identify,
    };
  }

  /**
   * Given a binding, fetch a function that's responsible for formatting, and/or de-formatting the data
   * If no formatter is registered, it will return undefined
   */
  public getFormatter(
    binding: BindingInstance
  ): FormatDefinition<unknown, unknown> | undefined {
    const type = this.getApparentType(binding);

    if (!type?.format) {
      return undefined;
    }

    return this.getFormatterForType(type.format);
  }
}
