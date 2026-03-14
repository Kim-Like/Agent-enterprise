import { initControlPlaneDb } from "../../server/src/db/init.js";
import { loadEnv } from "../../server/src/lib/env.js";
import { createLavprisRolloutService } from "../../server/src/lib/lavpris-rollout.js";

const env = loadEnv();
const db = initControlPlaneDb(env);

try {
  const service = createLavprisRolloutService({ env, db });
  const payload = await service.getReleaseHealth({ force: true });

  console.log(JSON.stringify(payload, null, 2));
  process.exit(payload.exitCode);
} finally {
  db.close();
}

