package books.service.impl;

import books.dao.interfaces.AnswerAdapter;
import books.dao.interfaces.QuestionAdapter;
import books.dto.AnswerDTO;
import books.dto.QuestionDTO;
import books.dto.QuestionResultDTO;
import books.dto.QuizResultDTO;
import books.entity.Answer;
import books.entity.Question;
import books.service.interfaces.QuestionService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class QuestionServiceImpl implements QuestionService {
    private QuestionAdapter questionAdapter;
    private AnswerAdapter answerAdapter;
    private ModelMapper modelMapper;

    @Autowired
    public QuestionServiceImpl(QuestionAdapter questionAdapter, AnswerAdapter answerAdapter, ModelMapper modelMapper) {
        this.questionAdapter = questionAdapter;
        this.answerAdapter = answerAdapter;
        this.modelMapper = modelMapper;
    }

    @Override
    public List<QuestionDTO> getQuestionsByVolumeSlug(String volumeSlug) throws Exception {
        List<Question> questions = questionAdapter.getQuestionsByVolumeSlug(volumeSlug);
        return questions.stream()
                .map(question -> modelMapper.map(question, QuestionDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public QuestionDTO getQuestionByCode(String questionCode) throws Exception {
        Question question = questionAdapter.getQuestionByCode(questionCode);
        if (question == null) {
            return null;
        }
        return modelMapper.map(question, QuestionDTO.class);
    }

    @Override
    public QuestionDTO getQuestionWithAnswersByCode(String questionCode) throws Exception {
        Question question = questionAdapter.getQuestionWithAnswersByCode(questionCode);
        if (question == null) {
            return null;
        }
        QuestionDTO questionDTO = modelMapper.map(question, QuestionDTO.class);
        List<AnswerDTO> answerDTOs = question.getAnswers().stream()
                .map(answer -> modelMapper.map(answer, AnswerDTO.class))
                .collect(Collectors.toList());
        questionDTO.setAnswers(answerDTOs);
        return questionDTO;
    }

    @Override
    public List<QuestionDTO> getQuestionsWithAnswersByVolumeSlug(String volumeSlug) throws Exception {
        List<Question> questions = questionAdapter.getQuestionsWithAnswersByVolumeSlug(volumeSlug);
        List<QuestionDTO> questionDTOs = new ArrayList<>();

        for (Question question : questions) {
            QuestionDTO questionDTO = modelMapper.map(question, QuestionDTO.class);
            List<AnswerDTO> answerDTOs = question.getAnswers().stream()
                    .map(answer -> modelMapper.map(answer, AnswerDTO.class))
                    .collect(Collectors.toList());
            questionDTO.setAnswers(answerDTOs);
            questionDTOs.add(questionDTO);
        }

        return questionDTOs;
    }

    @Override
    public boolean insertQuestion(QuestionDTO question) throws Exception {
        Question questionEntity = modelMapper.map(question, Question.class);
        return questionAdapter.insertQuestion(questionEntity);
    }

    @Override
    public boolean updateQuestion(QuestionDTO question) throws Exception {
        Question questionEntity = modelMapper.map(question, Question.class);
        return questionAdapter.updateQuestion(questionEntity);
    }

    @Override
    public boolean deleteQuestion(String questionCode) throws Exception {
        return questionAdapter.deleteQuestion(questionCode);
    }

    @Override
    public QuizResultDTO calculateQuizResult(Map<String, String> userAnswers, List<QuestionDTO> questions) throws Exception {
        QuizResultDTO result = new QuizResultDTO();
        List<QuestionResultDTO> questionResults = new ArrayList<>();

        int totalQuestions = questions.size();
        int correctAnswers = 0;
        int incorrectAnswers = 0;
        int unansweredQuestions = 0;

        for (int i = 0; i < questions.size(); i++) {
            QuestionDTO question = questions.get(i);
            QuestionResultDTO questionResult = new QuestionResultDTO();
            questionResult.setQuestionNumber(i + 1);
            questionResult.setQuestionText(question.getQuestionText());

            String userAnswer = userAnswers.get(question.getQuestionCode());
            questionResult.setUserAnswer(userAnswer);

            // Tìm đáp án đúng cho câu hỏi này (luôn tìm, không phụ thuộc vào việc người dùng chọn hay không)
            String correctAnswer = null;
            String correctAnswerText = null;

            for (AnswerDTO answer : question.getAnswers()) {
                if ("Y".equalsIgnoreCase(answer.getIsCorrect())) {
                    correctAnswer = answer.getOptionCode();
                    correctAnswerText = answer.getOptionText();
                    break;
                }
            }

            questionResult.setCorrectAnswer(correctAnswer);
            questionResult.setCorrectAnswerText(correctAnswerText);

            if (userAnswer == null || userAnswer.trim().isEmpty()) {
                questionResult.setUnanswered(true);
                questionResult.setCorrect(false);
                unansweredQuestions++;
            } else {
                questionResult.setUnanswered(false);

                if (userAnswer.equals(correctAnswer)) {
                    questionResult.setCorrect(true);
                    correctAnswers++;
                } else {
                    questionResult.setCorrect(false);
                    incorrectAnswers++;
                }
            }

            questionResults.add(questionResult);
        }

        result.setTotalQuestions(totalQuestions);
        result.setCorrectAnswers(correctAnswers);
        result.setIncorrectAnswers(incorrectAnswers);
        result.setUnansweredQuestions(unansweredQuestions);
        result.setQuestionResults(questionResults);

        return result;
    }
}
