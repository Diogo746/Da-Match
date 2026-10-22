import type { VercelConfig } from "@vercel/config/v1";

// Evaluated during deployment; this value is never bundled into the Angular app.
const rawOrigin = process.env["BACKEND_ORIGIN"];
if (!rawOrigin) throw new Error("Configure BACKEND_ORIGIN in the Vercel environment.");
const invalidOriginMessage = "BACKEND_ORIGIN must be an exact HTTPS origin without credentials or a path.";
let backend: URL;
try { backend = new URL(rawOrigin); }
catch { throw new Error(invalidOriginMessage); }
if (backend.protocol !== "https:" || backend.username || backend.password ||
    backend.pathname !== "/" || backend.search || backend.hash) {
  throw new Error(invalidOriginMessage);
}

export const config: VercelConfig = {
  framework: "angular",
  buildCommand: "npm run build:api",
  outputDirectory: "dist/frontend-api/browser",
  rewrites: [
    { source: "/api/v1/:path*", destination: `${backend.origin}/api/v1/:path*` },
    { source: "/csrf", destination: `${backend.origin}/csrf` },
    { source: "/:path*", destination: "/index.html" },
  ],
  headers: [
    { source: "/api/v1/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    { source: "/csrf", headers: [{ key: "Cache-Control", value: "no-store" }] },
    { source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Frame-Options", value: "DENY" },
    ] },
  ],
};
