"use client";
import { Header } from "@/components/header";
import { EmptyState } from "@/components/empty-state";
import { useSearchParams } from "next/navigation";
import Files from "@/components/files";
import useIsMobile from "@/hooks/use-is-mobile";
import { MobileHeader } from "@/components/mobile/mobile-header";

export default function AccountPage() {
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const accountId = searchParams.get("id");
  const chatId = searchParams.get("chatId");
  const messageThreadId = searchParams.get("messageThreadId")
    ? Number(searchParams.get("messageThreadId"))
    : undefined;

  return (
    <div className="container mx-auto px-4 py-6">
      {isMobile ? <MobileHeader /> : <Header />}
      {accountId && chatId ? (
        <Files
          accountId={accountId}
          chatId={chatId}
          messageThreadId={messageThreadId}
        />
      ) : (
        <EmptyState hasAccounts={true} message="Select a chat to view files" />
      )}
    </div>
  );
}
