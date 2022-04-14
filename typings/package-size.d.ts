declare module 'package-size' {
  export interface Options {
    /**
     * Sort packages in size (from small to large)
     *
     */
    sort?: boolean;

    cwd?: boolean;

    externals?: string | Array<string | RegExp>;

    cache?: boolean;

    target?: 'browser' | 'node';

    registry?: string;

    resolve?: string | Array<string>;
  }

  export interface SizeData {
    name: string;
    size: number;
    minified: number;
    gzipped: number;
    versionedName: string;
  }

  export default function getSizes(
    packages: string | string[],
    options?: Options
  ): SizeData;
}
