import { loadMetadata } from "./loader.js";

export interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Detect Player UI packages from a package.json file
 */
export async function detectPlayerPackages(
  packageJson: PackageJson,
): Promise<string[]> {
  const metadata = await loadMetadata();
  const playerPackages: string[] = [];

  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.peerDependencies,
  };

  for (const depName of Object.keys(allDeps)) {
    if (metadata.packages[depName]) {
      playerPackages.push(depName);
    }
  }

  return playerPackages;
}
