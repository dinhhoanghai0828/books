package books.response;

import books.dto.ContentDTO;

import java.util.List;

public class ContentResponse {
    private List<ContentDTO> data;

    public List<ContentDTO> getData() {
        return data;
    }

    public void setData(List<ContentDTO> data) {
        this.data = data;
    }
}
