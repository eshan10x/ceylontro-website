/**
 * Prints the missing-facts report and fails (exit code 1) only on data errors.
 *
 *   npm run report               print the report
 *   npm run report -- --write    also save it to MISSING-FACTS.md
 */
import { existsSync, writeFileSync } from 'node:fs';
import { buildReport, formatReport } from '../src/data/report.ts';
import { ORDERING } from '../src/ordering/config.ts';

const photosDir = new URL('../src/assets/photos/', import.meta.url);
const report = buildReport({ photoFileExists: (file) => existsSync(new URL(file, photosDir)) });
const text = formatReport(report);

console.log(text);

if (process.argv.includes('--write')) {
  writeFileSync(new URL('../MISSING-FACTS.md', import.meta.url), `${text}\n`);
  console.log('\nSaved MISSING-FACTS.md');
}

if (report.errors.length) {
  process.exitCode = 1;
}

// Online ordering test mode must never reach the live site: Cloudflare Workers Builds names the
// branch it builds in WORKERS_CI_BRANCH, and a build of main stops here while hours are off.
if (process.env['WORKERS_CI_BRANCH'] === 'main' && ORDERING.enabled && !ORDERING.enforceHours) {
  console.error('\nERROR: online ordering hours are off (enforceHours in src/ordering/config.ts). Turn them on before deploying main.');
  process.exitCode = 1;
}
