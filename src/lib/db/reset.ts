import path from "node:path";
import fs from "node:fs";

const DB_DIR = path.resolve(process.cwd(), "data");

if (fs.existsSync(DB_DIR)) {
  for (const file of fs.readdirSync(DB_DIR)) {
    if (
      file.endsWith(".db") ||
      file.endsWith(".db-journal") ||
      file.endsWith(".db-wal") ||
      file.endsWith(".db-shm")
    ) {
      fs.unlinkSync(path.join(DB_DIR, file));
      console.log("✗ removed:", file);
    }
  }
}
console.log("✓ DB reset complete. Run `npm run db:migrate && npm run db:seed`.");
