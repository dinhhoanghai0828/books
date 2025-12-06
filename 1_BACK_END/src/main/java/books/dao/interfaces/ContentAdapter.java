package books.dao.interfaces;

import books.entity.Content;

import java.util.List;
import java.util.Map;

public interface ContentAdapter {
    List<Content> getContentByVolumeSlug(String volumeSlug) throws Exception;

    Map<String, Object> getContents(String eng, String vi, String page, String size) throws Exception;
}
