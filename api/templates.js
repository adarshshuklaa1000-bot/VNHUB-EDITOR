import { del, get, put } from "@vercel/blob";
import { isAuthenticated } from "./auth.js";

const DATA_PATH = "vnhub/data/templates.json";

async function readTemplates() {
  try {
    const result = await get(DATA_PATH, { access: "public" });

    if (!result || result.statusCode !== 200) return [];

    const text = await new Response(result.stream).text();
    const parsed = JSON.parse(text);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Read templates failed:", error);
    return [];
  }
}

async function writeTemplates(templates) {
  await put(
    DATA_PATH,
    JSON.stringify(templates, null, 2),
    {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60
    }
  );
}

function json(res, status, data) {
  res.status(status);
  res.setHeader(
    "Content-Type",
    "application/json; charset=utf-8"
  );
  res.setHeader("Cache-Control", "no-store");

  return res.json(data);
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const templates = await readTemplates();

      return json(res, 200, {
        templates
      });
    }

    if (!isAuthenticated(req)) {
      return json(res, 401, {
        error: "Login required."
      });
    }

    if (req.method === "POST") {
      const body =
        typeof req.body === "object"
          ? req.body
          : JSON.parse(req.body || "{}");

      const t = body.template;

      if (
        !t?.name ||
        !t?.code ||
        !t?.image ||
        !t?.qr
      ) {
        return json(res, 400, {
          error:
            "Name, VN code, image and QR are required."
        });
      }

      const templates = await readTemplates();

      templates.unshift({
        id: Number(t.id) || Date.now(),
        name: String(t.name).slice(0, 120),
        category: String(
          t.category || "Trending"
        ).slice(0, 40),
        description: String(
          t.description || ""
        ).slice(0, 1000),
        code: String(t.code).slice(0, 2000),
        image: String(t.image),
        qr: String(t.qr),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      await writeTemplates(templates);

      return json(res, 200, {
        ok: true
      });
    }

    if (req.method === "PUT") {
      const body =
        typeof req.body === "object"
          ? req.body
          : JSON.parse(req.body || "{}");

      const t = body.template;

      if (
        !t?.id ||
        !t?.name ||
        !t?.code ||
        !t?.image ||
        !t?.qr
      ) {
        return json(res, 400, {
          error: "Incomplete template data."
        });
      }

      const templates = await readTemplates();

      const index = templates.findIndex(
        x => String(x.id) === String(t.id)
      );

      if (index < 0) {
        return json(res, 404, {
          error: "Template not found."
        });
      }

      const old = templates[index];

      templates[index] = {
        ...old,
        id: old.id,
        name: String(t.name).slice(0, 120),
        category: String(
          t.category || "Trending"
        ).slice(0, 40),
        description: String(
          t.description || ""
        ).slice(0, 1000),
        code: String(t.code).slice(0, 2000),
        image: String(t.image),
        qr: String(t.qr),
        updatedAt: new Date().toISOString()
      };

      await writeTemplates(templates);

      const oldImage = body.oldImage;
      const oldQR = body.oldQR;

      if (
        oldImage &&
        oldImage !== t.image
      ) {
        await safeDelete(oldImage);
      }

      if (
        oldQR &&
        oldQR !== t.qr
      ) {
        await safeDelete(oldQR);
      }

      return json(res, 200, {
        ok: true
      });
    }

    if (req.method === "DELETE") {
      const body =
        typeof req.body === "object"
          ? req.body
          : JSON.parse(req.body || "{}");

      const id = String(body.id || "");

      const templates = await readTemplates();

      const found = templates.find(
        x => String(x.id) === id
      );

      if (!found) {
        return json(res, 404, {
          error: "Template not found."
        });
      }

      const next = templates.filter(
        x => String(x.id) !== id
      );

      await writeTemplates(next);

      if (found.image) {
        await safeDelete(found.image);
      }

      if (found.qr) {
        await safeDelete(found.qr);
      }

      return json(res, 200, {
        ok: true
      });
    }

    res.setHeader(
      "Allow",
      "GET,POST,PUT,DELETE"
    );

    return json(res, 405, {
      error: "Method not allowed."
    });

  } catch (error) {
    console.error(
      "Templates API error:",
      error
    );

    return json(res, 500, {
      error:
        error?.message ||
        "Server error."
    });
  }
}

async function safeDelete(url) {
  try {
    await del(url);
  } catch (error) {
    console.error(
      "Blob delete failed:",
      error
    );
  }
        }
