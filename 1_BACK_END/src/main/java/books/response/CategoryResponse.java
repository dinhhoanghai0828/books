package books.response;

import books.dto.CategoryDTO;

import java.util.List;

public class CategoryResponse {
    private List<CategoryDTO> categories;

    public List<CategoryDTO> getCategories() {
        return categories;
    }

    public void setCategories(List<CategoryDTO> categories) {
        this.categories = categories;
    }
}
