import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { NextApiRequest, NextApiResponse } from "next";

const allowedImageTypes: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function publicImageUrl(bucket: string, region: string, key: string) {
  const configuredBaseUrl = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
  const baseUrl = configuredBaseUrl || `https://${bucket}.s3.${region}.amazonaws.com`;
  return `${baseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const contentType = typeof req.body?.contentType === "string" ? req.body.contentType : "";
  const fileSize = typeof req.body?.fileSize === "number" ? req.body.fileSize : NaN;
  const extension = allowedImageTypes[contentType];
  if (!extension || !Number.isSafeInteger(fileSize) || fileSize <= 0 || fileSize > 5 * 1024 * 1024) {
    return res.status(400).json({ error: "Choose a PNG, JPEG, WebP or GIF image up to 5 MB." });
  }

  const bucket = process.env.S3_IMAGE_BUCKET;
  const region = process.env.AWS_REGION;
  if (!bucket || !region) {
    return res.status(503).json({ error: "Image uploads are not configured." });
  }

  const key = `categories/${Date.now()}.${extension}`;
  try {
    const uploadUrl = await getSignedUrl(
      new S3Client({ region }),
      new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
      { expiresIn: 300 },
    );
    return res.status(200).json({ uploadUrl, imageUrl: publicImageUrl(bucket, region, key) });
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error("Unknown AWS signing error");
    console.error("Unable to sign category image upload:", error.name, error.message);
    if (error.name === "CredentialsProviderError") {
      return res.status(503).json({ error: "AWS credentials are not available to the frontend server." });
    }
    return res.status(500).json({ error: "Unable to prepare the image upload." });
  }
}
