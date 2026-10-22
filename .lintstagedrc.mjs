import path from 'node:path';

// ESLint's flat config resolves relative to the process cwd, not the file
// being linted, so per-workspace tasks `cd` into the workspace and pass
// paths relative to it. Prettier resolves .prettierrc upwards from each
// file, so it doesn't need the cwd switch.
const workspaceEslintFix = (workspaceDir) => (files) => {
  const relativeFiles = files.map((file) => path.relative(path.resolve(workspaceDir), file));
  const quoted = relativeFiles.map((file) => JSON.stringify(file)).join(' ');
  return `cd ${workspaceDir} && npx eslint --fix ${quoted}`;
};

const prettierFix = (files) =>
  `npx prettier --write ${files.map((file) => JSON.stringify(file)).join(' ')}`;

export default {
  'apps/web/**/*.{js,jsx,mjs,ts,tsx,json}': [prettierFix],
  'apps/web/**/*.{js,jsx,mjs,ts,tsx}': [workspaceEslintFix('apps/web')],
  // tsc needs whole-program context, so it can't be scoped to staged files.
  'apps/web/**/*.{ts,tsx}': () => 'npm run check:types -w @template/web',
};
