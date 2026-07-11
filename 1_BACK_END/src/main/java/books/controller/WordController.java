package books.controller;

import books.dto.WordDTO;
import books.request.InsertWordsRequest;
import books.request.UpdateWordRequest;
import books.response.BaseResponse;
import books.response.PaginationResponse;
import books.service.interfaces.WordService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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

    @PostMapping("/insert")
    public ResponseEntity<?> insertWords(@RequestBody InsertWordsRequest request) {
        try {
            int inserted = wordService.insertWords(request.getEng(), request.getViList());
            return new ResponseEntity<>(
                    new BaseResponse("00", "Đã insert được " + inserted + " bản ghi"),
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new BaseResponse("99", e.getMessage()),
                    HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> getWords(
            @RequestParam(value = "eng",  required = false) String eng,
            @RequestParam(value = "vi",   required = false) String vi,
            @RequestParam(value = "page", defaultValue = "0")  String page,
            @RequestParam(value = "size", defaultValue = "50") String size) {
        try {
            Map<String, Object> data = wordService.getWords(eng, vi, page, size);
            PaginationResponse<WordDTO> response = new PaginationResponse<>();
            response.setTotalElements((Integer) data.get("TOTAL_ELEMENTS"));
            response.setTotalPages((Integer) data.get("TOTAL_PAGES"));
            response.setSize((Integer) data.get("SIZE"));
            response.setPage((Integer) data.get("PAGE"));
            response.setData((List<WordDTO>) data.get("WORDS"));
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateWord(@RequestBody UpdateWordRequest request) {
        try {
            boolean success = wordService.updateWord(request.getId(), request.getEng(), request.getVi());
            if (success) {
                return new ResponseEntity<>(new BaseResponse("00", "success"), HttpStatus.OK);
            } else {
                return new ResponseEntity<>(new BaseResponse("99", "failed"), HttpStatus.OK);
            }
        } catch (Exception e) {
            return new ResponseEntity<>(new BaseResponse("99", "failed: " + e.getMessage()), HttpStatus.OK);
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteWord(@PathVariable Long id) {
        try {
            boolean success = wordService.deleteWord(id);
            if (success) {
                return new ResponseEntity<>(new BaseResponse("00", "success"), HttpStatus.OK);
            } else {
                return new ResponseEntity<>(new BaseResponse("99", "not found"), HttpStatus.OK);
            }
        } catch (Exception e) {
            return new ResponseEntity<>(new BaseResponse("99", "failed: " + e.getMessage()), HttpStatus.OK);
        }
    }
}
