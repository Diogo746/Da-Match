import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

function command(binary, args) {
  try {
    return execFileSync(binary, args, { encoding: "utf8", timeout: 600_000, maxBuffer: 16 * 1024 * 1024 });
  } catch {
    // CLI diagnostics can contain credentials; do not echo captured output.
    throw new Error(`Backend deployment command failed: ${binary} ${args[0]}`);
  }
}

export function deployBackend(env, run = command, readHealth = readFileSync) {
  for (const key of ["VERCEL_TOKEN", "VERCEL_ORG_ID", "VERCEL_PROJECT_ID", "VERCEL_SCOPE", "GITHUB_SHA", "BACKEND_ORIGIN"]) {
    if (!env[key]) throw new Error(`Missing deployment configuration: ${key}`);
  }
  if (env.GITHUB_REF !== "refs/heads/main") throw new Error("Vercel backend releases require main");
  if (run("git", ["rev-parse", "HEAD"]).trim() !== env.GITHUB_SHA) throw new Error("Checkout differs from release commit");
  const origin = new URL(env.BACKEND_ORIGIN);
  if (origin.protocol !== "https:" || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) {
    throw new Error("Backend origin must be an exact HTTPS origin");
  }
  const scope = ["--scope", env.VERCEL_SCOPE];
  const api = path => JSON.parse(run("vercel", ["api", path, ...scope]));
  const team = api(`/v2/teams/${encodeURIComponent(env.VERCEL_ORG_ID)}`);
  if (team.billing?.plan !== "hobby" || team.billing.trial != null) throw new Error("Only active Hobby without trial is authorized");
  if (team.billing.status !== "active") throw new Error("Vercel team is not active");
  const query = `?teamId=${encodeURIComponent(env.VERCEL_ORG_ID)}`;
  const projectPath = `/v9/projects/${encodeURIComponent(env.VERCEL_PROJECT_ID)}`;
  const project = api(projectPath + query);
  if (project.id !== env.VERCEL_PROJECT_ID || project.accountId !== env.VERCEL_ORG_ID || project.framework !== "container") {
    throw new Error("Expected the separately configured Container backend project");
  }
  const domains = api(projectPath + "/domains" + query);
  if (!domains.domains?.some(domain => domain.name === origin.hostname && domain.verified &&
      !domain.gitBranch && !domain.customEnvironmentId && !domain.redirect)) {
    throw new Error("Backend origin is not a verified production domain of this project");
  }
  const region = env.VERCEL_BACKEND_REGION || "gru1";
  if (!/^[a-z]{3}\d$/.test(region)) throw new Error("Configure one Vercel backend region");
  const result = JSON.parse(run("vercel", ["deploy", "--prod", "--skip-domain", "--yes", "--json",
    "--project", env.VERCEL_PROJECT_ID, "--regions", region,
    "--meta", `migrationCommit=${env.GITHUB_SHA}`, ...scope]));
  const deployment = result.deployment;
  if (result.status !== "ok" || typeof deployment?.id !== "string" || !deployment.id || deployment.target !== "production") {
    throw new Error("Backend candidate was not created; domains remain unchanged");
  }
  const candidate = new URL(deployment.url.startsWith("https://") ? deployment.url : `https://${deployment.url}`);
  if (candidate.protocol !== "https:" || !candidate.hostname.endsWith(".vercel.app") ||
      candidate.username || candidate.password || candidate.pathname !== "/" || candidate.search || candidate.hash) {
    throw new Error("Unexpected candidate deployment URL");
  }
  // deploy --json may retain INITIALIZING even after the CLI has streamed the build.
  // Wait for completion, then verify the authoritative deployment and its provenance.
  run("vercel", ["inspect", candidate.origin, "--wait", "--timeout", "9m", ...scope]);
  const ready = api(`/v13/deployments/${encodeURIComponent(deployment.id)}` + query);
  const readyUrl = ready.url?.replace(/^https:\/\//, "");
  if (ready.id !== deployment.id || ready.projectId !== env.VERCEL_PROJECT_ID ||
      ready.target !== "production" || ready.readyState !== "READY" ||
      ready.meta?.migrationCommit !== env.GITHUB_SHA || readyUrl !== candidate.hostname) {
    throw new Error("Backend candidate readiness or provenance failed; domains remain unchanged");
  }
  const folder = mkdtempSync(join(tmpdir(), "damatch-backend-health-"));
  const body = join(folder, "health.json");
  run("vercel", ["curl", `${candidate.origin}/api/v1/health`, ...scope, "--", "-fsS", "--max-time", "45", "-o", body]);
  const health = JSON.parse(readHealth(body, "utf8"));
  if (health.status !== "UP" || health.environment !== "production" || health.application !== "fullstack-api-damatch") {
    throw new Error("Backend health did not confirm the application; domains remain unchanged");
  }
  run("vercel", ["promote", candidate.origin, "--yes", ...scope]);
  return { deploymentId: deployment.id, url: candidate.origin, commit: env.GITHUB_SHA };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(JSON.stringify(deployBackend(process.env)));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
