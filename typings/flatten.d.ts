declare module 'arr-flatten' {
  type Flatten = (array: (string | any[])[]) => string[];

  const flatten: Flatten;
  export = flatten;
}
