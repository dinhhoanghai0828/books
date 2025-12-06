package books.dao.interfaces;

import books.entity.Book;
import books.entity.Category;

import java.util.List;
import java.util.Map;

public interface CategoryAdapter {
    List<Category> getCategories() throws Exception;
    Map<String, Object> getBookBySubCategorySlug(String categorySlug, String page, String size) throws Exception;
}
