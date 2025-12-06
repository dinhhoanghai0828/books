package books.service.interfaces;

import books.dto.BookDTO;
import books.dto.CategoryDTO;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public interface CategoryService {
    List<CategoryDTO> getCategories() throws Exception;

    Map<String, Object> getBookByCategorySlug(String subCategorySlug, String page, String size) throws Exception;
}
