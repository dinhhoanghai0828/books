package books.service.interfaces;

import books.dto.BookDTO;
import books.dto.VolumeDTO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface VolumeService {
    List<VolumeDTO> getVolumes() throws Exception;

    VolumeDTO getVolumeDetailBySlug(String slug) throws Exception;
}
