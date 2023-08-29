import { SyncBailHook, SyncWaterfallHook } from 'tapable-ts';
import NestedError from 'nested-error-stacks';
import type { ParserResult, AnyNode } from '../binding-grammar';
import {
  // We can swap this with whichever parser we want to use
  parseCustom as parseBinding,
} from '../binding-grammar';
import type { BindingParserOptions, BindingLike } from './binding';
import { BindingInstance } from './binding';
import { isBinding } from './utils';
import type { NormalizedResult, ResolveBindingASTOptions } from './resolver';
import { resolveBindingAST } from './resolver';

export * from './utils';
export * from './binding';

export const SIMPLE_BINDING_REGEX = /^[\w\-@]+(\.[\w\-@]+)*$/;

const DEFAULT_OPTIONS: BindingParserOptions = {
  get: () => {
    throw new Error('Not Implemented');
  },
  set: () => {
    throw new Error('Not Implemented');
  },
  evaluate: () => {
    throw new Error('Not Implemented');
  },
};

/** A parser for creating bindings from a string */
export class BindingParser {
  private cache: Record<string, BindingInstance>;
  private parseCache: Record<string, ParserResult>;
  private parserOptions: BindingParserOptions;

  public hooks = {
    skipOptimization: new SyncBailHook<[string], boolean>(),
    beforeResolveNode: new SyncWaterfallHook<
      [AnyNode, Required<NormalizedResult> & ResolveBindingASTOptions]
    >(),
  };

  constructor(options?: Partial<BindingParserOptions>) {
    this.parserOptions = { ...DEFAULT_OPTIONS, ...options };
    this.cache = {};
    this.parseCache = {};
    this.parse = this.parse.bind(this);
  }

  /**
   * Takes a binding path, parses it, and returns an equivalent, normalized
   * representation of that path.
   */
  private normalizePath(
    path: string,
    resolveOptions: ResolveBindingASTOptions
  ) {
    if (
      path.match(SIMPLE_BINDING_REGEX) &&
      this.hooks.skipOptimization.call(path) !== true
    ) {
      return { path: path.split('.'), updates: undefined } as NormalizedResult;
    }

    const ast = this.parseCache[path] ?? parseBinding(path);
    this.parseCache[path] = ast;

    if (typeof ast !== 'object' || !ast?.status) {
      throw new TypeError(
        `Cannot normalize path "${path}": ${ast?.error ?? 'Unknown Error.'}`
      );
    }

    try {
      return resolveBindingAST(ast.path, resolveOptions, this.hooks);
    } catch (e: any) {
      throw new NestedError(`Cannot resolve binding: ${path}`, e);
    }
  }

  private getBindingForNormalizedResult(
    normalized: NormalizedResult
  ): BindingInstance {
    const normalizedStr = normalized.path.join('.');

    if (this.cache[normalizedStr]) {
      return this.cache[normalizedStr];
    }

    const created = new BindingInstance(
      normalizedStr === '' ? [] : normalized.path,
      this.parse
    );
    this.cache[normalizedStr] = created;

    return created;
  }

  public parse(
    rawBinding: BindingLike,
    overrides: Partial<BindingParserOptions> = {}
  ): BindingInstance {
    if (isBinding(rawBinding)) {
      return rawBinding;
    }

    const options = {
      ...this.parserOptions,
      ...overrides,
    };

    let updates: Record<string, any> = {};

    const joined = Array.isArray(rawBinding)
      ? rawBinding.join('.')
      : String(rawBinding);

    const normalizeConfig: ResolveBindingASTOptions = {
      getValue: (path: Array<string | number>) => {
        const normalized = this.normalizePath(path.join('.'), normalizeConfig);

        return options.get(this.getBindingForNormalizedResult(normalized));
      },
      evaluate: (exp) => {
        return options.evaluate(exp);
      },
      convertToPath: (path: any) => {
        if (path === undefined) {
          throw new Error(
            'Attempted to convert undefined value to binding path'
          );
        }

        if (
          typeof path !== 'string' &&
          typeof path !== 'number' &&
          typeof path !== 'boolean'
        ) {
          throw new Error(
            `Attempting to convert ${typeof path} to a binding path.`
          );
        }

        const normalized = this.normalizePath(String(path), normalizeConfig);

        if (normalized.updates) {
          updates = {
            ...updates,
            ...normalized.updates,
          };
        }

        const joinedNormalizedPath = normalized.path.join('.');

        if (joinedNormalizedPath === '') {
          throw new Error('Nested path resolved to an empty path');
        }

        return joinedNormalizedPath;
      },
    };

    const normalized = this.normalizePath(joined, normalizeConfig);

    if (normalized.updates) {
      updates = {
        ...updates,
        ...normalized.updates,
      };
    }

    const updateKeys = Object.keys(updates);

    if (!options.readOnly && updateKeys.length > 0) {
      const updateTransaction = updateKeys.map<[BindingInstance, any]>(
        (updatedBinding) => [
          this.parse(updatedBinding),
          updates[updatedBinding],
        ]
      );

      options.set(updateTransaction);
    }

    return this.getBindingForNormalizedResult(normalized);
  }
}
