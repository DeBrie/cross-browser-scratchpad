const encoder = new TextEncoder();
const b64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const hash = async (value) =>
  b64(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
const json = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, content-type",
    },
  });
async function proof(env, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(env.AUTH_PEPPER),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return b64(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}
async function session(request, env) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return (
    await env.DB.prepare(
      "SELECT account_id FROM sessions WHERE token_hash = ? AND expires_at > ?",
    )
      .bind(await hash(token), Date.now())
      .first()
  )?.account_id;
}
async function createSession(accountId, env) {
  const token = b64(crypto.getRandomValues(new Uint8Array(32)));
  await env.DB.prepare(
    "INSERT INTO sessions (token_hash, account_id, expires_at) VALUES (?, ?, ?)",
  )
    .bind(await hash(token), accountId, Date.now() + 2592000000)
    .run();
  return token;
}
export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return json({});
    const url = new URL(request.url);
    const body = ["POST", "PUT"].includes(request.method)
      ? await request.json().catch(() => null)
      : null;
    if (request.method === "POST" && url.pathname === "/v1/signup") {
      if (!body?.accountId || !body?.salt || !body?.authProof)
        return json({ error: "invalid request" }, 400);
      const exists = await env.DB.prepare(
        "SELECT account_id FROM accounts WHERE account_id=?",
      )
        .bind(body.accountId)
        .first();
      if (exists) return json({ error: "account exists" }, 409);
      await env.DB.prepare("INSERT INTO accounts VALUES (?, ?, ?, ?)")
        .bind(
          body.accountId,
          body.salt,
          await proof(env, body.authProof),
          Date.now(),
        )
        .run();
      return json(
        { token: await createSession(body.accountId, env), salt: body.salt },
        201,
      );
    }
    if (request.method === "POST" && url.pathname === "/v1/challenge") {
      if (!body?.accountId) return json({ error: "invalid request" }, 400);
      const account = await env.DB.prepare(
        "SELECT salt FROM accounts WHERE account_id=?",
      )
        .bind(body.accountId)
        .first();
      return account
        ? json({ salt: account.salt })
        : json({ error: "account not found" }, 404);
    }
    if (request.method === "POST" && url.pathname === "/v1/login") {
      if (!body?.accountId || !body?.authProof)
        return json({ error: "invalid request" }, 400);
      const account = await env.DB.prepare(
        "SELECT salt,auth_hash FROM accounts WHERE account_id=?",
      )
        .bind(body.accountId)
        .first();
      if (!account || account.auth_hash !== (await proof(env, body.authProof)))
        return json({ error: "invalid credentials" }, 401);
      return json({
        token: await createSession(body.accountId, env),
        salt: account.salt,
      });
    }
    const accountId = await session(request, env);
    if (!accountId) return json({ error: "unauthorized" }, 401);
    if (request.method === "GET" && url.pathname === "/v1/notes")
      return json({
        notes: (
          await env.DB.prepare(
            "SELECT note_key as key,ciphertext,iv,updated_at as updatedAt FROM notes WHERE account_id=?",
          )
            .bind(accountId)
            .all()
        ).results,
      });
    const match = /^\/v1\/notes\/([^/]+)$/.exec(url.pathname);
    if (
      request.method === "PUT" &&
      match &&
      body?.ciphertext &&
      body?.iv &&
      Number.isFinite(body?.updatedAt)
    ) {
      const key = decodeURIComponent(match[1]);
      const old = await env.DB.prepare(
        "SELECT * FROM notes WHERE account_id=? AND note_key=?",
      )
        .bind(accountId, key)
        .first();
      if (old && old.updated_at >= body.updatedAt)
        return json({ applied: false });
      if (old)
        await env.DB.prepare(
          "INSERT INTO note_revisions VALUES (?, ?, ?, ?, ?, ?)",
        )
          .bind(
            accountId,
            key,
            old.ciphertext,
            old.iv,
            old.updated_at,
            Date.now(),
          )
          .run();
      await env.DB.prepare(
        "INSERT OR REPLACE INTO notes VALUES (?, ?, ?, ?, ?)",
      )
        .bind(accountId, key, body.ciphertext, body.iv, body.updatedAt)
        .run();
      return json({ applied: true });
    }
    return json({ error: "not found" }, 404);
  },
};
