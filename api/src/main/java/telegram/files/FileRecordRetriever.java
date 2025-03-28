package telegram.files;

import io.vertx.core.Future;
import io.vertx.core.json.JsonObject;
import org.drinkless.tdlib.TdApi;
import telegram.files.repository.FileRecord;

import java.util.*;
import java.util.stream.Collectors;

public class FileRecordRetriever {

    public static Future<JsonObject> getFiles(long chatId, Map<String, String> filter) {
        return DataVerticle.fileRepository.getFiles(chatId, filter)
                .compose(r -> getTdMessages(r.v1).map(r::concat))
                .map(r -> {
                    Map<String, TdApi.Message> messageMap = r.v4;
                    List<JsonObject> fileRecords = r.v1.stream()
                            .map(fileRecord -> TelegramConverter.withSource(fileRecord.telegramId(),
                                    fileRecord,
                                    messageMap.get(fileRecord.uniqueId())
                            ))
                            .filter(Objects::nonNull)
                            .toList();
                    return new JsonObject()
                            .put("files", fileRecords)
                            .put("nextFromMessageId", r.v2)
                            .put("count", r.v3)
                            .put("size", fileRecords.size());
                });
    }

    /**
     * Get messages from telegram
     *
     * @return Future of map of message uniqueId and message
     */
    public static Future<Map<String, TdApi.Message>> getTdMessages(List<FileRecord> fileRecords) {
        if (fileRecords == null || fileRecords.isEmpty()) {
            return Future.succeededFuture(Collections.emptyMap());
        }

        Map<Long, List<FileRecord>> groupingByTelegramIdMap = fileRecords.stream()
                .collect(Collectors.groupingBy(FileRecord::telegramId));

        return Future.all(groupingByTelegramIdMap
                .entrySet()
                .stream()
                .map(entry -> getTdMessages(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList())
        ).map(compositeFuture -> {
            Map<String, TdApi.Message> combinedMessageMap = new HashMap<>();
            for (int i = 0; i < compositeFuture.size(); i++) {
                Map<String, TdApi.Message> partialMessageMap = compositeFuture.resultAt(i);
                combinedMessageMap.putAll(partialMessageMap);
            }
            return combinedMessageMap;
        }).recover(throwable -> Future.failedFuture(new RuntimeException("Failed to get Telegram message", throwable)));
    }

    /**
     * Get messages from telegram
     *
     * @return Future of map of message uniqueId and message
     */
    public static Future<Map<String, TdApi.Message>> getTdMessages(long telegramId, List<FileRecord> fileRecords) {
        if (fileRecords == null || fileRecords.isEmpty()) {
            return Future.succeededFuture(Collections.emptyMap());
        }

        Optional<TelegramVerticle> telegramVerticleOptional = TelegramVerticles.get(telegramId);
        if (telegramVerticleOptional.isEmpty()) {
            return Future.failedFuture("Telegram verticle not found，unable to get the message. telegramId: " + telegramId);
        }

        Map<Long, List<FileRecord>> groupingByChatIdMap = fileRecords.stream()
                .collect(Collectors.groupingBy(FileRecord::chatId));

        return Future.all(groupingByChatIdMap
                .entrySet()
                .stream()
                .map(entry -> {
                    long chatId = entry.getKey();
                    List<FileRecord> records = entry.getValue();
                    long[] messageIds = records.stream()
                            .mapToLong(FileRecord::messageId)
                            .toArray();

                    return telegramVerticleOptional
                            .get()
                            .client
                            .execute(new TdApi.GetMessages(chatId, messageIds))
                            .map(m -> createMessageMap(chatId, m.messages, records));
                })
                .collect(Collectors.toList())
        ).map(compositeFuture -> {
            Map<String, TdApi.Message> combinedMessageMap = new HashMap<>();
            for (int i = 0; i < compositeFuture.size(); i++) {
                Map<String, TdApi.Message> partialMessageMap = compositeFuture.resultAt(i);
                combinedMessageMap.putAll(partialMessageMap);
            }
            return combinedMessageMap;
        }).recover(throwable -> Future.failedFuture(new RuntimeException("Failed to get Telegram message", throwable)));
    }

    private static Map<String, TdApi.Message> createMessageMap(long chatId, TdApi.Message[] messages, List<FileRecord> records) {
        Map<String, TdApi.Message> messageMap = new HashMap<>();

        for (TdApi.Message message : messages) {
            String uniqueId = TdApiHelp.getFileUniqueId(message);

            boolean matchesFileRecord = records.stream()
                    .anyMatch(record -> record.messageId() == message.id && record.chatId() == chatId);

            if (matchesFileRecord) {
                messageMap.put(uniqueId, message);
            }
        }

        return messageMap;
    }
}
