import { createApp } from "../../server/src/app.js";

async function main() {
  const domain = process.argv[2] || "ljdesignstudio.dk";
  const siteLabel = process.argv[3] || domain;
  const app = await createApp();

  try {
    const payload = await app.controlPlane.lavprisClientAgents.provisionClientAgent({
      domain,
      siteLabel,
      installSource: "local-manual-provision",
    });

    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
