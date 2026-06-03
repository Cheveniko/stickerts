import * as m from "$lib/paraglide/messages";

const LISTING_IMAGE_ASPECT_RATIO = 3 / 4;
const LISTING_IMAGE_MAX_WIDTH = 1080;
const LISTING_IMAGE_MAX_HEIGHT = 1440;
const LISTING_IMAGE_JPEG_QUALITY = 0.85;

export const LISTING_IMAGE_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
] as const;

export type ListingImageContentType =
  (typeof LISTING_IMAGE_ACCEPTED_TYPES)[number];

export type ProcessedListingImage = {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  contentType: ListingImageContentType;
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(m.error_image_read_failed()));
    };

    image.src = objectUrl;
  });
}

function getCenteredCropRect(
  width: number,
  height: number,
  targetAspectRatio: number,
) {
  const sourceAspectRatio = width / height;

  if (sourceAspectRatio > targetAspectRatio) {
    const cropWidth = height * targetAspectRatio;

    return {
      x: (width - cropWidth) / 2,
      y: 0,
      width: cropWidth,
      height,
    };
  }

  const cropHeight = width / targetAspectRatio;

  return {
    x: 0,
    y: (height - cropHeight) / 2,
    width,
    height: cropHeight,
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  contentType: ListingImageContentType,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(m.error_image_process_failed()));
          return;
        }

        resolve(blob);
      },
      contentType,
      contentType === "image/jpeg" ? LISTING_IMAGE_JPEG_QUALITY : undefined,
    );
  });
}

function replaceFileExtension(fileName: string, extension: string) {
  const lastDotIndex = fileName.lastIndexOf(".");
  const baseName =
    lastDotIndex === -1 ? fileName : fileName.slice(0, lastDotIndex);

  return `${baseName}.${extension}`;
}

export async function processListingImage(
  file: File,
): Promise<ProcessedListingImage> {
  if (
    !LISTING_IMAGE_ACCEPTED_TYPES.includes(file.type as ListingImageContentType)
  ) {
    throw new Error(m.error_upload_invalid_type());
  }

  const contentType = file.type as ListingImageContentType;
  const image = await loadImage(file);
  const cropRect = getCenteredCropRect(
    image.naturalWidth,
    image.naturalHeight,
    LISTING_IMAGE_ASPECT_RATIO,
  );
  const resizeScale = Math.min(
    1,
    LISTING_IMAGE_MAX_WIDTH / cropRect.width,
    LISTING_IMAGE_MAX_HEIGHT / cropRect.height,
  );
  const outputWidth = Math.max(1, Math.round(cropRect.width * resizeScale));
  const outputHeight = Math.max(1, Math.round(cropRect.height * resizeScale));

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error(m.error_image_prepare_failed());
  }

  context.drawImage(
    image,
    cropRect.x,
    cropRect.y,
    cropRect.width,
    cropRect.height,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  const blob = await canvasToBlob(canvas, contentType);
  const extension = contentType === "image/png" ? "png" : "jpg";
  const processedFile = new File(
    [blob],
    replaceFileExtension(file.name, extension),
    {
      type: contentType,
      lastModified: Date.now(),
    },
  );

  return {
    file: processedFile,
    previewUrl: URL.createObjectURL(processedFile),
    width: outputWidth,
    height: outputHeight,
    contentType,
  };
}
