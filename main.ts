// SALTWIND CARAVAN — best-game-01 entry program (v2).
//
// Copies game/ and screenshots/ from this repository into the output
// directory and writes /output/dossier.json with buildDossier from
// vendor/makefun-game.ts.
//
// The output directory itself is NEVER deleted, moved or renamed: in the
// grader sandbox its parent is not writable by the user this program runs
// as, so removing the directory itself fails with permission-denied. This
// program only creates the directory when it is missing and clears its
// previous contents entry by entry from inside it.

import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

// Safety guard: never clear the repository itself, the filesystem root,
// or a home directory, however the output variable is set.
const resolvedOut = outputDir.replace(/\/+$/, '') || '/';
if (resolvedOut === '/' || resolvedOut === repoRoot || resolvedOut === process.env.HOME) {
  fail(`refusing unsafe output directory: ${outputDir}`);
}

function fail(message: string): never {
  throw new Error(`main.ts: ${message}`);
}

// Clear the previous contents of the output directory, one entry at a
// time, from inside it. The directory itself is left in place.
function clearInside(dir: string): void {
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

function copyTreeSorted(src: string, dest: string): number {
  let count = 0;
  const entries = readdirSync(src, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const entry of entries) {
    const from = join(src, entry.name);
    const to = join(dest, entry.name);
    if (entry.isDirectory()) {
      mkdirSync(to, { recursive: true });
      count += copyTreeSorted(from, to);
    } else if (entry.isFile()) {
      cpSync(from, to);
      count += 1;
    }
    // Symlinks and anything else are skipped: game/ holds plain files only.
  }
  return count;
}

const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');

if (!existsSync(gameDir) || !statSync(gameDir).isDirectory()) {
  fail('missing game/ directory in the repository');
}
if (!existsSync(join(gameDir, 'index.html')) || !lstatSync(join(gameDir, 'index.html')).isFile()) {
  fail('missing game/index.html in the repository');
}
if (!existsSync(shotsDir) || !statSync(shotsDir).isDirectory()) {
  fail('missing screenshots/ directory in the repository');
}

mkdirSync(outputDir, { recursive: true });
clearInside(outputDir);

const gameDest = join(outputDir, 'game');
const shotsDest = join(outputDir, 'screenshots');
mkdirSync(gameDest, { recursive: true });
mkdirSync(shotsDest, { recursive: true });

const gameFiles = copyTreeSorted(gameDir, gameDest);
const shotFiles = copyTreeSorted(shotsDir, shotsDest);

const dossier = buildDossier(repoRoot, CAPS);
if (dossier.length === 0) fail('buildDossier wrote an empty dossier');
writeFileSync(join(outputDir, 'dossier.json'), dossier);

console.log(
  `wrote ${outputDir}: game ${gameFiles} files, screenshots ${shotFiles} files, dossier.json ${dossier.length} bytes`,
);
