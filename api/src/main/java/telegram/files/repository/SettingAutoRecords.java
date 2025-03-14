package telegram.files.repository;

import com.fasterxml.jackson.annotation.JsonIgnore;
import telegram.files.MessyUtils;
import telegram.files.Transfer;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

public class SettingAutoRecords {

    public List<Item> items;

    public static final int HISTORY_PRELOAD_STATE = 1;

    public static final int HISTORY_DOWNLOAD_STATE = 2;

    public static final int HISTORY_TRANSFER_STATE = 3;

    public static class Item {
        public long telegramId;

        public long chatId;

        public String nextFileType;

        public long nextFromMessageId;

        public Rule rule;

        public boolean downloadEnabled;

        public boolean preloadEnabled;

        public long nextFromMessageIdForPreload;

        public int state;

        public Item() {
            // downloadEnabled default is true
            this.downloadEnabled = true;
        }

        public Item(long telegramId, long chatId, Rule rule) {
            this.telegramId = telegramId;
            this.chatId = chatId;
            this.rule = rule;
        }

        public String uniqueKey() {
            return telegramId + ":" + chatId;
        }

        @JsonIgnore
        public void complete(int bitwise) {
            MessyUtils.BitState bitState = new MessyUtils.BitState(state);
            bitState.enableState(bitwise);
            state = bitState.getState();
        }

        @JsonIgnore
        public boolean isNotComplete(int bitwise) {
            MessyUtils.BitState bitState = new MessyUtils.BitState(state);
            return !bitState.isStateEnabled(bitwise);
        }

        @JsonIgnore
        public boolean isDownloadHistoryEnabled() {
            return rule == null || rule.downloadHistory == null || rule.downloadHistory;
        }
    }

    public static class Rule {
        public String query;

        public List<String> fileTypes;

        public Boolean downloadHistory;

        public TransferRule transferRule;

        public Rule() {
        }

        public Rule(String query, List<String> fileTypes, boolean downloadHistory, TransferRule transferRule) {
            this.query = query;
            this.fileTypes = fileTypes;
            this.downloadHistory = downloadHistory;
            this.transferRule = transferRule;
        }
    }

    public static class TransferRule {
        public boolean transferHistory;

        public String destination;

        public Transfer.TransferPolicy transferPolicy;

        public Transfer.DuplicationPolicy duplicationPolicy;

        public TransferRule() {
        }

        public TransferRule(boolean transferHistory,
                            String destination,
                            Transfer.TransferPolicy transferPolicy,
                            Transfer.DuplicationPolicy duplicationPolicy) {
            this.transferHistory = transferHistory;
            this.destination = destination;
            this.transferPolicy = transferPolicy;
            this.duplicationPolicy = duplicationPolicy;
        }
    }

    public SettingAutoRecords() {
        this.items = new ArrayList<>();
    }

    public SettingAutoRecords(List<Item> items) {
        this.items = items;
    }

    public boolean exists(long telegramId, long chatId) {
        return items.stream().anyMatch(item -> item.telegramId == telegramId && item.chatId == chatId);
    }

    public void add(Item item) {
        items.removeIf(i -> i.telegramId == item.telegramId && i.chatId == item.chatId);
        items.add(item);
    }

    public void add(long telegramId, long chatId, Rule rule) {
        items.add(new Item(telegramId, chatId, rule));
    }

    public void remove(long telegramId, long chatId) {
        items.removeIf(item -> item.telegramId == telegramId && item.chatId == chatId);
    }

    @JsonIgnore
    public List<Item> getDownloadEnabledItems() {
        return items.stream()
                .filter(i -> i.downloadEnabled)
                .toList();
    }

    @JsonIgnore
    public List<Item> getPreloadEnabledItems() {
        return items.stream()
                .filter(i -> i.preloadEnabled)
                .toList();
    }

    public Map<Long, Item> getItems(long telegramId) {
        return items.stream()
                .filter(item -> item.telegramId == telegramId)
                .collect(Collectors.toMap(i -> i.chatId, Function.identity()));
    }

    public Item getItem(long telegramId, long chatId) {
        return items.stream()
                .filter(item -> item.telegramId == telegramId && item.chatId == chatId)
                .findFirst()
                .orElse(null);
    }

}
