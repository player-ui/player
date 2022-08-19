import React from 'react';
import type { JsonType } from 'react-json-reconciler';
import { SourceMapGenerator, SourceMapConsumer } from 'source-map-js';
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

type SourceMapList = Array<{
  /** The mappings of the original */
  sourceMap: string;
  /**
   * The id of the view we're indexing off of
   * This should be a unique global identifier within the generated code
   * e.g. `"id": "view_0",`
   */
  offsetIndexSearch: string;
  /** The generated source that produced the map */
  source: string;
}>;

/** Given a list of source maps for all generated views, merge them into 1 */
const mergeSourceMaps = (
  sourceMaps: SourceMapList,
  generated: string
): string => {
  const generator = new SourceMapGenerator();
  sourceMaps.forEach(({ sourceMap, offsetIndexSearch, source }) => {
    const generatedLineOffset = generated
      .split('\n')
      .findIndex((line) => line.includes(offsetIndexSearch));

    const sourceLineOffset = source
      .split('\n')
      .findIndex((line) => line.includes(offsetIndexSearch));

    const lineOffset = generatedLineOffset - sourceLineOffset;

    const generatedLine = generated.split('\n')[generatedLineOffset];
    const sourceLine = source.split('\n')[sourceLineOffset];

    const generatedColumn = generatedLine.indexOf(offsetIndexSearch);
    const sourceColumn = sourceLine.indexOf(offsetIndexSearch);
    const columnOffset = generatedColumn - sourceColumn;

    const consumer = new SourceMapConsumer(JSON.parse(sourceMap));
    consumer.eachMapping((mapping) => {
      generator.addMapping({
        generated: {
          line: mapping.generatedLine + lineOffset,
          column: mapping.generatedColumn + columnOffset,
        },
        original: {
          line: mapping.originalLine,
          column: mapping.originalColumn,
        },
        source: mapping.source,
      });
    });
  });

  return generator.toString();
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

    /** The sourcemap of the content */
    sourceMap?: string;
  }> {
    if (typeof value !== 'object' || value === null) {
      throw new Error('Unable to serialize non-object');
    }

    if (React.isValidElement(value)) {
      const { jsonValue, sourceMap } = await render(value, {
        collectSourceMap: true,
      });

      return {
        value: jsonValue,
        sourceMap,
        contentType: 'view',
      };
    }

    if ('navigation' in value) {
      // Source maps from all the nested views
      // Merge these together before returning
      const allSourceMaps: SourceMapList = [];

      // Assume this is a flow
      const copiedValue: Flow = {
        ...(value as any),
      };

      copiedValue.views = (await Promise.all(
        copiedValue?.views?.map(async (node: any) => {
          const { jsonValue, sourceMap, stringValue } = await render(node, {
            collectSourceMap: true,
          });

          if (sourceMap) {
            // Find the line that is the id of the view
            // Use that as the identifier for the sourcemap offset calc
            const searchIdLine = stringValue
              .split('\n')
              .find((line) =>
                line.includes(
                  `"id": "${(jsonValue as Record<string, string>).id}"`
                )
              );

            if (searchIdLine) {
              allSourceMaps.push({
                sourceMap,
                offsetIndexSearch: searchIdLine,
                source: stringValue,
              });
            }
          }

          return jsonValue;
        }) ?? []
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
        return {
          value: copiedValue as JsonType,
          contentType: 'flow',
          sourceMap: mergeSourceMaps(
            allSourceMaps,
            JSON.stringify(copiedValue, null, 2)
          ),
        };
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
