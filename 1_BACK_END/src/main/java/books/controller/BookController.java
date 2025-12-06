package books.controller;

import books.dto.BookDTO;
import books.dto.VolumeDTO;
import books.response.PaginationResponse;
import books.service.interfaces.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.query.Param;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin("*")
@RequestMapping("/books")
public class BookController {
    private BookService bookService;

    @Autowired
    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @GetMapping("/{slug}")
    public ResponseEntity<?> getVolumeByBookSlug(@PathVariable("slug") String slug, @Param("page") String page, @Param("size") String size) {
        try {
            // Lấy dữ liệu từ service
            Map<String, Object> volumesDTOS = bookService.getVolumeByBookSlug(slug, page, size);
            // Tạo PaginationResponse và gán giá trị từ Map vào response
            PaginationResponse<VolumeDTO> response = new PaginationResponse<>();
            // Lấy thông tin phân trang
            response.setTotalElements((Integer) volumesDTOS.get("TOTAL_ELEMENTS"));
            response.setTotalPages((Integer) volumesDTOS.get("TOTAL_PAGES"));
            response.setSize((Integer) volumesDTOS.get("SIZE"));
            response.setPage((Integer) volumesDTOS.get("PAGE"));
            // Lấy danh sách sách và gán vào "items"
            List<VolumeDTO> volumeDTOList = (List<VolumeDTO>) volumesDTOS.get("VOLUMES");
            response.setData(volumeDTOList);
            // Trả về response với mã thành công (HTTP 200)
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }
}
