import sharp from 'sharp';
import type { Page, ElementHandle, Locator } from 'playwright';

export interface ScreenshotOptions {
  /** Maximum width in pixels (default: 8000) */
  maxWidth?: number;
  /** Maximum height in pixels (default: 8000) */
  maxHeight?: number;
  /** Quality for JPEG format (1-100, default: 90) */
  quality?: number;
  /** Output format (default: 'png') */
  format?: 'png' | 'jpeg';
  /** Path to save the screenshot (optional) */
  path?: string;
  /** Additional Playwright screenshot options */
  playwrightOptions?: Parameters<Page['screenshot']>[0];
}

export interface ScreenshotResult {
  buffer: Buffer;
  resized: boolean;
  originalDimensions?: { width: number; height: number };
  finalDimensions: { width: number; height: number };
}

/**
 * Captures a screenshot with automatic resizing to prevent dimension limit errors
 */
export async function captureScreenshotSafe(
  page: Page,
  options: ScreenshotOptions = {}
): Promise<ScreenshotResult> {
  const {
    maxWidth = 8000,
    maxHeight = 8000,
    quality = 90,
    format = 'png',
    path,
    playwrightOptions = {}
  } = options;

  // Capture screenshot as buffer
  const buffer = await page.screenshot({
    ...playwrightOptions,
    type: format
  });

  return await processScreenshotBuffer(buffer, {
    maxWidth,
    maxHeight,
    quality,
    format,
    path
  });
}

/**
 * Captures an element screenshot with automatic resizing
 */
export async function captureElementScreenshotSafe(
  element: ElementHandle | Locator,
  options: ScreenshotOptions = {}
): Promise<ScreenshotResult> {
  const {
    maxWidth = 8000,
    maxHeight = 8000,
    quality = 90,
    format = 'png',
    path,
    playwrightOptions = {}
  } = options;

  // Capture screenshot as buffer
  const buffer = await element.screenshot({
    ...playwrightOptions,
    type: format
  });

  return await processScreenshotBuffer(buffer, {
    maxWidth,
    maxHeight,
    quality,
    format,
    path
  });
}

/**
 * Processes a screenshot buffer and resizes if necessary
 */
async function processScreenshotBuffer(
  buffer: Buffer,
  options: {
    maxWidth: number;
    maxHeight: number;
    quality: number;
    format: 'png' | 'jpeg';
    path?: string;
  }
): Promise<ScreenshotResult> {
  const { maxWidth, maxHeight, quality, format, path } = options;

  // Get image metadata
  const sharpInstance = sharp(buffer);
  const metadata = await sharpInstance.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read image dimensions');
  }

  const originalDimensions = {
    width: metadata.width,
    height: metadata.height
  };

  // Check if resizing is needed
  if (metadata.width > maxWidth || metadata.height > maxHeight) {
    // Calculate new dimensions maintaining aspect ratio
    const ratio = Math.min(maxWidth / metadata.width, maxHeight / metadata.height);
    const newWidth = Math.floor(metadata.width * ratio);
    const newHeight = Math.floor(metadata.height * ratio);

    // Resize the image
    const processedBuffer = await sharpInstance
      .resize(newWidth, newHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFormat(format, { quality })
      .toBuffer();

    // Save to file if path is provided
    if (path) {
      await sharp(processedBuffer).toFile(path);
    }

    return {
      buffer: processedBuffer,
      resized: true,
      originalDimensions,
      finalDimensions: { width: newWidth, height: newHeight }
    };
  }

  // No resizing needed
  let finalBuffer = buffer;

  // Apply quality compression if format is JPEG
  if (format === 'jpeg') {
    finalBuffer = await sharpInstance
      .toFormat('jpeg', { quality })
      .toBuffer();
  }

  // Save to file if path is provided
  if (path) {
    await sharp(finalBuffer).toFile(path);
  }

  return {
    buffer: finalBuffer,
    resized: false,
    finalDimensions: originalDimensions
  };
}

/**
 * Quick utility to resize any image buffer to stay within limits
 */
export async function resizeImageBuffer(
  buffer: Buffer,
  maxWidth: number = 8000,
  maxHeight: number = 8000,
  quality: number = 90
): Promise<Buffer> {
  const sharpInstance = sharp(buffer);
  const metadata = await sharpInstance.metadata();

  if (!metadata.width || !metadata.height) {
    return buffer;
  }

  if (metadata.width > maxWidth || metadata.height > maxHeight) {
    return sharpInstance
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality })
      .toBuffer();
  }

  return buffer;
}

/**
 * Utility to check if an image buffer exceeds dimension limits
 */
export async function checkImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number; exceedsLimit: boolean }> {
  const metadata = await sharp(buffer).metadata();
  
  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read image dimensions');
  }

  return {
    width: metadata.width,
    height: metadata.height,
    exceedsLimit: metadata.width > 8000 || metadata.height > 8000
  };
}

/**
 * Safe screenshot wrapper that prevents viewport issues
 */
export async function captureFullPageScreenshotSafe(
  page: Page,
  options: ScreenshotOptions = {}
): Promise<ScreenshotResult> {
  // Set a reasonable viewport size to prevent massive screenshots
  const currentViewport = page.viewportSize();
  await page.setViewportSize({ width: 1920, height: 1080 });

  try {
    const result = await captureScreenshotSafe(page, {
      ...options,
      playwrightOptions: {
        ...options.playwrightOptions,
        fullPage: true
      }
    });

    // Restore original viewport
    if (currentViewport) {
      await page.setViewportSize(currentViewport);
    }

    return result;
  } catch (error) {
    // Restore viewport on error
    if (currentViewport) {
      await page.setViewportSize(currentViewport);
    }
    throw error;
  }
}