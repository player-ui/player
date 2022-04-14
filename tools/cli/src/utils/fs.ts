import path from 'path';
import fs from 'fs';

/** Check if an input is a directory, if it is, then swap it to a globbed path */
export const convertToFileGlob = (input: string[], glob: string): string[] => {
  return input.map((i) => {
    try {
      if (fs.statSync(i).isDirectory()) {
        return path.join(i, glob);
      }
    } catch (e: any) {}

    return i;
  });
};

/** Normalize a path for display */
export const normalizePath = (p: string): string => {
  return path.relative(process.cwd(), p);
};
