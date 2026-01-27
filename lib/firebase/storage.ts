import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";

export async function uploadDxfFile(
  userId: string,
  fileName: string,
  file: File | Blob
): Promise<string> {
  const path = `dxf/${userId}/${Date.now()}_${fileName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
