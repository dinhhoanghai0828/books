package books.service.interfaces;

import books.dto.MathQuestionDTO;

import java.util.List;

public interface MathQuestionService {
    List<MathQuestionDTO> getQuestionsByCategoryCode(String categoryCode) throws Exception;
    List<MathQuestionDTO> getQuestionsByParentCategoryCode(String parentCategoryCode) throws Exception;
    List<MathQuestionDTO> getAllQuestions() throws Exception;
}
