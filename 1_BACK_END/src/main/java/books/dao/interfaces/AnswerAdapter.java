package books.dao.interfaces;

import books.entity.Answer;

import java.util.List;

public interface AnswerAdapter {
    List<Answer> getAnswersByQuestionCode(String questionCode) throws Exception;

    boolean insertAnswer(Answer answer) throws Exception;

    boolean updateAnswer(Answer answer) throws Exception;

    boolean deleteAnswer(String questionCode, String optionCode) throws Exception;

    boolean deleteAnswersByQuestionCode(String questionCode) throws Exception;
}
