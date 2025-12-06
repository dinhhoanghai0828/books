package books.service.interfaces;

import books.dto.ContentDTO;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public interface TestService {
    List<ContentDTO> getTest(String volumeSlug, String limit) throws Exception;
}
