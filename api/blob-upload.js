import { put } from "@vercel/blob";
import { isAuthenticated } from "./auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: "Login required." });
  }

  try {
    const chunks = [];

    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    if (!buffer.length) {
      return res.status(400).json({ error: "No file received." });
    }

    if (buffer.length > 50 * 1024 * 1024) {
      return res.status(400).json({
        error: "Image is too large. Keep it under 50MB."
      });
    }

    const filename =
      req.headers["x-file-name"] ||
      `vnhub-${Date.now()}.jpg`;

    const contentType =
      req.headers["content-type"] || "image/jpeg";

    const blob = await put(
  `vnhub/${Date.now()}-${filename}`,
  buffer,
  {
    access: "public",
    addRandomSuffix: true,
    contentType
  }
);

    return res.status(200).json({
      url: blob.url
    });
  } catch (error) {
    console.error("Blob upload error:", error);

    return res.status(500).json({
      error: error?.message || "Upload failed."
    });
  }
}
