package books.dao.interfaces;

import books.entity.Word;

import java.util.List;

public interface WordAdapter {
    List<Word> getEngWords(String eng) throws Exception;

    List<Word> getViWords(String vi) throws Exception;

    List<Word> getHighlight(String eng, String vi) throws Exception;
    List<Word> getMeaning(String eng, String vi) throws Exception;
}
