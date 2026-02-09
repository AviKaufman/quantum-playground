const raw = process.versions.node || '';
const [major, minor, patch] = raw.split('.').map((x) => Number.parseInt(x, 10));

// Next.js' native tooling (SWC/Turbopack) can hang/crash on very new Node majors.
// Pin to LTS majors for predictable local dev and CI.
const ok =
  Number.isFinite(major) &&
  Number.isFinite(minor) &&
  Number.isFinite(patch) &&
  (major === 24 || major === 22 || (major === 20 && minor >= 9));

if (!ok) {
  // Keep this message short and actionable; it runs on every `npm run dev/build/...`.
  console.error(
    [
      `Unsupported Node.js v${raw} for this repo.`,
      `Use Node 24 LTS (recommended), Node 22 LTS, or Node 20.9+.`,
      ``,
      `If you use nvm:`,
      `  nvm install 24 && nvm use 24`,
    ].join('\n'),
  );
  process.exit(1);
}
