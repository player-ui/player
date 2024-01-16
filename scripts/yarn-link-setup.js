const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

if (process.env.BAZEL_YARN_INSTALL) {
  process.exit();
}

const rootDir = path.join(__dirname, '..');

const bazelQuery = execSync(
  `bazel query "kind(js_library, //...)" --output label 2> /dev/null`
).toString();

const dependencyMap = bazelQuery
  .split('\n')
  .filter((s) => s.startsWith('//'))
  .map((s) => {
    const [workspacePath, pkgName] = s.split(':');
    return [pkgName, `./${path.join('bazel-bin', workspacePath.substr(2))}`];
  });

dependencyMap.forEach(([pkgName, pkgPath]) => {
  const nodeModDir = path.join(rootDir, 'node_modules', pkgName);
  execSync(`mkdir -p ${path.dirname(nodeModDir)}`);

  if (fs.existsSync(nodeModDir)) {
    return;
  }

  execSync(`ln -sf ${path.join(rootDir, pkgPath)} ${nodeModDir}`);
});
