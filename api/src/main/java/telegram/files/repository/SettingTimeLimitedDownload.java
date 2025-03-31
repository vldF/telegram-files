package telegram.files.repository;

public class SettingTimeLimitedDownload {
    public String startTime;
    public String endTime;

    public SettingTimeLimitedDownload() {
    }

    public SettingTimeLimitedDownload(String startTime, String endTime) {
        this.startTime = startTime;
        this.endTime = endTime;
    }
}
