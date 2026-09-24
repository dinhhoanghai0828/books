package books.dto;

import java.util.List;

public class QuizResultDTO {
    private int totalQuestions;
    private int correctAnswers;
    private int incorrectAnswers;
    private int unansweredQuestions;
    private List<QuestionResultDTO> questionResults;

    public int getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(int totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public int getCorrectAnswers() {
        return correctAnswers;
    }

    public void setCorrectAnswers(int correctAnswers) {
        this.correctAnswers = correctAnswers;
    }

    public int getIncorrectAnswers() {
        return incorrectAnswers;
    }

    public void setIncorrectAnswers(int incorrectAnswers) {
        this.incorrectAnswers = incorrectAnswers;
    }

    public int getUnansweredQuestions() {
        return unansweredQuestions;
    }

    public void setUnansweredQuestions(int unansweredQuestions) {
        this.unansweredQuestions = unansweredQuestions;
    }

    public List<QuestionResultDTO> getQuestionResults() {
        return questionResults;
    }

    public void setQuestionResults(List<QuestionResultDTO> questionResults) {
        this.questionResults = questionResults;
    }
}
