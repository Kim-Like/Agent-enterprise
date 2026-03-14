import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { rootDir } from "./support.js";

const envExamplePath = path.join(rootDir, "config", "env.example");
const packageJsonPath = path.join(rootDir, "package.json");
const docPath = path.join(rootDir, "docs", "lavpris-ssh-first-operations.md");
const scriptsDir = path.join(rootDir, "scripts", "lavpris");
const localMirrorRoot = path.join(rootDir, "programs", "lavprishjemmeside", "local-mirror");
const localMirrorReadmePath = path.join(localMirrorRoot, "README.md");
const localMirrorWorkflowArchivePath = path.join(
  localMirrorRoot,
  ".github",
  "workflow-archive",
  "deploy.disabled.yml.txt",
);
const localMirrorWorkflowDir = path.join(localMirrorRoot, ".github", "workflows");

test("lavpris env contract and npm aliases are documented in Agent Enterprise", () => {
  const envExample = fs.readFileSync(envExamplePath, "utf8");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  for (const key of [
    "AGENT_ENTERPRISE_INTERNAL_TOKEN",
    "AGENT_ENTERPRISE_LAVPRIS_MASTER_TOKEN",
    "LAVPRIS_PUBLIC_INGRESS_HOST",
    "LAVPRIS_PUBLIC_INGRESS_PORT",
    "LAVPRIS_PARENT_API_URL",
    "CPANEL_SSH_HOST",
    "CPANEL_SSH_PORT",
    "CPANEL_SSH_USER",
    "CPANEL_SSH_KEY_PATH",
    "LAVPRIS_CMS_REPO_PATH",
    "LAVPRIS_CLIENT_REPO_PATH",
    "LAVPRIS_CMS_SITE_ROOT",
    "LAVPRIS_CLIENT_SITE_ROOT",
    "LAVPRIS_LOCAL_MIRROR_PATH",
    "LAVPRIS_NODE_BIN",
  ]) {
    assert.match(envExample, new RegExp(`^${key}=`, "m"));
  }

  assert.equal(packageJson.scripts["lavpris:mirror-pull"], "bash scripts/operator_only.sh lavpris:mirror-pull");
  assert.equal(packageJson.scripts["lavpris:sync-status"], "bash scripts/operator_only.sh lavpris:sync-status");
  assert.equal(packageJson.scripts["lavpris:path-health"], "node scripts/lavpris/path_health.mjs");
  assert.equal(packageJson.scripts["lavpris:rollout-status"], "bash scripts/operator_only.sh lavpris:rollout-status");
  assert.equal(packageJson.scripts["lavpris:release-health"], "bash scripts/operator_only.sh lavpris:release-health");
  assert.equal(packageJson.scripts["lavpris:preflight"], "bash scripts/operator_only.sh lavpris:preflight");
  assert.equal(packageJson.scripts["lavpris:inventory"], "bash scripts/operator_only.sh lavpris:inventory");
  assert.equal(packageJson.scripts["lavpris:health"], "bash scripts/operator_only.sh lavpris:health");
  assert.equal(packageJson.scripts["lavpris:repo-status"], "bash scripts/operator_only.sh lavpris:repo-status");
  assert.equal(
    packageJson.scripts["start:lavpris-public-ingress"],
    "node server/src/lavpris-public-ingress.js",
  );
});

test("lavpris operator shell helpers are not exported into the sanitized monorepo", () => {
  for (const scriptPath of [
    path.join(scriptsDir, "_common.sh"),
    path.join(scriptsDir, "local_mirror_pull.sh"),
    path.join(scriptsDir, "sync_status.sh"),
    path.join(scriptsDir, "ssh_preflight.sh"),
    path.join(scriptsDir, "ssh_inventory.sh"),
    path.join(scriptsDir, "ssh_health.sh"),
    path.join(scriptsDir, "ssh_repo_status.sh"),
  ]) {
    assert.equal(fs.existsSync(scriptPath), false, scriptPath);
  }
});

test("lavpris operations doc records the SSH-first contract and GitHub/Bolt sync boundaries", () => {
  const doc = fs.readFileSync(docPath, "utf8");

  assert.match(doc, /cp10-lavpris/);
  assert.match(doc, /cp10\.nordicway\.dk/);
  assert.match(doc, /lavprishjemmeside\.dk/);
  assert.match(doc, /ljdesignstudio\.dk/);
  assert.match(doc, /github\.com\/kimjeppesen01\/lavprishjemmeside\.dk/i);
  assert.match(doc, /bolt\.new/i);
  assert.match(doc, /Bolt\.new -> GitHub -> cPanel/i);
  assert.match(doc, /push the GitHub-synced .* over SSH/i);
  assert.match(doc, /programs\/lavprishjemmeside\/local-mirror/i);
  assert.match(doc, /external monorepo, the package aliases are intentionally blocked/i);
  assert.match(doc, /npm run lavpris:mirror-pull/);
  assert.match(doc, /npm run lavpris:sync-status/);
  assert.match(doc, /Node `v10` and npm `6`/);
  assert.match(doc, /npm run lavpris:preflight/);
  assert.match(doc, /npm run lavpris:inventory/);
  assert.match(doc, /npm run lavpris:health/);
  assert.match(doc, /npm run lavpris:repo-status/);
  assert.doesNotMatch(doc, /scripts\/lavpris\/ssh_health\.sh/);
  assert.match(doc, /Tailscale Funnel/i);
  assert.match(doc, /lavpris public ingress/i);
});

test("local Lavprishjemmeside mirror archives the old GitHub Actions deploy workflow", () => {
  const readme = fs.readFileSync(localMirrorReadmePath, "utf8");

  assert.ok(fs.existsSync(localMirrorWorkflowArchivePath), localMirrorWorkflowArchivePath);
  assert.match(readme, /GitHub Actions deploy workflow was archived/i);
  assert.match(readme, /dist\/\.htaccess/);

  if (fs.existsSync(localMirrorWorkflowDir)) {
    const activeWorkflowFiles = fs
      .readdirSync(localMirrorWorkflowDir)
      .filter((entry) => /\.(ya?ml)$/i.test(entry));
    assert.deepEqual(activeWorkflowFiles, []);
  }
});
