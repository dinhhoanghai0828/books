package books.dao.interfaces;

import java.util.Map;

public interface BookAdapter {
    Map<String, Object> getVolumeByBookSlug(String slug, String page, String size) throws Exception;
}
