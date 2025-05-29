import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FileType } from "@/lib/types";
import useSWR from "swr";
import { Ellipsis } from "lucide-react";
import { Label } from "@/components/ui/label";
import * as React from "react";
import { useEffect } from "react";

interface FileTypeFilterProps {
  offline: boolean;
  telegramId: string;
  chatId: string;
  type: FileType | "all";
  onChange: (type: FileType | "all") => void;
}

export default function FileTypeFilter({
  offline,
  telegramId,
  chatId,
  type,
  onChange,
}: FileTypeFilterProps) {
  const [localType, setLocalType] = React.useState<FileType | "all">(type);
  const { data: counts, isLoading } = useSWR<Record<FileType, number>>(
    `/telegram/${telegramId}/chat/${chatId}/files/count?offline=${offline}`,
  );

  const handleTypeChange = (value: FileType | "all") => {
    setLocalType(value);
    onChange(value);
  };

  const FileTypeSelectItem = ({ value }: { value: FileType }) => {
    return (
      <SelectItem value={value}>
        <div className="flex items-center gap-5">
          <span className="w-10">
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
          {isLoading ? (
            <Ellipsis className="h-4 w-4 animate-pulse" />
          ) : (
            <span className="text-xs text-gray-400">
              {counts?.[value] ? `(${counts[value]})` : "(0)"}
            </span>
          )}
        </div>
      </SelectItem>
    );
  };

  useEffect(() => {
    if (!offline && localType === "all") {
      setLocalType("media");
      onChange("media");
    }
  }, [localType, offline, onChange]);

  return (
    <div className="space-y-2">
      <Label>Type</Label>
      <Select value={localType} onValueChange={handleTypeChange}>
        <SelectTrigger>
          <SelectValue placeholder="File type" />
        </SelectTrigger>
        <SelectContent>
          {offline && <SelectItem value="all">All Files</SelectItem>}
          <FileTypeSelectItem value="media" />
          <FileTypeSelectItem value="photo" />
          <FileTypeSelectItem value="video" />
          <FileTypeSelectItem value="audio" />
          <FileTypeSelectItem value="file" />
        </SelectContent>
      </Select>
    </div>
  );
}
