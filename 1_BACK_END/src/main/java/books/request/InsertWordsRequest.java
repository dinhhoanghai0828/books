package books.request;

import java.util.List;

public class InsertWordsRequest {
    private String eng;
    private List<String> viList;

    public String getEng() {
        return eng;
    }

    public void setEng(String eng) {
        this.eng = eng;
    }

    public List<String> getViList() {
        return viList;
    }

    public void setViList(List<String> viList) {
        this.viList = viList;
    }
}
