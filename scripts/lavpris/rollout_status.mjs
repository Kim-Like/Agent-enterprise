import { initControlPlaneDb } from "../../server/src/db/init.js";
import { loadEnv } from "../../server/src/lib/env.js";
import { createLavprisRolloutService } from "../../server/src/lib/lavpris-rollout.js";

const env = loadEnv();
const db = initControlPlaneDb(env);

try {
  const service = createLavprisRolloutService({ env, db });
  const payload = await service.getMasterRolloutStatus({ force: true });
  const exitCode =
    payload.summary.hardFailures.length > 0
      ? 2
      : payload.summary.warnings.length > 0
        ? 1
        : 0;

  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
} finally {
  db.close();
}

