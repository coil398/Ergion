import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const studio = resolve(import.meta.dirname, '..');
const root = resolve(studio, '..');

rmSync(resolve(root, 'target/doc'), { recursive: true, force: true });
execFileSync('cargo', ['doc', '-p', 'ergion-lab', '--no-deps'], {
  cwd: root,
  stdio: 'inherit',
});

const dest = resolve(studio, 'dist/doc');
rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(resolve(root, 'target/doc'), dest, { recursive: true });
