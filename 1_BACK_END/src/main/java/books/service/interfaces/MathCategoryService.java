package books.service.interfaces;

import books.dto.MathCategoryDTO;

import java.util.List;

public interface MathCategoryService {
    List<MathCategoryDTO> getMathCategories() throws Exception;
    List<MathCategoryDTO> getMathCategoriesByFullPath(String fullPath) throws Exception;
}
