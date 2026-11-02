import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { z } from "zod";
import { canSendEmail, safeEmailFailure, notificationKey } from "../../supabase/functions/_shared/email-safety.ts";

type Handler = (req: Request) => Promise<Response>;
function sender(admin: boolean) {
  let handler: Handler | undefined;
  let deliveries = 0;
  const logs: Record<string, unknown>[] = [];
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: "signed-in-user" } }, error: null }) },
    from: (table: string) => {
      const query = {
        select: () => query,
        eq: () => query,
        maybeSingle: async () => ({ data: table === "user_roles" && admin ? { user_id: "signed-in-user" } : null, error: null }),
        insert: (row: Record<string, unknown>) => { logs.push({ ...row, id: "log-1" }); return query; },
        single: async () => ({ data: { id: "log-1" }, error: null }),
        update: (row: Record<string, unknown>) => { Object.assign(logs[0] ?? {}, row); return query; },
      };
      return query;
    },
  };
  const source = readFileSync(new URL("../../supabase/functions/send-app-email/index.ts", import.meta.url), "utf8").replace(/^import .*;\n/gm, "");
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  new Function("serve", "createClient", "z", "EmailAPIError", "sendLovableEmail", "cors", "canSendEmail", "safeEmailFailure", "Deno", code)(
    (value: Handler) => { handler = value; }, () => client, z, Error,
    async () => { deliveries += 1; }, {}, canSendEmail, safeEmailFailure,
    { env: { get: (key: string) => key === "SUPABASE_SERVICE_ROLE_KEY" ? "internal-test-only" : "local-test-value" } },
  );
  return {
    logs, count: () => deliveries,
    request: async (bearer: string, isTest: boolean) => {
      if (!handler) throw new Error("Handler not registered");
      return handler(new Request("https://local.invalid", { method: "POST", headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" }, body: JSON.stringify({ templateName: "registration-confirmation", recipientEmail: "no-delivery@example.invalid", _isTest: isTest, subject: "Test", html: "<p>Test</p>", idempotencyKey: "unit-test-event" }) }));
    },
  };
}

test("actual send handler denies signed-in non-admin test and transactional requests", async () => {
  const app = sender(false);
  assert.equal((await app.request("ordinary-user-session", true)).status, 403);
  assert.equal((await app.request("ordinary-user-session", false)).status, 403);
  assert.equal(app.count(), 0);
  assert.equal(app.logs.length, 0);
});

test("actual send handler allows admin tests but denies admin transactional requests", async () => {
  const app = sender(true);
  assert.equal((await app.request("admin-session", false)).status, 403);
  assert.equal((await app.request("admin-session", true)).status, 200);
  assert.equal(app.count(), 1);
  assert.equal(app.logs[0]?.status, "sent");
});

test("internal FT Standard and Premium confirmations reach provider mock and record accepted outcome", async () => {
  for (const token of ["PK-PRE-STNDRD", "PK-PRE-PREMUM"]) {
    const app = sender(false);
    assert.equal(notificationKey("registration", token, "approved"), `participant-registration-${token}-approved-`);
    assert.equal((await app.request("internal-test-only", false)).status, 200);
    assert.equal(app.logs[0]?.status, "sent");
    assert.equal(app.count(), 1);
  }
});