import { imgSrc, mediaUrl, mediaVideoUrl } from './image';

describe('product media URLs', () => {
  it('prefers uploaded images with zero-based indexing', () => {
    const product = { id: 'test', media: { images: ['https://cdn.beutepro.com/first.webp', '/uploads/second.png'] } };
    expect(mediaUrl(product)).toBe(product.media.images[0]);
    expect(mediaUrl(product, 1)).toBe(product.media.images[1]);
  });

  it('retains static paths for absent, empty or missing-index media', () => {
    expect(mediaUrl({ id: 'test' })).toBe(imgSrc('test', 1));
    expect(mediaUrl({ id: 'test', media: { images: [] } })).toBe(imgSrc('test', 1));
    expect(mediaUrl({ id: 'test', media: { images: ['uploaded'] } }, 2)).toBe(imgSrc('test', 3));
  });

  it('returns uploaded video or null so callers can choose the static fallback', () => {
    expect(mediaVideoUrl({ id: 'test' })).toBeNull();
    expect(mediaVideoUrl({ id: 'test', media: { video: null } })).toBeNull();
    expect(mediaVideoUrl({ id: 'test', media: { video: 'https://cdn.beutepro.com/test.mp4' } })).toBe('https://cdn.beutepro.com/test.mp4');
  });
});
