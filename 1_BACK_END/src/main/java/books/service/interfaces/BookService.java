package books.service.interfaces;

import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public interface BookService {
    Map<String, Object> getVolumeByBookSlug(String slug, String page, String size) throws Exception;
}
