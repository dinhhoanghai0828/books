package books.dao.interfaces;

import books.entity.MathCategory;

import java.util.List;

public interface MathCategoryAdapter {
    List<MathCategory> getMathCategories() throws Exception;
}
