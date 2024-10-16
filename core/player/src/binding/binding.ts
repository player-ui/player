import { getBindingSegments } from "./utils";

export interface BindingParserOptions {
  /** Get the value for a specific binding */
  get: (binding: BindingInstance) => any;

  /**
   * Set the values for bindings.
   * This is used when the query syntax needs to modify an object
   */
  set: (transaction: Array<[BindingInstance, any]>) => void;

  /**
   * Get the result of evaluating an expression
   */
  evaluate: (exp: string) => any;

  /**
   * Without readOnly, if a binding such as this is used: arr[key='does not exist'],
   * then an object with that key will be created.
   * This is done to make assignment such as arr[key='abc'].val = 'foo' work smoothly.
   * Setting readOnly to true will prevent this behavior, avoiding unintended data changes.
   */
  readOnly?: boolean;
}

export type Getter = (path: BindingInstance) => any;

export type RawBindingSegment = number | string;
export type RawBinding = string | RawBindingSegment[];
export type BindingLike = RawBinding | BindingInstance;
export type BindingFactory = (
  raw: RawBinding,
  options?: Partial<BindingParserOptions>,
) => BindingInstance;

/**
 * A path in the data model
 */
export class BindingInstance {
  private split: RawBindingSegment[];
  private joined: string;
  private factory: BindingFactory;

  constructor(
    raw: RawBinding,
    factory = (rawBinding: RawBinding) => new BindingInstance(rawBinding),
  ) {
    const split = Array.isArray(raw) ? raw : raw.split(".");
    this.split = split.map((segment) => {
      if (typeof segment === "number") {
        return segment;
      }

      const tryNum = Number(segment);
      return isNaN(tryNum) ? segment : tryNum;
    });
    Object.freeze(this.split);
    this.joined = this.split.join(".");
    this.factory = factory;
  }

  asArray(): RawBindingSegment[] {
    return this.split;
  }

  asString(): string {
    return this.joined;
  }

  /**
   * Check to see if the given binding is a sub-path of the current one
   */
  contains(binding: BindingInstance): boolean {
    // need to account for partial key matches
    // [foo, bar] !== [foo, ba]
    const bindingAsArray = binding.asArray();

    if (bindingAsArray.length < this.split.length) {
      return false;
    }

    // Check every overlapping index to make sure they're the same
    // Intentionally use a for loop for speeeed
    for (let i = 0; i < this.split.length; i++) {
      if (this.split[i] !== bindingAsArray[i]) {
        return false;
      }
    }

    return true;
  }

  relative(binding: BindingInstance): RawBindingSegment[] {
    return this.asArray().slice(binding.asArray().length);
  }

  parent(): BindingInstance {
    return this.factory(this.split.slice(0, -1));
  }

  key(): RawBindingSegment {
    return this.split[this.split.length - 1];
  }

  /**
   * This is a utility method to get a binding that is a descendent of this binding
   *
   * @param relative - The relative path to descend to
   */
  descendent(relative: BindingLike): BindingInstance {
    const descendentSegments = getBindingSegments(relative);

    return this.factory(this.split.concat(descendentSegments));
  }
}
