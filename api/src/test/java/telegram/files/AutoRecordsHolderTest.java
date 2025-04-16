package telegram.files;

import io.vertx.core.Future;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import telegram.files.repository.SettingAutoRecords;
import telegram.files.repository.SettingKey;
import telegram.files.repository.SettingRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class AutoRecordsHolderTest {
    private AutomationsHolder autoRecordsHolder;

    private MockedStatic<TelegramVerticles> telegramVerticlesMockedStatic;

    private SettingAutoRecords settingAutoRecords1;

    private SettingAutoRecords.Automation automation1;

    @BeforeEach
    public void setUp() {
        autoRecordsHolder = AutomationsHolder.INSTANCE;
        telegramVerticlesMockedStatic = mockStatic(TelegramVerticles.class);

        // Prepare test data
        settingAutoRecords1 = new SettingAutoRecords();
        automation1 = new SettingAutoRecords.Automation();
        automation1.telegramId = 123L;
        automation1.chatId = 456L;
        automation1.preload = new SettingAutoRecords.PreloadConfig();
        automation1.download = new SettingAutoRecords.DownloadConfig();
        automation1.transfer = new SettingAutoRecords.TransferConfig();
        settingAutoRecords1.automations.add(automation1);

        // Mock dependencies
        TelegramVerticle mockTelegramVerticle = mock(TelegramVerticle.class);
        mockTelegramVerticle.authorized = true;
        when(TelegramVerticles.get(automation1.telegramId))
                .thenReturn(Optional.of(mockTelegramVerticle));
    }

    @AfterEach
    public void tearDown() {
        telegramVerticlesMockedStatic.close();
    }

    @Test
    public void testInit_WhenSettingExists_AddsAuthorizedRecords() {
        DataVerticle.settingRepository = mock(SettingRepository.class);

        // Mock dependencies
        when(DataVerticle.settingRepository.<SettingAutoRecords>getByKey(SettingKey.automation))
                .thenReturn(Future.succeededFuture(settingAutoRecords1));

        // Execute
        Future<Void> result = autoRecordsHolder.init();

        // Verify
        assertNotNull(result);
        assertTrue(autoRecordsHolder.autoRecords().exists(automation1.telegramId, automation1.chatId));
    }

    @Test
    public void testOnAutoRecordsUpdate_AddingNewRecords() {
        // Execute
        autoRecordsHolder.onAutoRecordsUpdate(settingAutoRecords1);

        // Verify
        assertTrue(autoRecordsHolder.autoRecords().exists(automation1.telegramId, automation1.chatId));
    }

    @Test
    public void testOnAutoRecordsUpdate_RemovingRecords() {
        autoRecordsHolder.onAutoRecordsUpdate(settingAutoRecords1);

        // Prepare new records with no items
        SettingAutoRecords newRecords = new SettingAutoRecords();

        // Mock listener
        Consumer<List<SettingAutoRecords.Automation>> mockListener = mock(Consumer.class);
        autoRecordsHolder.registerOnRemoveListener(mockListener);

        // Execute
        autoRecordsHolder.onAutoRecordsUpdate(newRecords);

        // Verify
        assertFalse(autoRecordsHolder.autoRecords().exists(automation1.telegramId, automation1.chatId));
        verify(mockListener).accept(argThat(list ->
                list.size() == 1 &&
                list.getFirst().telegramId == automation1.telegramId &&
                list.getFirst().chatId == automation1.chatId
        ));
    }

    @Test
    public void testRegisterOnRemoveListener() {
        // Prepare test listener
        List<SettingAutoRecords.Automation> receivedItems = new ArrayList<>();
        Consumer<List<SettingAutoRecords.Automation>> listener = receivedItems::addAll;

        // Register listener
        autoRecordsHolder.registerOnRemoveListener(listener);

        // Prepare initial and new records
        autoRecordsHolder.onAutoRecordsUpdate(settingAutoRecords1);

        SettingAutoRecords newRecords = new SettingAutoRecords();

        // Execute
        autoRecordsHolder.onAutoRecordsUpdate(newRecords);

        // Verify
        assertFalse(receivedItems.isEmpty());
        assertEquals(1, receivedItems.size());
        assertEquals(automation1.telegramId, receivedItems.getFirst().telegramId);
        assertEquals(automation1.chatId, receivedItems.getFirst().chatId);
    }
}
