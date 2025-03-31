import type { TelegramFile } from "@/lib/types";
import { FileAudio2Icon, FileIcon, ImageIcon, VideoIcon } from "lucide-react";
import SpoiledWrapper from "@/components/spoiled-wrapper";
import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function FileAvatar({
  isGalleryLayout = false,
  file,
  className,
}: {
  isGalleryLayout?: boolean;
  file: TelegramFile;
  className?: string;
}) {
  const getIcon = () => {
    switch (file.type) {
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

  return (
    <>
      {file.thumbnail ? (
        <SpoiledWrapper hasSensitiveContent={file.hasSensitiveContent}>
          <Image
            src={`data:image/jpeg;base64,${file.thumbnail}`}
            alt={file.fileName ?? "File thumbnail"}
            width={32}
            height={32}
            className={cn(
              "rounded object-cover",
              isGalleryLayout && "h-72 w-auto object-contain",
              className,
            )}
          />
        </SpoiledWrapper>
      ) : (
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded bg-muted",
            className,
          )}
        >
          {getIcon()}
        </div>
      )}
    </>
  );
}
