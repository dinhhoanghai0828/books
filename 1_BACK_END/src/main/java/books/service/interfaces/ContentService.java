package books.service.interfaces;

import books.dto.ContentDTO;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public interface ContentService {
    List<ContentDTO> getContentByVolumeSlug(String volumeSlug) throws Exception;

    Map<String, Object> getContents(String eng, String vi, String page, String size) throws Exception;
}
