import assert from "node:assert/strict";
import { test } from "node:test";
import { deployBackend } from "./deploy_vercel_backend.mjs";

const env = { VERCEL_TOKEN: "test-only", VERCEL_ORG_ID: "team-test", VERCEL_PROJECT_ID: "backend-test",
  VERCEL_SCOPE: "test", GITHUB_SHA: "abc123", GITHUB_REF: "refs/heads/main", BACKEND_ORIGIN: "https://backend.example.test" };

function fixture(options = {}) {
  const calls = [];
  const run = (binary, args) => {
    calls.push([binary, ...args]);
    if (binary === "git") return options.commit || "abc123";
    if (args[0] === "api" && args[1].startsWith("/v2/teams/")) return JSON.stringify({ billing: {plan:options.plan || "hobby",trial:null,status:"active"} });
    if (args[0] === "api" && args[1].includes("/domains")) return JSON.stringify({domains:[{name:options.domain || "backend.example.test",verified:true}]});
    if (args[0] === "api") return JSON.stringify({id:options.project || "backend-test",accountId:"team-test",framework:"container"});
    if (args[0] === "deploy") return JSON.stringify({status:"ok",deployment:{id:"test-deploy",url:"candidate.vercel.app",target:"production",readyState:options.state || "READY"}});
    return "";
  };
  const health = () => JSON.stringify({status:options.health || "UP",environment:"production",application:"fullstack-api-damatch"});
  return { calls, run, health };
}

test("stages the exact commit, checks health, then promotes the same candidate", () => {
  const f=fixture();
  assert.deepEqual(deployBackend(env,f.run,f.health),{deploymentId:"test-deploy",url:"https://candidate.vercel.app",commit:"abc123"});
  const deployment=f.calls.find(call=>call[1]==="deploy");
  assert.ok(deployment.includes("--skip-domain"));
  assert.ok(deployment.includes("migrationCommit=abc123"));
  assert.ok(f.calls.findIndex(call=>call[1]==="curl") < f.calls.findIndex(call=>call[1]==="promote"));
  assert.equal(f.calls.at(-1)[2],"https://candidate.vercel.app");
  assert.ok(f.calls.every(call=>!call.includes("--token")));
});

for (const options of [{plan:"pro"},{commit:"other"},{project:"frontend"},{domain:"other.example.test"},
  {state:"ERROR"},{health:"DOWN"}]) {
  test(`does not promote on a failed release boundary ${JSON.stringify(options)}`, () => {
    const f=fixture(options);
    assert.throws(()=>deployBackend(env,f.run,f.health));
    assert.ok(f.calls.every(call=>call[1]!=="promote"));
  });
}

test("rejects a tag, missing settings, or a credential-bearing origin before deployment", () => {
  for (const settings of [{GITHUB_REF:"refs/tags/v1"},{VERCEL_TOKEN:""},{BACKEND_ORIGIN:"https://user:password@example.test"}]) {
    const f=fixture();
    assert.throws(()=>deployBackend({...env,...settings},f.run,f.health));
    assert.ok(f.calls.every(call=>call[1]!=="deploy"));
  }
});
