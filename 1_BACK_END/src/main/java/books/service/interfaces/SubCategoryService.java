package books.service.interfaces;

import books.dto.CategoryDTO;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public interface SubCategoryService {
    Map<String, Object> getBookBySubCategorySlug(String subCategorySlug, String page, String size) throws Exception;
}
