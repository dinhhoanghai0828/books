package books.controller;

import books.dto.BookDTO;
import books.dto.CategoryDTO;
import books.response.CategoryResponse;
import books.response.PaginationResponse;
import books.service.interfaces.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.query.Param;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin("*")
@RequestMapping("/categories")
public class CategoryController {
    private CategoryService categoryService;

    @Autowired
    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping("/list")
    public ResponseEntity<?> getCategories() {
        try {
            List<CategoryDTO> categoryDTOS = categoryService.getCategories();
            CategoryResponse response = new CategoryResponse();
            response.setCategories(categoryDTOS);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{category-slug}")
    public ResponseEntity<?> getBookByCategorySlug(@PathVariable("category-slug") String categorySlug, @Param("page") String page, @Param("size") String size) {
        try {
            // Lấy dữ liệu từ service
            Map<String, Object> bookDTOS = categoryService.getBookByCategorySlug(categorySlug, page, size);

            // Tạo PaginationResponse và gán giá trị từ Map vào response
            PaginationResponse<BookDTO> response = new PaginationResponse<>();

            // Lấy thông tin phân trang
            response.setTotalElements((Integer) bookDTOS.get("TOTAL_ELEMENTS"));
            response.setTotalPages((Integer) bookDTOS.get("TOTAL_PAGES"));
            response.setSize((Integer) bookDTOS.get("SIZE"));
            response.setPage((Integer) bookDTOS.get("PAGE"));

            // Lấy danh sách sách và gán vào "items"
            List<BookDTO> bookList = (List<BookDTO>) bookDTOS.get("BOOKS");
            response.setData(bookList);

            // Trả về response với mã thành công (HTTP 200)
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }
}
