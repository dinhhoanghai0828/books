package books.controller;

import books.dto.MathCategoryDTO;
import books.dto.MathQuestionDTO;
import books.response.MathCategoryResponse;
import books.service.interfaces.MathCategoryService;
import books.service.interfaces.MathQuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin("*")
@RequestMapping("/math")
public class MathController {
    private final MathCategoryService mathCategoryService;
    private final MathQuestionService mathQuestionService;

    @Autowired
    public MathController(MathCategoryService mathCategoryService, MathQuestionService mathQuestionService) {
        this.mathCategoryService = mathCategoryService;
        this.mathQuestionService = mathQuestionService;
    }

    // GET /api/v1/math/categories               → lấy tất cả
    // GET /api/v1/math/categories?fullPath=toan/lop-1 → lọc theo FULL_PATH
    @GetMapping("/categories")
    public ResponseEntity<?> getMathCategories(@RequestParam(value = "fullPath", required = false) String fullPath) {
        try {
            List<MathCategoryDTO> categories;
            if (fullPath != null) {
                categories = mathCategoryService.getMathCategoriesByFullPath(fullPath);
            } else {
                categories = mathCategoryService.getMathCategories();
            }
            MathCategoryResponse response = new MathCategoryResponse();
            response.setCategories(categories);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/questions/{categoryCode}")
    public ResponseEntity<?> getQuestionsByCategoryCode(
            @PathVariable("categoryCode") String categoryCode,
            @RequestParam(value = "tongHop", required = false, defaultValue = "false") boolean tongHop) {
        try {
            List<MathQuestionDTO> questions;
            if (tongHop) {
                // Lấy ngẫu nhiên câu hỏi từ tất cả categories con của cha
                questions = mathQuestionService.getQuestionsByParentCategoryCode(categoryCode);
            } else {
                questions = mathQuestionService.getQuestionsByCategoryCode(categoryCode);
            }
            return new ResponseEntity<>(questions, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }
}
