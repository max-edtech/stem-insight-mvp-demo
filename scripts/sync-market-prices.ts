import "dotenv/config";
import { syncMarketSnapshots } from "../lib/market/sync";

async function main() {
  const result = await syncMarketSnapshots();
  console.log("Market sync completed");
  console.log(`fetchedAt: ${result.fetchedAt}`);
  console.log(`snapshotsUpserted: ${result.snapshotsUpserted}`);
  console.log(`alertsTriggered: ${result.alertsTriggered}`);
  console.log(`impactsUpserted: ${result.impactsUpserted}`);
  for (const item of result.series) {
    const mom =
      item.momChangePct === null ? "n/a" : `${item.momChangePct.toFixed(2)}%`;
    console.log(
      `- ${item.seriesKey} period=${item.period ?? "n/a"} value=${item.value ?? "n/a"} mom=${mom} triggered=${item.triggered}`
    );
  }
}

main().catch((error) => {
  console.error("Market sync failed");
  console.error(error);
  process.exit(1);
});

