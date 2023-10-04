import { pubsub } from '../pubsub';

describe('pubsub', () => {
  beforeEach(() => {
    pubsub.clear();
  });

  it('should call subscriber with single argument', () => {
    const type = 'test';
    const message = 'this is a test message';
    const spy = jest.fn();

    pubsub.subscribe(type, spy);
    pubsub.publish(type, message);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(type, message);
  });

  it('should increment uuid with each subscribe', () => {
    const type = 'test';
    const message = 'this is a test message';
    const spy = jest.fn();

    const sub1 = pubsub.subscribe(type, spy);
    const sub2 = pubsub.subscribe(type, spy);
    const sub3 = pubsub.subscribe(type, spy);
    pubsub.publish(type, message);

    expect(sub1).not.toStrictEqual(sub2);
    expect(sub1).not.toStrictEqual(sub3);
    expect(sub2).not.toStrictEqual(sub3);
  });

  it('should call subscriber with multiple argument', () => {
    const type = 'test';
    const spy = jest.fn();

    pubsub.subscribe(type, spy);
    pubsub.publish(type, 1, 'two', 'three');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(type, 1, 'two', 'three');
  });

  it('should handle different argument types', () => {
    const type = 'test';
    const spy = jest.fn();

    pubsub.subscribe(type, spy);
    pubsub.publish(type, 'one', 2, undefined, null, true, false);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      type,
      'one',
      2,
      undefined,
      null,
      true,
      false
    );
  });

  it('should call all subscribers only once', () => {
    const type = 'test';
    const message = 'this is a test message';
    const first = jest.fn();
    const second = jest.fn();

    pubsub.subscribe(type, first);
    pubsub.subscribe(type, second);

    pubsub.publish(type, message);

    expect(first).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledWith(type, message);
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith(type, message);
  });

  it('should call only subscribers of event', () => {
    const message = 'this is a test message';
    const first = jest.fn();
    const second = jest.fn();

    pubsub.subscribe('first', first);
    pubsub.subscribe('second', second);

    pubsub.publish('first', message);

    expect(first).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledWith('first', message);
    expect(second).not.toHaveBeenCalled();
  });

  it('should call subscriber for all publish types', () => {
    const spy = jest.fn();

    pubsub.subscribe('*', spy);

    pubsub.publish('one', 'one');
    pubsub.publish('two', 'two');
    pubsub.publish('three', 'three');

    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenNthCalledWith(1, 'one', 'one');
    expect(spy).toHaveBeenNthCalledWith(2, 'two', 'two');
    expect(spy).toHaveBeenNthCalledWith(3, 'three', 'three');
  });

  it('should call all levels of subscribers only once', () => {
    const level1 = jest.fn();
    const level2 = jest.fn();
    const level3 = jest.fn();

    pubsub.subscribe('foo', level1);
    pubsub.subscribe('foo.bar', level2);
    pubsub.subscribe('foo.bar.baz', level3);

    pubsub.publish('foo.bar.baz', 'one', 'two', 'three');

    expect(level1).toHaveBeenCalledTimes(1);
    expect(level2).toHaveBeenCalledTimes(1);
    expect(level3).toHaveBeenCalledTimes(1);
    expect(level1).toHaveBeenCalledWith('foo.bar.baz', 'one', 'two', 'three');
    expect(level2).toHaveBeenCalledWith('foo.bar.baz', 'one', 'two', 'three');
    expect(level3).toHaveBeenCalledWith('foo.bar.baz', 'one', 'two', 'three');
  });

  it('should return unique symbols for each subscribe', () => {
    const spy = jest.fn();
    const spy2 = jest.fn();

    const token1 = pubsub.subscribe('test', spy);
    const token2 = pubsub.subscribe('test', spy);
    const token3 = pubsub.subscribe('test', spy2);

    const symbols = new Set([token1, token2, token3]);
    expect(symbols.size).toBe(3);
  });

  it(`shouldn't error if subscribing to non string value`, () => {
    const spy = jest.fn();
    pubsub.subscribe(true as any, spy);
    pubsub.publish(true as any, 'test');

    expect(spy).not.toHaveBeenCalled();
  });

  it('should remove handler with token', () => {
    const type = 'test';
    const spy = jest.fn();
    const token = pubsub.subscribe(type, spy);

    expect(pubsub.count()).toBe(1);
    expect(pubsub.count(type)).toBe(1);

    pubsub.unsubscribe(token);

    expect(pubsub.count()).toBe(0);
    expect(pubsub.count(type)).toBe(0);
  });

  it('should only remove handler with passed token', () => {
    const type = 'test';
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    const token1 = pubsub.subscribe(type, spy1);
    const token2 = pubsub.subscribe(type, spy2);

    expect(pubsub.count()).toBe(2);
    expect(pubsub.count(type)).toBe(2);

    pubsub.unsubscribe(token1);

    expect(pubsub.count()).toBe(1);
    expect(pubsub.count(type)).toBe(1);

    pubsub.unsubscribe(token2);

    expect(pubsub.count()).toBe(0);
    expect(pubsub.count(type)).toBe(0);
  });

  it('should remove all handlers for type', () => {
    const type = 'test';
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    pubsub.subscribe(type, spy1);
    pubsub.subscribe(type, spy2);

    expect(pubsub.count()).toBe(2);
    expect(pubsub.count(type)).toBe(2);
    // @ts-ignore
    expect(pubsub.tokens.size).toBe(2);

    pubsub.unsubscribe(type);

    expect(pubsub.count()).toBe(0);
    expect(pubsub.count(type)).toBe(0);
    // @ts-ignore
    expect(pubsub.tokens.size).toBe(0);
  });

  it('should remove all nested handlers for type', () => {
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    const spy3 = jest.fn();
    pubsub.subscribe('foo', spy1);
    pubsub.subscribe('foo.bar', spy2);
    pubsub.subscribe('foo.bar.baz', spy3);

    expect(pubsub.count()).toBe(3);
    expect(pubsub.count('foo')).toBe(1);
    expect(pubsub.count('foo.bar')).toBe(1);
    expect(pubsub.count('foo.bar.baz')).toBe(1);
    // @ts-ignore
    expect(pubsub.tokens.size).toBe(3);

    pubsub.unsubscribe('foo');

    expect(pubsub.count()).toBe(0);
    expect(pubsub.count('foo')).toBe(0);
    expect(pubsub.count('foo.bar')).toBe(0);
    expect(pubsub.count('foo.bar.baz')).toBe(0);
    // @ts-ignore
    expect(pubsub.tokens.size).toBe(0);
  });

  it('should keep top layer for type', () => {
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    const spy3 = jest.fn();
    pubsub.subscribe('foo', spy1);
    pubsub.subscribe('foo.bar', spy2);
    pubsub.subscribe('foo.bar.baz', spy3);

    expect(pubsub.count()).toBe(3);
    expect(pubsub.count('foo')).toBe(1);
    expect(pubsub.count('foo.bar')).toBe(1);
    expect(pubsub.count('foo.bar.baz')).toBe(1);
    // @ts-ignore
    expect(pubsub.tokens.size).toBe(3);

    pubsub.unsubscribe('foo.bar');

    expect(pubsub.count()).toBe(1);
    expect(pubsub.count('foo')).toBe(1);
    expect(pubsub.count('foo.bar')).toBe(0);
    expect(pubsub.count('foo.bar.baz')).toBe(0);
    // @ts-ignore
    expect(pubsub.tokens.size).toBe(1);
  });

  it('should only delete deeply nested type', () => {
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    const spy3 = jest.fn();
    pubsub.subscribe('foo', spy1);
    pubsub.subscribe('foo.bar', spy2);
    pubsub.subscribe('foo.bar.baz', spy3);

    expect(pubsub.count()).toBe(3);
    expect(pubsub.count('foo')).toBe(1);
    expect(pubsub.count('foo.bar')).toBe(1);
    expect(pubsub.count('foo.bar.baz')).toBe(1);
    // @ts-ignore
    expect(pubsub.tokens.size).toBe(3);

    pubsub.unsubscribe('foo.bar.baz');

    expect(pubsub.count()).toBe(2);
    expect(pubsub.count('foo')).toBe(1);
    expect(pubsub.count('foo.bar')).toBe(1);
    expect(pubsub.count('foo.bar.baz')).toBe(0);
    // @ts-ignore
    expect(pubsub.tokens.size).toBe(2);
  });

  it(`should gracefully handle when token doesn't exist anymore`, () => {
    const spy = jest.fn();

    const token = pubsub.subscribe('foo', spy);
    expect(pubsub.count()).toBe(1);

    pubsub.clear();
    expect(pubsub.count()).toBe(0);

    pubsub.unsubscribe(token);
    // @ts-ignore
    expect(pubsub.tokens.size).toBe(0);
  });

  it(`should gracefully handle when unsubscribe isn't string or symbol`, () => {
    const spy = jest.fn();

    pubsub.subscribe('foo', spy);
    expect(pubsub.count()).toBe(1);

    pubsub.clear();
    expect(pubsub.count()).toBe(0);

    pubsub.unsubscribe(false as any);
    // @ts-ignore
    expect(pubsub.tokens.size).toBe(0);
  });
});
