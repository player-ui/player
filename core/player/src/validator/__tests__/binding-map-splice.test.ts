import { describe, it, expect } from 'vitest';
import { BindingParser } from '../../binding';
import { removeBindingAndChildrenFromMap } from '../binding-map-splice';

const parser = new BindingParser({
  get: () => undefined,
  set: () => undefined,
  evaluate: () => undefined,
});

describe('removeBindingAndChildrenFromMap', () => {
  it('removes a binding and its chidlren', () => {
    const sourceMap = new Map([
      [parser.parse('foo.bar.baz'), 1],
      [parser.parse('foo.bar'), 2],
      [parser.parse('foo.baz'), 3],
    ]);

    const result = removeBindingAndChildrenFromMap(
      sourceMap,
      parser.parse('foo.bar')
    );

    expect(result).toStrictEqual(new Map([[parser.parse('foo.baz'), 3]]));
  });

  it('splices a binding and its children', () => {
    const sourceMap = new Map([
      [parser.parse('foo.bar.0.aaa'), 1],
      [parser.parse('foo.bar.0.aab'), 2],
      [parser.parse('foo.bar.1.bba'), 3],
      [parser.parse('foo.bar.1.bbb'), 4],
      [parser.parse('foo.bar.2.cca'), 5],
      [parser.parse('foo.bar.2.ccb'), 6],
      [parser.parse('foo.baz'), 3],
    ]);

    const result = removeBindingAndChildrenFromMap(
      sourceMap,
      parser.parse('foo.bar.1')
    );

    expect(result).toStrictEqual(
      new Map([
        [parser.parse('foo.bar.0.aaa'), 1],
        [parser.parse('foo.bar.0.aab'), 2],
        [parser.parse('foo.bar.1.cca'), 5],
        [parser.parse('foo.bar.1.ccb'), 6],
        [parser.parse('foo.baz'), 3],
      ])
    );
  });
});
