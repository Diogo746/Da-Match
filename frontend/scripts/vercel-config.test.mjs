import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { test } from "node:test";

const script = "import('./vercel.ts').then(({config}) => process.stdout.write(JSON.stringify(config)))";
const cwd = new URL("../", import.meta.url);

test("Vercel routes only API/CSRF to the HTTPS environment origin before the SPA fallback", () => {
  const output = execFileSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd, env: { ...process.env, BACKEND_ORIGIN: "https://backend.example.test" }, encoding: "utf8",
  });
  const config = JSON.parse(output);
  assert.equal(config.buildCommand, "npm run build:api");
  assert.equal(config.outputDirectory, "dist/frontend-api/browser");
  assert.deepEqual(config.rewrites, [
    { source: "/api/v1/:path*", destination: "https://backend.example.test/api/v1/:path*" },
    { source: "/csrf", destination: "https://backend.example.test/csrf" },
    { source: "/:path*", destination: "/index.html" },
  ]);
  for (const source of ["/api/v1/:path*", "/csrf"]) {
    assert.equal(config.headers.find(item => item.source === source).headers[0].value, "no-store");
  }
});

for (const origin of ["", "http://backend.example.test", "https://backend.example.test/path",
  "https://backend.example.test?key=value", "https://backend.example.test#fragment",
  "https://user@backend.example.test", "not-a-url"]) {
  test(`invalid backend origin is rejected before deploy: ${origin || "missing"}`, () => {
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd, env: { ...process.env, BACKEND_ORIGIN: origin }, encoding: "utf8",
    });
    assert.notEqual(result.status, 0);
  });
}
