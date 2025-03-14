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

        /**
         * http, socks5
         */
        public String type;

        public boolean equalsTdProxy(TdApi.Proxy proxy) {
            return Objects.equals(server, proxy.server)
                   && port == proxy.port
                   && (Objects.equals(type, "http") ? proxy.type instanceof TdApi.ProxyTypeHttp : proxy.type instanceof TdApi.ProxyTypeSocks5);
        }

    }

    public SettingProxyRecords() {
        this.items = new ArrayList<>();
    }

    public Optional<Item> getProxy(String name) {
        return items.stream().filter(item -> Objects.equals(name, item.name)).findFirst();
    }
}
