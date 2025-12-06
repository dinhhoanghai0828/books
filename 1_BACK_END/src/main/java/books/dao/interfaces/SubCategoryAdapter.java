package books.dao.interfaces;

import java.util.Map;

public interface SubCategoryAdapter {
    Map<String, Object> getBookBySubCategorySlug(String subCategoryId, String page, String size) throws Exception;
}
