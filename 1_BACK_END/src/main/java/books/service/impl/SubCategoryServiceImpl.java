package books.service.impl;

import books.dao.interfaces.SubCategoryAdapter;
import books.dto.BookDTO;
import books.entity.Book;
import books.service.interfaces.SubCategoryService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SubCategoryServiceImpl implements SubCategoryService {
    private SubCategoryAdapter subCategoryAdapter;
    private ModelMapper modelMapper;

    @Autowired
    public SubCategoryServiceImpl(SubCategoryAdapter subCategoryAdapter, ModelMapper modelMapper) {
        this.subCategoryAdapter = subCategoryAdapter;
        this.modelMapper = modelMapper;
    }

    @Override
    public Map<String, Object> getBookBySubCategorySlug(String subCategorySlug, String page, String size) throws Exception {
        Map<String, Object> result = subCategoryAdapter.getBookBySubCategorySlug(subCategorySlug, page, size);
        List<Book> books = (List<Book>) result.get("BOOKS");
        List<BookDTO> bookDTOS = books.stream()
                .map(book -> modelMapper.map(book, BookDTO.class))
                .collect(Collectors.toList());
        result.put("BOOKS", bookDTOS);
        return result;
    }

}
