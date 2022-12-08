import parse from '../parser';
import { findClosestNodeAtPosition } from '../utils';

describe('findClosestNodeAtPosition', () => {
  it('finds the right nodes', () => {
    const expression = '{{foo}} = test("bar", 12, ["baz", "qux"]) + !true';
    const parsed = parse(expression);

    expect(findClosestNodeAtPosition(parsed, { character: 1 })).toStrictEqual(
      expect.objectContaining({
        type: 'ModelRef',
        ref: 'foo',
      })
    );

    expect(findClosestNodeAtPosition(parsed, { character: 8 })).toStrictEqual(
      expect.objectContaining({
        type: 'Assignment',
      })
    );

    expect(findClosestNodeAtPosition(parsed, { character: 12 })).toStrictEqual(
      expect.objectContaining({
        type: 'Identifier',
        name: 'test',
      })
    );

    expect(findClosestNodeAtPosition(parsed, { character: 16 })).toStrictEqual(
      expect.objectContaining({
        type: 'Literal',
        value: 'bar',
      })
    );

    expect(findClosestNodeAtPosition(parsed, { character: 23 })).toStrictEqual(
      expect.objectContaining({
        type: 'Literal',
        value: 12,
      })
    );
  });
});
