export interface UploadResult {
  fileUrl: string;
  storageProvider: string;
  isPrivate: boolean;
}

export interface StorageProvider {
  storeFile(fileName: string, buffer: Buffer, mimeType: string, isPrivate?: boolean): Promise<UploadResult>;
}

class LocalStorageProvider implements StorageProvider {
  async storeFile(fileName: string, buffer: Buffer, mimeType: string, isPrivate = true): Promise<UploadResult> {
    // Stores file URL reference
    const url = `https://storage.local/documents/${encodeURIComponent(fileName)}`;
    return {
      fileUrl: url,
      storageProvider: 'LOCAL',
      isPrivate,
    };
  }
}

class S3CompatibleStorageProvider implements StorageProvider {
  async storeFile(fileName: string, buffer: Buffer, mimeType: string, isPrivate = true): Promise<UploadResult> {
    const bucket = process.env.S3_BUCKET || 'universal-hrms-documents';
    const region = process.env.S3_REGION || 'us-east-1';
    const url = `https://${bucket}.s3.${region}.amazonaws.com/documents/${encodeURIComponent(fileName)}`;
    return {
      fileUrl: url,
      storageProvider: 'S3',
      isPrivate,
    };
  }
}

const activeProvider = process.env.STORAGE_PROVIDER || 'LOCAL';
export const storageProvider: StorageProvider =
  activeProvider === 'S3' ? new S3CompatibleStorageProvider() : new LocalStorageProvider();
