package books.controller;

import books.dto.QuestionDTO;
import books.dto.QuizResultDTO;
import books.response.BaseResponse;
import books.service.interfaces.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin("*")
@RequestMapping("/question")
public class QuestionController {
    private QuestionService questionService;

    @Autowired
    public QuestionController(QuestionService questionService) {
        this.questionService = questionService;
    }

    @GetMapping("/volume/{volumeSlug}")
    public ResponseEntity<?> getQuestionsByVolumeSlug(@PathVariable String volumeSlug) {
        try {
            List<QuestionDTO> questions = questionService.getQuestionsByVolumeSlug(volumeSlug);
            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new BaseResponse("99", "Error: " + e.getMessage()),
                    HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/code/{questionCode}")
    public ResponseEntity<?> getQuestionByCode(@PathVariable String questionCode) {
        try {
            QuestionDTO question = questionService.getQuestionByCode(questionCode);
            if (question == null) {
                return new ResponseEntity<>(
                        new BaseResponse("99", "Question not found"),
                        HttpStatus.NOT_FOUND);
            }
            return ResponseEntity.ok(question);
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new BaseResponse("99", "Error: " + e.getMessage()),
                    HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/code/{questionCode}/with-answers")
    public ResponseEntity<?> getQuestionWithAnswersByCode(@PathVariable String questionCode) {
        try {
            QuestionDTO question = questionService.getQuestionWithAnswersByCode(questionCode);
            if (question == null) {
                return new ResponseEntity<>(
                        new BaseResponse("99", "Question not found"),
                        HttpStatus.NOT_FOUND);
            }
            return ResponseEntity.ok(question);
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new BaseResponse("99", "Error: " + e.getMessage()),
                    HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/volume/{volumeSlug}/with-answers")
    public ResponseEntity<?> getQuestionsWithAnswersByVolumeSlug(@PathVariable String volumeSlug) {
        try {
            List<QuestionDTO> questions = questionService.getQuestionsWithAnswersByVolumeSlug(volumeSlug);
            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new BaseResponse("99", "Error: " + e.getMessage()),
                    HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/insert")
    public ResponseEntity<?> insertQuestion(@RequestBody QuestionDTO question) {
        try {
            boolean success = questionService.insertQuestion(question);
            if (success) {
                return new ResponseEntity<>(
                        new BaseResponse("00", "Question inserted successfully"),
                        HttpStatus.OK);
            } else {
                return new ResponseEntity<>(
                        new BaseResponse("99", "Failed to insert question"),
                        HttpStatus.BAD_REQUEST);
            }
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new BaseResponse("99", "Error: " + e.getMessage()),
                    HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateQuestion(@RequestBody QuestionDTO question) {
        try {
            boolean success = questionService.updateQuestion(question);
            if (success) {
                return new ResponseEntity<>(
                        new BaseResponse("00", "Question updated successfully"),
                        HttpStatus.OK);
            } else {
                return new ResponseEntity<>(
                        new BaseResponse("99", "Failed to update question"),
                        HttpStatus.BAD_REQUEST);
            }
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new BaseResponse("99", "Error: " + e.getMessage()),
                    HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/delete/{questionCode}")
    public ResponseEntity<?> deleteQuestion(@PathVariable String questionCode) {
        try {
            boolean success = questionService.deleteQuestion(questionCode);
            if (success) {
                return new ResponseEntity<>(
                        new BaseResponse("00", "Question deleted successfully"),
                        HttpStatus.OK);
            } else {
                return new ResponseEntity<>(
                        new BaseResponse("99", "Failed to delete question"),
                        HttpStatus.BAD_REQUEST);
            }
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new BaseResponse("99", "Error: " + e.getMessage()),
                    HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/submit-quiz")
    public ResponseEntity<?> submitQuiz(@RequestBody QuizSubmissionRequest request) {
        try {
            QuizResultDTO result = questionService.calculateQuizResult(
                    request.getUserAnswers(),
                    request.getQuestions()
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new BaseResponse("99", "Error: " + e.getMessage()),
                    HttpStatus.BAD_REQUEST);
        }
    }

    public static class QuizSubmissionRequest {
        private Map<String, String> userAnswers;
        private List<QuestionDTO> questions;

        public Map<String, String> getUserAnswers() {
            return userAnswers;
        }

        public void setUserAnswers(Map<String, String> userAnswers) {
            this.userAnswers = userAnswers;
        }

        public List<QuestionDTO> getQuestions() {
            return questions;
        }

        public void setQuestions(List<QuestionDTO> questions) {
            this.questions = questions;
        }
    }
}
