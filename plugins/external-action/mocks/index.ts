export interface Mock {
  group: string;
  name: string;
  path: string;
}

export type Manifest = Array<Mock>;
