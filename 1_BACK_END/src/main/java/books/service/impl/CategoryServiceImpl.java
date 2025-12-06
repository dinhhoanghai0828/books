package books.service.impl;

import books.dao.interfaces.CategoryAdapter;
import books.dao.interfaces.VolumeAdapter;
import books.dto.BookDTO;
import books.dto.CategoryDTO;
import books.dto.VolumeDTO;
import books.entity.Book;
import books.entity.Category;
import books.entity.Volume;
import books.service.interfaces.CategoryService;
import books.service.interfaces.VolumeService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService {
    private CategoryAdapter categoryAdapter;
    private ModelMapper modelMapper;

    @Autowired
    public CategoryServiceImpl(CategoryAdapter categoryAdapter, ModelMapper modelMapper) {
        this.categoryAdapter = categoryAdapter;
        this.modelMapper = modelMapper;
    }


    @Override
    public List<CategoryDTO> getCategories() throws Exception {
        List<Category> categories = categoryAdapter.getCategories();
        List<CategoryDTO> categoryDTOList = categories.stream().map(category -> modelMapper.map(category, CategoryDTO.class)).collect(Collectors.toList());
        return categoryDTOList;
    }

    @Override
    public Map<String, Object> getBookByCategorySlug(String categorySlug, String page, String size) throws Exception {
        Map<String, Object> result = categoryAdapter.getBookBySubCategorySlug(categorySlug, page, size);
        List<Book> books = (List<Book>) result.get("BOOKS");
        List<BookDTO> bookDTOS = books.stream()
                .map(book -> modelMapper.map(book, BookDTO.class))
                .collect(Collectors.toList());
        result.put("BOOKS", bookDTOS);
        return result;
    }

}
