import React from 'react';
import type { JsonType } from 'react-json-reconciler';
import { render } from 'react-json-reconciler';
import type { Flow, View, Navigation as PlayerNav } from '@player-ui/types';
import { SyncHook } from 'tapable-ts';
import type { SerializeType } from './types';
import type { Navigation } from '../types';
import { SchemaGenerator } from './schema';

/** Recursively find BindingTemplateInstance and call toValue on them */
const parseNavigationExpressions = (nav: Navigation): PlayerNav => {
  /** Same as above but signature changed */
  function replaceExpWithStr(obj: any): any {
    /** call toValue if BindingTemplateInstance otherwise continue  */
    function convExp(value: any): any {
      return value && typeof value === 'object' && value.__type === 'expression'
        ? value.toValue() // exp, onStart, and onEnd don't need to be wrapped in @[]@
        : replaceExpWithStr(value);
    }

    if (Array.isArray(obj)) {
      return obj.map(convExp);
    }

    if (typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, convExp(value)])
      );
    }

    return obj;
  }

  return replaceExpWithStr(nav);
};

/** A compiler for transforming DSL content into JSON */
export class DSLCompiler {
  public hooks = {
    schemaGenerator: new SyncHook<[SchemaGenerator]>(),
  };

  /** Convert an object (flow, view, schema, etc) into it's JSON representation */
  async serialize(value: unknown): Promise<{
    /** the JSON value of the source */
    value: JsonType | undefined;

    /** the fingerprinted content type of the source */
    contentType: SerializeType;
  }> {
    if (typeof value !== 'object' || value === null) {
      throw new Error('Unable to serialize non-object');
    }

    if (React.isValidElement(value)) {
      return {
        value: await render(value),
        contentType: 'view',
      };
    }

    if ('navigation' in value) {
      // Assume this is a flow
      const copiedValue: Flow = {
        ...(value as any),
      };

      copiedValue.views = (await Promise.all(
        copiedValue?.views?.map((node) => render(node as any)) ?? []
      )) as View[];

      // Go through the flow and sub out any view refs that are react elements w/ the right id
      if ('navigation' in value) {
        Object.entries((value as Flow).navigation).forEach(([navKey, node]) => {
          if (typeof node === 'object') {
            Object.entries(node).forEach(([nodeKey, flowNode]) => {
              if (
                flowNode &&
                typeof flowNode === 'object' &&
                'state_type' in flowNode &&
                flowNode.state_type === 'VIEW' &&
                React.isValidElement(flowNode.ref)
              ) {
                const actualViewIndex = (value as Flow).views?.indexOf?.(
                  flowNode.ref as any
                );

                if (actualViewIndex !== undefined && actualViewIndex > -1) {
                  const actualId = copiedValue.views?.[actualViewIndex]?.id;

                  (copiedValue as any).navigation[navKey][nodeKey].ref =
                    actualId;
                }
              }
            });
          }
        });

        copiedValue.navigation = parseNavigationExpressions(
          copiedValue.navigation
        );
      }

      if (value) {
        return { value: copiedValue as JsonType, contentType: 'flow' };
      }
    }

    const schemaGenerator = new SchemaGenerator();
    this.hooks.schemaGenerator.call(schemaGenerator);

    return {
      value: schemaGenerator.toSchema(value) as JsonType,
      contentType: 'schema',
    };
  }
}
