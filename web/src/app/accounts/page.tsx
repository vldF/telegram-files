"use client";
import { Header } from "@/components/header";
import { EmptyState } from "@/components/empty-state";
import { useRouter, useSearchParams } from "next/navigation";
import Files from "@/components/files";
import useIsMobile from "@/hooks/use-is-mobile";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { Button } from "@/components/ui/button";
import { WandSparkles } from "lucide-react";
import { TooltipWrapper } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";

export default function AccountPage() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountId = searchParams.get("id");
  const chatId = searchParams.get("chatId");
  const messageThreadId = searchParams.get("messageThreadId")
    ? Number(searchParams.get("messageThreadId"))
    : undefined;
  const link = searchParams.get("link") ?? undefined;

  function handleParseLink() {
    // Get the link from clipboard
    navigator.clipboard
      .readText()
      .then((text) => {
        if (text) {
          // Check if the text is a valid Telegram link
          const telegramLinkRegex = /https?:\/\/t\.me\/([a-zA-Z0-9_]+)/;
          const match = telegramLinkRegex.exec(text);
          if (!match) {
            toast({
              title: "Invalid link",
              description:
                "Please copy a valid Telegram link. Example: https://t.me/username",
              variant: "error",
            });
            return;
          }
          toast({
            title: "Parsing link...",
            description: `Parsing link: ${text}`,
            variant: "success",
          });
          // Redirect to the account page with the parsed link
          router.push(`/accounts?id=${accountId}&link=${window.encodeURIComponent(text)}`);
        } else {
          toast({
            title: "No link found in clipboard",
            description: "Please copy a Telegram link to parse.",
            variant: "info",
          });
        }
      })
      .catch((err) => {
        console.error("Failed to read clipboard contents: ", err);
      });
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {isMobile ? <MobileHeader /> : <Header />}
      {(accountId && chatId) || (accountId && link) ? (
        <Files
          accountId={accountId}
          chatId={chatId ?? "-1"}
          messageThreadId={messageThreadId}
          link={link}
        />
      ) : (
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <EmptyState
            hasAccounts={true}
            message="Select a chat to view files"
          />
          <TooltipWrapper content="You can parse links from Telegram chats to get files directly.">
            <Button className="mt-4" onClick={handleParseLink}>
              <WandSparkles className="mr-2 h-4 w-4" />
              Parse Link
            </Button>
          </TooltipWrapper>
        </div>
      )}
    </div>
  );
}
