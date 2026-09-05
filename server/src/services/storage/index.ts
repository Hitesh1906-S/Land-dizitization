import { IStorageProvider } from './storage.interface';
import { LocalStorageProvider } from './local.storage';

// Default pluggable storage provider (swap with S3StorageProvider or CloudStorageProvider when needed)
export const defaultStorageProvider: IStorageProvider = new LocalStorageProvider();

export * from './storage.interface';
export * from './local.storage';
