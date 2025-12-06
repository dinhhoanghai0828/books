package books.controller;

import books.dto.ContentDTO;
import books.dto.VolumeDTO;
import books.response.ContentResponse;
import books.response.PaginationResponse;
import books.service.interfaces.BookService;
import books.service.interfaces.ContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.query.Param;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@CrossOrigin("*")
@RequestMapping("/content")
public class ContentController {
    private ContentService contentService;

    @Autowired
    public ContentController(ContentService contentService) {
        this.contentService = contentService;
    }

    @GetMapping("/{volume-slug}")
    public ResponseEntity<?> getVolumeByBookId(@PathVariable("volume-slug") String volumeSlug) {
        try {
            // Lấy dữ liệu từ service
            List<ContentDTO> contentDTOS = contentService.getContentByVolumeSlug(volumeSlug);
            ContentResponse response = new ContentResponse();
            response.setData(contentDTOS);
            // Trả về response với mã thành công (HTTP 200)
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> getContent(@Param("eng") String eng, @Param("vi") String vi, @Param("page") String page, @Param("size") String size) {
        try {
            // Lấy dữ liệu từ service
            Map<String, Object> contentDTOS = contentService.getContents(eng, vi, page, size);
            PaginationResponse<ContentDTO> response = new PaginationResponse<>();
            // Lấy thông tin phân trang
            response.setTotalElements((Integer) contentDTOS.get("TOTAL_ELEMENTS"));
            response.setTotalPages((Integer) contentDTOS.get("TOTAL_PAGES"));
            response.setSize((Integer) contentDTOS.get("SIZE"));
            response.setPage((Integer) contentDTOS.get("PAGE"));
            // Lấy danh sách sách và gán vào "items"
            List<ContentDTO> contentDTOList = (List<ContentDTO>) contentDTOS.get("CONTENTS");
            response.setData(contentDTOList);
            // Trả về response với mã thành công (HTTP 200)
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }
}
