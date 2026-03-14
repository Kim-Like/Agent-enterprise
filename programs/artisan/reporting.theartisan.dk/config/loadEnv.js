const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function candidateEnvPaths() {
  const paths = [];

  const explicit = (process.env.IAN_GLOBAL_ENV_PATH || '').trim();
  if (explicit) {
    paths.push(path.resolve(explicit));
  }

  // Monorepo canonical env: /Users/IAn/Agent/IAn/.env
  paths.push(path.resolve(__dirname, '..', '..', '..', '..', '.env'));

  // Standalone app fallback for cPanel-style deployments.
  paths.push(path.resolve(__dirname, '..', '.env'));

  return [...new Set(paths)];
}

function loadEnv() {
  const loaded = [];
  candidateEnvPaths().forEach((envPath) => {
    if (!fs.existsSync(envPath)) return;
    dotenv.config({ path: envPath, override: false });
    loaded.push(envPath);
  });
  return loaded;
}

module.exports = {
  loadEnv,
  candidateEnvPaths,
};
