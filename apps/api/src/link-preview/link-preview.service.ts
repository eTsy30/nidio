import { Injectable } from '@nestjs/common';

type LinkPreview = {
  title: string;
  description: string;
  image: string;
  url: string;
};

@Injectable()
export class LinkPreviewService {
  async get(url: string): Promise<LinkPreview | null> {
    try {
      const response = await fetch(
        `https://api.linkpreview.net/?q=${encodeURIComponent(url)}`,
        {
          headers: {
            'X-Linkpreview-Api-Key': process.env.LINKPREVIEW_API_KEY!,
          },
        },
      );

      if (!response.ok) return null;

      const preview = await response.json();

      return {
        title: preview.title ?? '',
        description: preview.description ?? '',
        image: preview.image ?? '',
        url: preview.url ?? url,
      };
    } catch {
      return null;
    }
  }
}
