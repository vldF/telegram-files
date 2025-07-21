package telegram.files.repository;

import org.drinkless.tdlib.TdApi;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

public class SettingProxyRecords {

    public List<Item> items;

    public static class Item {
        /**
         * should be unique
         */
        public String name;

        public String server;

        public int port;

        public String username;

        public String password;

        public String secret;

        /**
         * http, socks5, mtproto
         */
        public String type;

        public boolean equalsTdProxy(TdApi.Proxy proxy) {
            if (proxy == null) {
                return false;
            }

            return Objects.equals(server, proxy.server)
                   && port == proxy.port
                   && Objects.equals(type, convertType(proxy.type));
        }

        public String convertType(TdApi.ProxyType type) {
            if (type == null) {
                return null;
            }
            return switch (type) {
                case TdApi.ProxyTypeHttp ignored -> "http";
                case TdApi.ProxyTypeSocks5 ignored -> "socks5";
                case TdApi.ProxyTypeMtproto ignored -> "mtproto";
                default -> null;
            };
        }

    }

    public SettingProxyRecords() {
        this.items = new ArrayList<>();
    }

    public Optional<Item> getProxy(String name) {
        return items.stream().filter(item -> Objects.equals(name, item.name)).findFirst();
    }
}
