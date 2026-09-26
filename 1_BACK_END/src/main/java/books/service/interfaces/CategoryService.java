package books.service.interfaces;

import books.dto.BookDTO;
import books.dto.CategoryDTO;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public interface CategoryService {
    List<CategoryDTO> getCategories() throws Exception;

    CategoryDTO getCategoryBySlug(String slug) throws Exception;

    List<CategoryDTO> getChildrenByParentSlug(String parentSlug) throws Exception;

    Map<String, Object> getBookByCategorySlug(String categorySlug, String page, String size) throws Exception;
}
