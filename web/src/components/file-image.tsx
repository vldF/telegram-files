import React, { useEffect, useState } from "react";
import Image from "next/image";
import { type TelegramFile } from "@/lib/types";
import {
  FileAudio2Icon,
  FileIcon,
  ImageIcon,
  ImageOff,
  VideoIcon,
} from "lucide-react";
import SpoiledWrapper from "@/components/spoiled-wrapper";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";

const ImageErrorFallback = ({
  className = "",
  message = "Image loading failed！",
}: {
  className?: string;
  message?: string;
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center rounded bg-gray-100 p-4",
      className,
    )}
  >
    <ImageOff className="mb-2 h-8 w-8 text-gray-400" />
    <p className="text-sm text-gray-500">{message}</p>
  </div>
);

// 图片尺寸计算帮助函数
const calculateImageDimensions = (
  width: number,
  height: number,
  maxHeight = 288,
) => {
  const aspectRatio = width / height;
  const calculatedHeight = Math.min(height, maxHeight);
  const calculatedWidth = calculatedHeight * aspectRatio;

  return { width: calculatedWidth, height: calculatedHeight };
};

// 文件图标选择器
const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case "photo":
      return <ImageIcon className="h-6 w-6" />;
    case "video":
      return <VideoIcon className="h-6 w-6" />;
    case "audio":
      return <FileAudio2Icon className="h-6 w-6" />;
    default:
      return <FileIcon className="h-6 w-6" />;
  }
};

// 统一的文件头像/预览组件
export default function FilePreview({
  file,
  isFullPreview = false,
  isGalleryLayout = false,
  className,
}: {
  file: TelegramFile;
  isFullPreview?: boolean;
  isGalleryLayout?: boolean;
  className?: string;
}) {
  const [viewportHeight, setViewportHeight] = useState(
    isFullPreview ? window.innerHeight : 288,
  );
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isFullPreview) {
      const handleResize = () => {
        setViewportHeight(window.innerHeight);
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [isFullPreview]);

  const handleError = () => {
    setError(true);
  };

  if (error) {
    return (
      <ImageErrorFallback
        className={cn("h-full min-h-[200px] w-full", className)}
      />
    );
  }

  // 确定图像源
  const getImageSource = (uniqueId: string) => {
    if (uniqueId) {
      return `${getApiUrl()}/${file.telegramId}/file/${uniqueId}`;
    }
    return `data:image/jpeg;base64,${file.thumbnail}`;
  };

  // 渲染有图像的文件
  const renderImage = (width: number, height: number, uniqueId: string) => {
    const src = getImageSource(uniqueId);

    const { width: calculatedWidth, height: calculatedHeight } =
      calculateImageDimensions(width, height, viewportHeight);

    const imageClasses = cn(
      "object-cover rounded",
      isFullPreview ? "h-auto max-h-screen w-auto object-contain" : "h-16 w-16",
      isGalleryLayout && "h-72 w-auto object-contain",
      className,
    );

    return (
      <SpoiledWrapper hasSensitiveContent={file.hasSensitiveContent}>
        <Image
          src={src}
          placeholder="blur"
          unoptimized={true}
          blurDataURL={`data:image/jpeg;base64,${file.thumbnail}`}
          alt={file.fileName ?? "文件预览"}
          width={calculatedWidth}
          height={calculatedHeight}
          className={imageClasses}
          onError={handleError}
        />
      </SpoiledWrapper>
    );
  };

  // 渲染没有图像的文件
  const renderFileIcon = () => (
    <div
      className={cn(
        "flex h-16 w-16 items-center justify-center rounded bg-muted",
        className,
      )}
    >
      {getFileIcon(file.type)}
    </div>
  );

  // 已下载的文件
  if (
    file.localPath &&
    (file.type === "photo" || file.mimeType?.startsWith("image/"))
  ) {
    if (file.extra?.width && file.extra?.height) {
      return renderImage(file.extra.width, file.extra.height, file.uniqueId);
    } else {
      return renderImage(600, 600, file.uniqueId);
    }
  }

  // 含义已下载的缩略图
  if (
    file.thumbnailFile?.mimeType.startsWith("image/") &&
    file.thumbnailFile?.extra?.width &&
    file.thumbnailFile.extra?.height
  ) {
    return renderImage(
      file.thumbnailFile.extra.width,
      file.thumbnailFile.extra.height,
      file.thumbnailFile.uniqueId,
    );
  }

  // base64缩略图
  if (file.thumbnail) {
    return renderImage(isFullPreview ? 600 : 32, isFullPreview ? 600 : 32, "");
  }

  return renderFileIcon();
}
