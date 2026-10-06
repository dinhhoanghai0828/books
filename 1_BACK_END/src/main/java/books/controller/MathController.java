package books.controller;

import books.dto.MathCategoryDTO;
import books.dto.MathQuestionDTO;
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
    private MathCategoryService mathCategoryService;
    private MathQuestionService mathQuestionService;

    @Autowired
    public MathController(MathCategoryService mathCategoryService, MathQuestionService mathQuestionService) {
        this.mathCategoryService = mathCategoryService;
        this.mathQuestionService = mathQuestionService;
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getMathCategories() {
        try {
            List<MathCategoryDTO> categories = mathCategoryService.getMathCategories();
            return new ResponseEntity<>(categories, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/questions/{categoryCode}")
    public ResponseEntity<?> getQuestionsByCategoryCode(@PathVariable("categoryCode") String categoryCode) {
        try {
            List<MathQuestionDTO> questions = mathQuestionService.getQuestionsByCategoryCode(categoryCode);
            return new ResponseEntity<>(questions, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }
}
