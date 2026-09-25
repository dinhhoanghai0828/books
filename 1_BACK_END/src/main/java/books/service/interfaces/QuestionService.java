package books.service.interfaces;

import books.dto.QuestionDTO;
import books.dto.QuizResultDTO;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public interface QuestionService {
    List<QuestionDTO> getQuestionsByVolumeSlug(String volumeSlug) throws Exception;

    QuestionDTO getQuestionByCode(String questionCode) throws Exception;

    QuestionDTO getQuestionWithAnswersByCode(String questionCode) throws Exception;

    List<QuestionDTO> getQuestionsWithAnswersByVolumeSlug(String volumeSlug) throws Exception;

    boolean insertQuestion(QuestionDTO question) throws Exception;

    boolean updateQuestion(QuestionDTO question) throws Exception;

    boolean deleteQuestion(String questionCode) throws Exception;

    QuizResultDTO calculateQuizResult(Map<String, String> userAnswers, List<QuestionDTO> questions) throws Exception;
}
