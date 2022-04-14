declare module 'sorted-array' {
  export default class SortedArray<K> {
    constructor(values: K[], compare?: (val: K) => number);
    public readonly array: K[];
    search(val: K): number;
    remove(val: K): K[];
    insert(val: K): K[];
  }
}
