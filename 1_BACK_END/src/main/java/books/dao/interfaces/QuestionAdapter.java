package books.dao.interfaces;

import books.entity.Question;

import java.util.List;

public interface QuestionAdapter {
    List<Question> getQuestionsByVolumeSlug(String volumeSlug) throws Exception;

    Question getQuestionByCode(String questionCode) throws Exception;

    Question getQuestionWithAnswersByCode(String questionCode) throws Exception;

    List<Question> getQuestionsWithAnswersByVolumeSlug(String volumeSlug) throws Exception;

    boolean insertQuestion(Question question) throws Exception;

    boolean updateQuestion(Question question) throws Exception;

    boolean deleteQuestion(String questionCode) throws Exception;
}
