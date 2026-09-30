import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ignored = new Set(['.git', 'node_modules', 'dist', '.sites-runtime', 'test-results', 'playwright-report']);
const files = [];
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Unexpected symbolic link: ' + file);
    if (entry.isDirectory()) walk(file); else files.push(file);
  }
}
walk('.');
const problems = [];
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|sk-(?:proj-)?[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})\b/,
  /https?:\/\/[^/\s:@]+:[^/\s@]+@/,
];
for (const file of files) {
  const normalized = file.replaceAll('\\', '/');
  if (/\.(?:jpg|jpeg|png|svg)$/i.test(file)) continue;
  if ((path.basename(file).startsWith('.env') && path.basename(file) !== '.env.example') || /(?:^|\/)(?:\.aws|\.agents|\.codex)(?:\/|$)/.test(normalized) || /\.(?:sqlite|db|har|pem|key)$/i.test(file)) problems.push({ file, issue: 'private or runtime artifact' });
  if (normalized.startsWith('.openai/') && normalized !== '.openai/hosting.json') problems.push({ file, issue: 'unexpected hosting file' });
  const text = readFileSync(file, 'utf8');
  if (secretPatterns.some(pattern => pattern.test(text))) problems.push({ file, issue: 'possible secret' });
  const emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g) ?? [];
  if (emails.some(email => !/@(?:example\.test|users\.noreply\.github\.com)$/.test(email))) problems.push({ file, issue: 'non-demo contact address' });
}
const hosting = JSON.parse(readFileSync('.openai/hosting.json', 'utf8'));
if (Object.keys(hosting).some(key => !['project_id', 'static'].includes(key)) || Object.keys(hosting.static ?? {}).some(key => key !== 'directory')) problems.push({ file: '.openai/hosting.json', issue: 'unexpected hosting metadata' });
const photos = JSON.parse(readFileSync('src/data/photo-credits.json', 'utf8'));
if (photos.length !== 8 || photos.some(photo => !photo.author || !photo.sourcePageUrl.startsWith('https://commons.wikimedia.org/') || !photo.licenseUrl.startsWith('https://creativecommons.org/'))) problems.push({ file: 'src/data/photo-credits.json', issue: 'missing or unexpected license attribution' });
console.log(JSON.stringify({ scannedFiles: files.length, photographs: photos.length, problems }, null, 2));
if (problems.length) process.exitCode = 1;
