/**
 * Prints the missing-facts report and fails (exit code 1) only on data errors.
 *
 *   npm run report               print the report
 *   npm run report -- --write    also save it to MISSING-FACTS.md
 */
import { existsSync, writeFileSync } from 'node:fs';
import { buildReport, formatReport } from '../src/data/report.ts';

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
