package books.dao.interfaces;

import books.entity.Word;

import java.util.List;
import java.util.Map;

public interface WordAdapter {
    List<Word> getEngWords(String eng) throws Exception;

    List<Word> getViWords(String vi) throws Exception;

    List<Word> getHighlight(String eng, String vi) throws Exception;

    List<Word> getMeaning(String eng, String vi) throws Exception;

    int insertWords(String eng, List<String> viList) throws Exception;

    Map<String, Object> getWords(String eng, String vi, String page, String size) throws Exception;

    boolean updateWord(Long id, String eng, String vi) throws Exception;

    boolean deleteWord(Long id) throws Exception;

    boolean isInMissingWords(String eng) throws Exception;
}
