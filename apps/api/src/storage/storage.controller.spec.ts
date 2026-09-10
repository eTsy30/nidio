/// <reference types="jest" />
import { BadRequestException } from '@nestjs/common';
import type { Express } from 'express';

import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

describe('StorageController image validation', () => {
  const storage = {
    generateKey: jest.fn(() => 'users/user/images/file.png'),
    upload: jest.fn(async () => ({
      url: 'https://storage.example.test/file.png',
    })),
  };
  const controller = new StorageController(
    storage as unknown as StorageService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    storage.generateKey.mockReturnValue('users/user/images/file.png');
    storage.upload.mockResolvedValue({
      url: 'https://storage.example.test/file.png',
    });
  });

  function file(mimetype: string, buffer: Buffer): Express.Multer.File {
    return { mimetype, buffer, size: buffer.length } as Express.Multer.File;
  }

  it('uploads a valid PNG using its verified MIME type', async () => {
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    await controller.uploadImage(file('image/png', png), 'user');

    expect(storage.generateKey).toHaveBeenCalledWith(
      'users/user/images',
      '.png',
    );
    expect(storage.upload).toHaveBeenCalledWith(
      png,
      expect.any(String),
      'image/png',
    );
  });

  it('rejects a MIME type that does not match file bytes', async () => {
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    await expect(
      controller.uploadImage(file('image/jpeg', png), 'user'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it('rejects non-image bytes presented as an image', async () => {
    await expect(
      controller.uploadImage(
        file('image/webp', Buffer.from('not an image')),
        'user',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.upload).not.toHaveBeenCalled();
  });
});
