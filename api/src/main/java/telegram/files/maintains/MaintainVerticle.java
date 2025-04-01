package telegram.files.maintains;

import cn.hutool.core.date.TimeInterval;
import cn.hutool.log.Log;
import cn.hutool.log.LogFactory;
import io.vertx.core.AbstractVerticle;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.json.JsonObject;
import telegram.files.Config;
import telegram.files.DataVerticle;
import telegram.files.EventEnum;
import telegram.files.TelegramVerticles;

public class MaintainVerticle extends AbstractVerticle {

    protected static final Log log = LogFactory.get();

    protected final TimeInterval timeInterval = new TimeInterval();

    protected final DataVerticle dataVerticle = new DataVerticle();

    public void start(Promise<Void> startPromise, Runnable runnable) {
        vertx.deployVerticle(dataVerticle, Config.VIRTUAL_THREAD_DEPLOYMENT_OPTIONS)
                .compose(r -> TelegramVerticles.initTelegramVerticles(vertx))
                .compose(r -> {
                    vertx.setTimer(1000, id -> runnable.run());
                    return Future.succeededFuture();
                })
                .onSuccess(id -> startPromise.complete())
                .onFailure(startPromise::fail);
    }

    public void end(boolean success, Throwable cause) {
        vertx.eventBus().publish(EventEnum.MAINTAIN.address(),
                JsonObject.of("success", success, "message", cause == null ? null : cause.getMessage())
        );
    }
}
