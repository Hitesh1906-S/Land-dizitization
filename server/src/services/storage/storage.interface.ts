import { Readable } from 'stream';

export interface StoredFileMetadata {
  fileKey: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileHash: string; // SHA-256 Checksum
}

export interface IStorageProvider {
  /**
   * Persists binary file to storage and computes SHA-256 hash.
   */
  saveFile(
    file: Express.Multer.File | { buffer: Buffer; originalname: string; mimetype: string },
    customKey?: string
  ): Promise<StoredFileMetadata>;

  /**
   * Retrieves readable stream for binary file.
   */
  getFileStream(filePathOrKey: string): Promise<Readable>;

  /**
   * Retrieves full binary buffer for file.
   */
  getFileBuffer(filePathOrKey: string): Promise<Buffer>;

  /**
   * Safely deletes binary file from storage.
   */
  deleteFile(filePathOrKey: string): Promise<boolean>;

  /**
   * Checks whether binary file exists in storage.
   */
  fileExists(filePathOrKey: string): Promise<boolean>;

  /**
   * Returns safe absolute filesystem path (for local storage or cache).
   */
  getAbsolutePath(filePathOrKey: string): string;
}
