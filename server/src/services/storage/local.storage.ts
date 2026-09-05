import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Readable } from 'stream';
import { IStorageProvider, StoredFileMetadata } from './storage.interface';
import { env } from '../../config/env';
import { BadRequestError, NotFoundError } from '../../utils/AppError';

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor(baseDir: string = env.UPLOAD_DIR) {
    this.baseDir = path.resolve(baseDir);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  /**
   * Sanitizes relative key and prevents path traversal attacks.
   */
  public getAbsolutePath(filePathOrKey: string): string {
    if (filePathOrKey.includes('..')) {
      throw new BadRequestError('Security error: Path traversal attempt detected');
    }

    if (path.isAbsolute(filePathOrKey) && fs.existsSync(filePathOrKey)) {
      return filePathOrKey;
    }

    const key = path.basename(filePathOrKey);
    const resolvedPath = path.resolve(this.baseDir, key);

    // Guard against path traversal outside upload root
    if (!resolvedPath.startsWith(this.baseDir)) {
      throw new BadRequestError('Security error: Path traversal attempt detected');
    }

    return resolvedPath;
  }

  /**
   * Saves uploaded binary file, moves or writes to disk with a unique key, and calculates SHA-256.
   */
  async saveFile(
    file: Express.Multer.File | { buffer: Buffer; originalname: string; mimetype: string },
    customKey?: string
  ): Promise<StoredFileMetadata> {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const ext = rawExt || '.bin';
    const uniqueKey = customKey || `doc-${Date.now()}-${crypto.randomUUID()}${ext}`;
    const destinationPath = path.join(this.baseDir, uniqueKey);

    let fileHash: string;
    let fileSize: number;

    if ('path' in file && file.path && fs.existsSync(file.path)) {
      // Multer diskStorage file: copy/move to destination and calculate hash
      const fileBuffer = fs.readFileSync(file.path);
      fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      fileSize = file.size;

      if (path.resolve(file.path) !== path.resolve(destinationPath)) {
        fs.copyFileSync(file.path, destinationPath);
        try {
          fs.unlinkSync(file.path);
        } catch {
          // ignore cleanup error
        }
      }
    } else if ('buffer' in file && file.buffer) {
      // In-memory buffer
      fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
      fileSize = file.buffer.length;
      fs.writeFileSync(destinationPath, file.buffer);
    } else {
      throw new BadRequestError('Invalid file payload for storage');
    }

    return {
      fileKey: uniqueKey,
      filePath: path.relative(process.cwd(), destinationPath),
      fileName: path.basename(file.originalname),
      fileSize,
      fileType: file.mimetype,
      fileHash,
    };
  }

  async getFileStream(filePathOrKey: string): Promise<Readable> {
    const absPath = this.getAbsolutePath(filePathOrKey);
    if (!fs.existsSync(absPath)) {
      throw new NotFoundError(`Physical file not found on disk: ${filePathOrKey}`);
    }
    return fs.createReadStream(absPath);
  }

  async getFileBuffer(filePathOrKey: string): Promise<Buffer> {
    const absPath = this.getAbsolutePath(filePathOrKey);
    if (!fs.existsSync(absPath)) {
      throw new NotFoundError(`Physical file not found on disk: ${filePathOrKey}`);
    }
    return fs.readFileSync(absPath);
  }

  async deleteFile(filePathOrKey: string): Promise<boolean> {
    try {
      const absPath = this.getAbsolutePath(filePathOrKey);
      if (fs.existsSync(absPath)) {
        fs.unlinkSync(absPath);
        return true;
      }
      return false;
    } catch (err) {
      console.error(`Failed to delete physical file ${filePathOrKey}:`, err);
      return false;
    }
  }

  async fileExists(filePathOrKey: string): Promise<boolean> {
    try {
      const absPath = this.getAbsolutePath(filePathOrKey);
      return fs.existsSync(absPath);
    } catch {
      return false;
    }
  }
}
