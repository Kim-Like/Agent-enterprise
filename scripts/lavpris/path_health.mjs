import { loadEnv } from "../../server/src/lib/env.js";
import { collectLavprisPathHealth } from "../../server/src/lib/lavpris-path-health.js";

const env = loadEnv();
const payload = collectLavprisPathHealth({ env });

console.log(JSON.stringify(payload, null, 2));
process.exit(payload.ok ? 0 : 2);

