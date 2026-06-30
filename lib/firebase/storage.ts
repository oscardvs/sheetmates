import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";

export interface UploadedDxf {
  /** Storage object path, persisted so the original can be re-fetched for export. */
  path: string;
  /** Download URL (for previews / direct access). */
  url: string;
}

export async function uploadDxfFile(
  userId: string,
  fileName: string,
  file: File | Blob
): Promise<UploadedDxf> {
  const path = `dxf/${userId}/${Date.now()}_${fileName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { path, url };
}
