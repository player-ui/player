import { BindingInstance } from '..';

describe('contains', () => {
  it('works for simple neg case', () => {
    const foo = new BindingInstance('foo');
    const bar = new BindingInstance('bar');
    expect(foo.contains(bar)).toBe(false);
  });

  it('works for simple pos cases', () => {
    const foo = new BindingInstance('foo');
    const fooBar = new BindingInstance('foo.bar');
    expect(foo.contains(fooBar)).toBe(true);
    expect(fooBar.contains(foo)).toBe(false);
  });

  it('can handle bindings starting with numbers', () => {
    const instance = new BindingInstance(
      'foo.5f4704fd-adab-49df-bcbc-5aedb04194f9.baz'
    );
    expect(instance.asString()).toBe(
      'foo.5f4704fd-adab-49df-bcbc-5aedb04194f9.baz'
    );
    expect(instance.asArray()[1]).toBe('5f4704fd-adab-49df-bcbc-5aedb04194f9');
    expect(instance.key()).toBe('baz');
  });

  it('handles overlapping key-string matches', () => {
    const foo = new BindingInstance('foo');
    const fooBar = new BindingInstance('fo');
    expect(foo.contains(fooBar)).toBe(false);

    expect(
      new BindingInstance('foo.bar.baz').contains(
        new BindingInstance('foo.bar.bazzzz')
      )
    ).toBe(false);
  });
});

describe('relative', () => {
  it('works for simple case', () => {
    const foo = new BindingInstance('foo');
    const fooBar = new BindingInstance('foo.bar');
    expect(fooBar.relative(foo)).toStrictEqual(['bar']);
  });
});

describe('parent', () => {
  it('works for easy ones', () => {
    const fooBar = new BindingInstance('foo.bar');
    expect(fooBar.parent().asString()).toBe('foo');
  });
});

describe('key', () => {
  it('works for easy ones', () => {
    const fooBar = new BindingInstance('foo.bar');
    expect(fooBar.key()).toBe('bar');
  });
});

describe('numberic segments', () => {
  it('splits numberic keys', () => {
    expect(new BindingInstance('foo.1.bar').asArray()).toStrictEqual([
      'foo',
      1,
      'bar',
    ]);
    expect(new BindingInstance(['foo', 1, 'bar']).asArray()).toStrictEqual([
      'foo',
      1,
      'bar',
    ]);
  });
});

describe('descendent binding', () => {
  it('generate child path from string', () => {
    const binding = new BindingInstance('foo.1.bar');
    expect(binding.descendent('barChild.UUID').asArray()).toStrictEqual([
      'foo',
      1,
      'bar',
      'barChild',
      'UUID',
    ]);
  });

  it('generate child path from binding segments', () => {
    const binding = new BindingInstance('foo.1.bar');
    expect(binding.descendent(['barChild', 'UUID']).asArray()).toStrictEqual([
      'foo',
      1,
      'bar',
      'barChild',
      'UUID',
    ]);
  });

  it('generate child path from a binding', () => {
    const binding = new BindingInstance('foo.1.bar');
    const childBinding = new BindingInstance('barChild.UUID');
    expect(binding.descendent(childBinding).asArray()).toStrictEqual([
      'foo',
      1,
      'bar',
      'barChild',
      'UUID',
    ]);
  });
});
