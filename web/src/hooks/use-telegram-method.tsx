import useSWRMutation from "swr/mutation";
import type { TelegramApiResult } from "@/lib/types";
import { telegramApi, type TelegramApiArg } from "@/lib/api";
import { useCallback, useEffect, useRef } from "react";
import { useWebsocket } from "@/hooks/use-websocket";

export function useTelegramMethod() {
  const pendingRequestsRef = useRef<
    Map<
      string,
      {
        resolve: (value: any) => void;
        reject: (reason?: any) => void;
      }
    >
  >(new Map());

  const lastResultRef = useRef<{
    code: string | null;
    result: unknown;
  }>({ code: null, result: null });

  const { lastJsonMessage } = useWebsocket();

  useEffect(() => {
    if (!lastJsonMessage?.code) return;

    const code = lastJsonMessage.code;
    const data = lastJsonMessage.data;

    lastResultRef.current = { code, result: data };

    const pendingRequest = pendingRequestsRef.current.get(code);
    if (pendingRequest) {
      pendingRequest.resolve(data);
      pendingRequestsRef.current.delete(code);
    } else {
      console.error(`No pending request found for code: ${code}`);
    }
  }, [lastJsonMessage]);

  const { trigger, isMutating } = useSWRMutation<
    TelegramApiResult,
    Error,
    string,
    TelegramApiArg
  >("/telegram/api", telegramApi);

  const executeMethod = useCallback(
    async (arg: TelegramApiArg): Promise<any> => {
      try {
        const result = await trigger(arg);
        const { code } = result;

        if (lastResultRef.current.code === code) {
          return lastResultRef.current.result;
        }

        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            pendingRequestsRef.current.delete(code);
            reject(new Error(`Request timeout for code: ${code}`));
          }, 30000);

          pendingRequestsRef.current.set(code, {
            resolve: (value) => {
              clearTimeout(timeoutId);
              resolve(value);
            },
            reject: (reason) => {
              clearTimeout(timeoutId);
              reject(
                reason instanceof Error ? reason : new Error(String(reason)),
              );
            },
          });
        });
      } catch (error) {
        throw error;
      }
    },
    [trigger, lastResultRef],
  );

  const isMethodExecuting = isMutating || pendingRequestsRef.current.size > 0;

  return {
    executeMethod,
    triggerMethod: trigger,
    isMethodExecuting,
    lastMethodCode: lastResultRef.current.code,
    lastMethodResult: lastResultRef.current.result,
    pendingRequestsCount: pendingRequestsRef.current.size,
  };
}
