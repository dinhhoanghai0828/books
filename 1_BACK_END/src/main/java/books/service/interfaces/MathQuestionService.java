package books.service.interfaces;

import books.dto.MathQuestionDTO;

import java.util.List;

public interface MathQuestionService {
    List<MathQuestionDTO> getQuestionsByCategoryCode(String categoryCode) throws Exception;
}
