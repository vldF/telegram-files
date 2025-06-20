import { useSettings } from "@/hooks/use-settings";
import { type ReactNode, useMemo } from "react";
import { Spoiler } from "spoiled";
import { cn } from "@/lib/utils";

export default function SpoiledWrapper({
  className,
  hasSensitiveContent,
  children,
}: {
  className?: string;
  hasSensitiveContent: boolean;
  children: ReactNode;
}) {
  const { settings } = useSettings();
  const hidden = useMemo(() => true, []);
  const showSensitiveContent = useMemo(
    () => settings?.showSensitiveContent === "true",
    [settings?.showSensitiveContent],
  );

  if (
    settings?.alwaysHide === "true" ||
    (hasSensitiveContent && !showSensitiveContent)
  ) {
    return (
      <Spoiler
        hidden={hidden}
        className={cn(className, "pointer-events-none")}
        tagName="div"
      >
        {children}
      </Spoiler>
    );
  }

  return <>{children}</>;
}
