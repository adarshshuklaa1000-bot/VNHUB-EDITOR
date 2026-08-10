import crypto from "node:crypto";

const COOKIE = "__Host-vnhub_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || "CHANGE_THIS_SESSION_SECRET";
}

function sign(value) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

function makeToken() {
  const value = `${Date.now()}:${crypto.randomBytes(18).toString("base64url")}`;
  return `${value}.${sign(value)}`;
}

function validToken(token) {
  if (!token) return false;
  const i = token.lastIndexOf(".");
  if (i < 1) return false;
  const value = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = sign(value);
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  const timestamp = Number(value.split(":")[0]);
  return Number.isFinite(timestamp) && Date.now() - timestamp < MAX_AGE * 1000;
}

export function isAuthenticated(req) {
  const header = req.headers.cookie || "";
  const match = header.match(new RegExp(`${COOKIE}=([^;]+)`));
  return validToken(match?.[1]);
}

function headers(extra = {}) {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extra
  };
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).setHeader("Content-Type","application/json").setHeader("Cache-Control","no-store").json({ authenticated: isAuthenticated(req) });
  }

  if (req.method === "POST") {
    try {
      const body = typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");
      const supplied = String(body.password || "");
      const expected = String(process.env.ADMIN_PASSWORD || "");
      if (!expected) return res.status(500).setHeader("Content-Type","application/json").json({ error: "ADMIN_PASSWORD is not configured in Vercel." });
      if (!supplied || supplied !== expected) return res.status(401).setHeader("Content-Type","application/json").json({ error: "Wrong password." });

      const token = makeToken();
      res.setHeader("Set-Cookie", `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`);
      return res.status(200).setHeader("Content-Type","application/json").json({ authenticated: true });
    } catch {
      return res.status(400).setHeader("Content-Type","application/json").json({ error: "Invalid request." });
    }
  }

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    return res.status(200).setHeader("Content-Type","application/json").json({ authenticated: false });
  }

  res.setHeader("Allow","GET,POST,DELETE");
  return res.status(405).setHeader("Content-Type","application/json").json({ error: "Method not allowed." });
}

