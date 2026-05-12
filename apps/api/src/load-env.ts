import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

/** Prefer apps/api/.env even when shell or CI injects a wrong DATABASE_URL. */
const cwd = process.cwd();
for (const envPath of [
  path.resolve(cwd, '.env'),
  path.resolve(cwd, 'apps', 'api', '.env'),
]) {
  if (fs.existsSync(envPath)) {
    config({ path: envPath, override: true });
    break;
  }
}
