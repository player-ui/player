import { binding as b, expression as e } from '..';

describe('string template binding', () => {
  it('returns string versions', () => {
    expect(b`foo.bar.baz`.toValue()).toBe('foo.bar.baz');
    expect(b`foo.bar.${b`foo.bar`}`.toValue()).toBe('foo.bar.{{foo.bar}}');
  });

  it('returns string ref versions', () => {
    expect(b`foo.bar.baz`.toRefString()).toBe('{{foo.bar.baz}}');
    expect(b`foo.bar.${b`foo.bar`}`.toRefString()).toBe(
      '{{foo.bar.{{foo.bar}}}}'
    );
  });

  it('works with nested expressions', () => {
    expect(b`foo.bar.${e`test()`}`.toValue()).toBe('foo.bar.`test()`');
    expect(b`foo.bar.${e`test()`}`.toRefString()).toBe('{{foo.bar.`test()`}}');

    const expr = e`test() == 'foo'`;
    expect(b`${expr}.${expr}`.toValue()).toBe(
      "`test() == 'foo'`.`test() == 'foo'`"
    );
  });

  it('works when in a string', () => {
    expect(`This is a ${b`foo.bar`} reference.`).toBe(
      'This is a {{foo.bar}} reference.'
    );
  });

  it('works when template is just a string', () => {
    const segments = ['foo', 'bar', '_index_', 'baz'];
    expect(b`${segments.join('.')}`.toValue()).toBe('foo.bar._index_.baz');
  });
});
