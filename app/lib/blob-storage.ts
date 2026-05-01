import {
  BlobServiceClient,
  BlobSASPermissions,
} from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING!
);

const containerClient = blobServiceClient.getContainerClient(
  process.env.AZURE_STORAGE_CONTAINER_NAME!
);

export async function uploadFile(
  fileName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const blobName = `${uuidv4()}-${fileName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  return blockBlobClient.url;
}

/**
 * Generate a short-lived SAS URL the browser can PUT directly to,
 * bypassing serverless body-size limits (Vercel = 4.5MB).
 *
 * Returns both the SAS URL (for the browser) and the blobName
 * (echoed back to the server so we don't trust arbitrary URLs).
 */
export async function createUploadSasUrl(
  fileName: string,
  contentType: string,
  expiryMinutes = 15
): Promise<{ uploadUrl: string; blobName: string }> {
  const blobName = `${uuidv4()}-${fileName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const expiresOn = new Date(Date.now() + expiryMinutes * 60 * 1000);

  const uploadUrl = await blockBlobClient.generateSasUrl({
    permissions: BlobSASPermissions.parse("cw"),
    expiresOn,
    contentType,
  });

  return { uploadUrl, blobName };
}

/**
 * Download a previously-uploaded blob into a Buffer for server-side processing.
 */
export async function downloadBlob(
  blobName: string
): Promise<{ buffer: Buffer; contentType: string; size: number }> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const props = await blockBlobClient.getProperties();
  const buffer = await blockBlobClient.downloadToBuffer();
  return {
    buffer,
    contentType: props.contentType ?? "application/octet-stream",
    size: props.contentLength ?? buffer.length,
  };
}

export function getBlobUrl(blobName: string): string {
  return containerClient.getBlockBlobClient(blobName).url;
}
