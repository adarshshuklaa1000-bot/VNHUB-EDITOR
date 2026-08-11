import { handleUpload } from "@vercel/blob/client";
import { isAuthenticated } from "./auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  try {
    const body =
      typeof req.body === "object"
        ? req.body
        : JSON.parse(req.body || "{}");

    const isCompletion =
      body?.type === "blob.upload-completed";

    if (!isCompletion && !isAuthenticated(req)) {
      return res.status(401).json({
        error: "Login required."
      });
    }

    const jsonResponse = await handleUpload({
      body,
      request: req,

      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp"
          ],
          maximumSizeInBytes: 50 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            purpose: "vnhub-template-upload"
          })
        };
      },

      onUploadCompleted: async () => {
        // Template metadata is saved separately.
      }
    });

    return res.status(200).json(jsonResponse);

  } catch (error) {
    console.error("Blob upload error:", error);

    return res.status(500).json({
      error: error?.message || "Upload failed."
    });
  }
}
