import { handleUpload } from "@vercel/blob/client";
import { isAuthenticated } from "./auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const body = typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");

    // Blob sends the completion callback without the browser's session cookie.
    // Token generation itself must be authenticated.
    const isCompletion = body?.type === "blob.upload-completed";
    if (!isCompletion && !isAuthenticated(req)) {
      return res.status(401).json({ error: "Login required." });
    }

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
        maximumSizeInBytes: 50 * 1024 * 1024,
        addRandomSuffix: true,
        validUntil: Date.now() + 15 * 60 * 1000
      }),
      onUploadCompleted: async () => {
        // Metadata is saved by /api/templates after the upload URL is returned.
      }
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error?.message || "Upload failed." });
  }
}
