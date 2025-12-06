package books.controller;

import books.dto.ContentDTO;
import books.response.ContentResponse;
import books.response.PaginationResponse;
import books.service.interfaces.ContentService;
import books.service.interfaces.TestService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.query.Param;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin("*")
@RequestMapping("/test")
public class TestController {
    private TestService testService;

    @Autowired
    public TestController(TestService testService) {
        this.testService = testService;
    }

    @GetMapping("")
    public ResponseEntity<?> getTest(@Param("volumeSlug") String volumeSlug, @Param("limit") String limit) {
        try {
            List<ContentDTO> contentDTOS;
            // Lấy dữ liệu từ service
            contentDTOS = testService.getTest(volumeSlug, limit);
            ContentResponse response = new ContentResponse();
            response.setData(contentDTOS);
            // Trả về response với mã thành công (HTTP 200)
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }
}
