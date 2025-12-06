package books.service.interfaces;

import books.dto.WordDTO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface WordService {
    List<WordDTO> getSuggestionsFromEngWords(String eng) throws Exception;

    List<WordDTO> getSuggestionsFromViWords(String vi) throws Exception;

    List<WordDTO> getHighlight(String eng, String vi) throws Exception;

    List<WordDTO> getMeaning(String eng, String vi) throws Exception;
}
