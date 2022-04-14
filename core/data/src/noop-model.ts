import type { DataModelImpl } from './model';

/**
 * A model that does nothing
 * Helpful for testing and other default DataModel applications
 */
export class NOOPDataModel implements DataModelImpl {
  get() {
    return undefined;
  }

  set() {
    return [];
  }
}

/** You only really need 1 instance of the NOOP model */
export const NOOP_MODEL = new NOOPDataModel();
