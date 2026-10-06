package books.response;

import books.dto.MathCategoryDTO;

import java.util.List;

public class MathCategoryResponse {
    private List<MathCategoryDTO> categories;

    public List<MathCategoryDTO> getCategories() {
        return categories;
    }

    public void setCategories(List<MathCategoryDTO> categories) {
        this.categories = categories;
    }
}
