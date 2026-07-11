package books.service.interfaces;

import books.dto.WordDTO;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public interface WordService {
    List<WordDTO> getSuggestionsFromEngWords(String eng) throws Exception;

    List<WordDTO> getSuggestionsFromViWords(String vi) throws Exception;

    List<WordDTO> getHighlight(String eng, String vi) throws Exception;

    List<WordDTO> getMeaning(String eng, String vi) throws Exception;

    int insertWords(String eng, List<String> viList) throws Exception;

    Map<String, Object> getWords(String eng, String vi, String page, String size) throws Exception;

    boolean updateWord(Long id, String eng, String vi) throws Exception;
}
