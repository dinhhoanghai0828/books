package books.entity;

import java.util.List;

public class Content {
    private String id;
    private String eng;
    private String vi;
    private String startTime;
    private String endTime;
    private String volumeSlug;
    private String volumeViName;
    private String volumeEngName;
    private String bookEngName;
    private String audio;
    private String checked;
    private List<String> missingWords;

    public List<String> getMissingWords() {
        return missingWords;
    }

    public void setMissingWords(List<String> missingWords) {
        this.missingWords = missingWords;
    }


    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEng() {
        return eng;
    }

    public void setEng(String eng) {
        this.eng = eng;
    }

    public String getVi() {
        return vi;
    }

    public void setVi(String vi) {
        this.vi = vi;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public String getVolumeSlug() {
        return volumeSlug;
    }

    public void setVolumeSlug(String volumeSlug) {
        this.volumeSlug = volumeSlug;
    }

    public String getVolumeViName() {
        return volumeViName;
    }

    public void setVolumeViName(String volumeViName) {
        this.volumeViName = volumeViName;
    }

    public String getVolumeEngName() {
        return volumeEngName;
    }

    public void setVolumeEngName(String volumeEngName) {
        this.volumeEngName = volumeEngName;
    }

    public String getBookEngName() {
        return bookEngName;
    }

    public void setBookEngName(String bookEngName) {
        this.bookEngName = bookEngName;
    }

    public String getAudio() {
        return audio;
    }

    public void setAudio(String audio) {
        this.audio = audio;
    }

    public String getChecked() {
        return checked;
    }

    public void setChecked(String checked) {
        this.checked = checked;
    }
}
