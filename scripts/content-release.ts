// The content release tool (ARCHITECTURE.md 11.7): writes the releases of
// scripts/seed/content/releases.ts into a database that was seeded before, creating what it
// lacks and changing nothing an admin may have edited. A dry run unless --apply is given.
//
//   npm run content:release                                 dry run of every release, emulators
//   npm run content:release -- <releaseId>... --apply
//   npm run content:release -- --allow-project <id> --env-file <path> [--yes] [--apply]
//
// The production run goes through .github/workflows/content-release.yml. The seed content is
// validated whole first, as the seed validates it, and every id a release names must be in it.

import {
  COMMON_USAGE,
  connect,
  parseScriptArgs,
  runScript,
  ScriptError,
  step,
  targetOptions,
} from './lib/admin';
import { SEED_CHALLENGES, SEED_COURSES } from './seed/content';
import { CONTENT_RELEASES } from './seed/content/releases';
import { pathwayProblems, releaseProblems, runReleases, selectReleases } from './seed/release';
import { validateSeedContent } from './seed/validate';

const USAGE = `Usage: npm run content:release -- [<releaseId>...] [options]

Writes the content releases of scripts/seed/content/releases.ts, oldest first (all of them
unless ids are given), into a database that was seeded before: new courses, new modules and
course details, created or replaced only where the database still holds what the release
expects (ARCHITECTURE.md 11.7). What each release created is recorded in meta/contentReleases.

  --apply                write; without it the run is a dry run that prints what it would
                         create or change and writes nothing
${COMMON_USAGE}`;

async function main(): Promise<void> {
  const { values, positionals } = parseScriptArgs(
    { apply: { type: 'boolean', default: false } },
    USAGE,
  );
  const apply = values.apply === true;

  step('Content');
  const problems = [
    ...validateSeedContent(SEED_COURSES, SEED_CHALLENGES),
    ...releaseProblems(CONTENT_RELEASES, SEED_COURSES),
  ];
  if (problems.length > 0) {
    throw new ScriptError(`The seed content is not valid:\n  ${problems.join('\n  ')}`);
  }
  const releases = selectReleases(CONTENT_RELEASES, positionals);
  console.log(
    `   ${SEED_COURSES.length} course(s) valid; ${releases.length} of ${CONTENT_RELEASES.length} release(s) selected`,
  );

  const target = await connect(targetOptions(values));
  const missing = await pathwayProblems(releases, SEED_COURSES);
  if (missing.length > 0) throw new ScriptError(missing.join('\n'));

  console.log(apply ? '\nApplying.' : '\nDry run: nothing is written.');
  const reports = await runReleases(releases, {
    courses: SEED_COURSES,
    apply,
    all: CONTENT_RELEASES,
  });

  step('Summary');
  if (reports.length === 0) console.log('   no content release to apply');
  for (const report of reports) {
    console.log(
      `   ${report.releaseId}: ${report.created.length} document(s) ${apply ? 'created' : 'to create'}, ` +
        `${report.changed.length} ${apply ? 'changed' : 'to change'}, ${report.warnings.length} warning(s)`,
    );
  }
  const warnings = reports.flatMap((report) => report.warnings);
  for (const warning of warnings) console.warn(`   WARNING: ${warning}`);
  if (!apply) {
    console.log(`   dry run on ${target.projectId}: nothing was written; pass --apply to write`);
  }
}

runScript(main);
