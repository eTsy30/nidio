import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

import type { UploadResult } from './types/upload-result.type';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);

  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    const provider = this.configService.getOrThrow<string>('STORAGE_PROVIDER');

    const endpoint = this.configService.getOrThrow<string>('STORAGE_ENDPOINT');

    const region = this.configService.getOrThrow<string>('STORAGE_REGION');

    const accessKey =
      this.configService.getOrThrow<string>('STORAGE_ACCESS_KEY');

    const secretKey =
      this.configService.getOrThrow<string>('STORAGE_SECRET_KEY');

    this.bucket = this.configService.getOrThrow<string>('STORAGE_BUCKET');

    this.apiUrl = this.configService.getOrThrow<string>('API_PUBLIC_URL');

    this.client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: provider === 'minio',
    });
  }

  async onModuleInit(): Promise<void> {
    await this.ensureBucket();
  }

  private async ensureBucket(): Promise<void> {
    try {
      await this.client.send(
        new HeadBucketCommand({
          Bucket: this.bucket,
        }),
      );

      this.logger.log(`Storage bucket "${this.bucket}" is ready`);
    } catch {
      this.logger.log(
        `Storage bucket "${this.bucket}" does not exist. Creating...`,
      );

      await this.client.send(
        new CreateBucketCommand({
          Bucket: this.bucket,
        }),
      );

      this.logger.log(`Storage bucket "${this.bucket}" created`);
    }
  }

  async upload(
    file: Buffer,
    key: string,
    contentType: string,
  ): Promise<UploadResult> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
      }),
    );

    return {
      key,
      url: this.getPublicUrl(key),
    };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async getObject(key: string) {
    return this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  getPublicUrl(key: string): string {
    const encodedKey = encodeURIComponent(key);

    return `${this.apiUrl.replace(/\/$/, '')}/storage/images/${encodedKey}`;
  }

  generateKey(prefix: string, extension: string): string {
    return `${prefix}/${randomUUID()}${extension}`;
  }
}
