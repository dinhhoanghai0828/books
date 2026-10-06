package books.dto;

import java.util.List;

public class MathQuestionDTO {
    private Integer id;
    private String categoryCode;
    private String questionCode;
    private String questionText;
    private Integer difficulty;
    private String status;
    private List<MathAnswerDTO> answers;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getCategoryCode() {
        return categoryCode;
    }

    public void setCategoryCode(String categoryCode) {
        this.categoryCode = categoryCode;
    }

    public String getQuestionCode() {
        return questionCode;
    }

    public void setQuestionCode(String questionCode) {
        this.questionCode = questionCode;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public Integer getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(Integer difficulty) {
        this.difficulty = difficulty;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<MathAnswerDTO> getAnswers() {
        return answers;
    }

    public void setAnswers(List<MathAnswerDTO> answers) {
        this.answers = answers;
    }
}
