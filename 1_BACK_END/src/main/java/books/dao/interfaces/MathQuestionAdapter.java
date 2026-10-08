package books.dao.interfaces;

import books.entity.MathQuestion;

import java.util.List;

public interface MathQuestionAdapter {
    List<MathQuestion> getQuestionsByCategoryCode(String categoryCode) throws Exception;
    List<MathQuestion> getQuestionsByParentCategoryCode(String parentCategoryCode) throws Exception;
    List<MathQuestion> getAllQuestions() throws Exception;
}
