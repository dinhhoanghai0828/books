package books.controller;

import books.dto.WordDTO;
import books.service.interfaces.WordService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@CrossOrigin("*")
@RequestMapping("/word")
public class WordController {
    private WordService wordService;

    @Autowired
    public WordController(WordService wordService) {
        this.wordService = wordService;
    }

    @GetMapping("/suggestion")
    public ResponseEntity<?> getSuggestion(
            @RequestParam(value = "eng", required = false) String eng,
            @RequestParam(value = "vi", required = false) String vi) {
        try {
            // Khởi tạo danh sách gợi ý
            List<WordDTO> suggestions = new ArrayList<>();

            // Lọc gợi ý theo Tiếng Anh
            if (eng != null && !eng.isEmpty()) {
                // Lấy từ ENG_WORDS nếu có từ khóa eng
                suggestions = wordService.getSuggestionsFromEngWords(eng);
            }

            // Lọc gợi ý theo Tiếng Việt
            if (vi != null && !vi.isEmpty()) {
                // Lấy từ VI_WORDS nếu có từ khóa vi
                suggestions = wordService.getSuggestionsFromViWords(vi);
            }

            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            return new ResponseEntity<>("An error occurred while processing the request", HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/highlight")
    public ResponseEntity<?> getHighlight(
            @RequestParam(value = "eng", required = false) String eng,
            @RequestParam(value = "vi", required = false) String vi) {
        try {
            List<WordDTO> highlights;
            if (StringUtils.isBlank(eng) && StringUtils.isBlank(vi)) {
                highlights = new ArrayList<>();
            } else {
                highlights = wordService.getHighlight(eng, vi);
            }
            return ResponseEntity.ok(highlights);
        } catch (Exception e) {
            return new ResponseEntity<>("An error occurred while processing the request", HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/meaning")
    public ResponseEntity<?> getMeaning(
            @RequestParam(value = "eng", required = false) String eng,
            @RequestParam(value = "vi", required = false) String vi) {
        try {
            List<WordDTO> meanings;
            if (StringUtils.isBlank(eng) && StringUtils.isBlank(vi)) {
                meanings = new ArrayList<>();
            } else {
                meanings = wordService.getMeaning(eng, vi);
            }
            return ResponseEntity.ok(meanings);
        } catch (Exception e) {
            return new ResponseEntity<>("An error occurred while processing the request", HttpStatus.BAD_REQUEST);
        }
    }
}
