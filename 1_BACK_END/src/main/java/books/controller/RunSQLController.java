package books.controller;

import books.component.RunSQLComponent;
import books.response.BaseResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin("*")
@RequestMapping("/run-sql")
public class RunSQLController {

    private final RunSQLComponent runSQLComponent;

    @Autowired
    public RunSQLController(RunSQLComponent runSQLComponent) {
        this.runSQLComponent = runSQLComponent;
    }

    /**
     * API 1: Tương đương RunSQLWordGeneralService.main()
     * Tạo lại bảng WORDS2 từ WORDS, rồi tổng hợp ra file 3_SQL_ENG_WORDS.sql
     * Trả về thống kê: số từ trước, sau, và số từ mới tăng thêm
     */
    @PostMapping("/word-general")
    public ResponseEntity<?> wordGeneral() {
        try {
            Map<String, Integer> stats = runSQLComponent.wordGeneralWithStats();
            int before = stats.get("BEFORE");
            int after  = stats.get("AFTER");
            int added  = stats.get("ADDED");
            String message = String.format(
                    "Cập nhật số lượng từ thành công. Trước cập nhật: %d từ | Sau cập nhật: %d từ | Đã thêm: %d từ mới.",
                    before, after, added
            );
            return new ResponseEntity<>(new BaseResponse("00", message), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(new BaseResponse("99", "word-general failed: " + e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * API 2: Đọc toàn bộ CONTENTS từ DB theo từng BOOK,
     * ghi ra các file APP_<BOOK_SLUG>.sql trong thư mục 3_DATABASE
     */
    @PostMapping("/contents-export")
    public ResponseEntity<?> contentsExport() {
        try {
            List<String> generatedFiles = runSQLComponent.generalContents();
            String message = "contents-export success. Files generated: " + generatedFiles.size();
            return new ResponseEntity<>(new BaseResponse("00", message), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(new BaseResponse("99", "contents-export failed: " + e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * API 3: Tương đương RunSQLContentService nhưng danh sách file APP_*.sql
     * được build động từ DB thay vì hardcode.
     * Thực hiện: TRUNCATE CONTENTS → execute từng APP_<BOOK_SLUG>.sql
     */
    @PostMapping("/contents-insert")
    public ResponseEntity<?> contentsInsert() {
        try {
            List<String> executedFiles = runSQLComponent.insertContentFromExport();
            String message = "contents-insert success. Executed files: " + executedFiles.size();
            return new ResponseEntity<>(new BaseResponse("00", message), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(new BaseResponse("99", "contents-insert failed: " + e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
