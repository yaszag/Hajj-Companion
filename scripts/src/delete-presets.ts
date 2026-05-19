import { db, tasbihPresetsTable } from "@workspace/db";

async function main() {
  console.log("Deleting all existing presets...");
  await db.delete(tasbihPresetsTable);
  console.log("All presets deleted.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
