package books.dao.impl;

import books.dao.interfaces.QuestionAdapter;
import books.entity.Answer;
import books.entity.Question;
import books.utils.DBUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

@Repository
public class QuestionAdapterImpl implements QuestionAdapter {
    private static final Logger logger = LoggerFactory.getLogger(QuestionAdapterImpl.class);
    private static final String SQL_GET_QUESTIONS_BY_VOLUME_SLUG = "SELECT * FROM QUESTIONS WHERE VOLUME_SLUG = ? AND STATUS = 'ACTIVE' ORDER BY ID";
    private static final String SQL_GET_QUESTION_BY_CODE = "SELECT * FROM QUESTIONS WHERE QUESTION_CODE = ?";
    private static final String SQL_GET_QUESTION_WITH_ANSWERS_BY_CODE = "SELECT Q.*, A.ID as ANSWER_ID, A.QUESTION_CODE as ANSWER_QUESTION_CODE, A.OPTION_CODE, A.OPTION_TEXT, A.ANSWER_CODE, A.ANSWER_TEXT, A.ANSWER_TEXT_VI, A.IS_CORRECT, A.DISPLAY_ORDER FROM QUESTIONS Q LEFT JOIN ANSWERS A ON Q.QUESTION_CODE = A.QUESTION_CODE WHERE Q.QUESTION_CODE = ? ORDER BY A.DISPLAY_ORDER";
    private static final String SQL_GET_QUESTIONS_WITH_ANSWERS_BY_VOLUME_SLUG = "SELECT Q.*, A.ID as ANSWER_ID, A.QUESTION_CODE as ANSWER_QUESTION_CODE, A.OPTION_CODE, A.OPTION_TEXT, A.ANSWER_CODE, A.ANSWER_TEXT, A.ANSWER_TEXT_VI, A.IS_CORRECT, A.DISPLAY_ORDER FROM QUESTIONS Q LEFT JOIN ANSWERS A ON Q.QUESTION_CODE = A.QUESTION_CODE WHERE Q.VOLUME_SLUG = ? AND Q.STATUS = 'ACTIVE' ORDER BY Q.ID, A.DISPLAY_ORDER";
    private static final String SQL_INSERT_QUESTION = "INSERT INTO QUESTIONS (QUESTION_CODE, VOLUME_SLUG, QUESTION_TEXT, QUESTION_TEXT_VI, STATUS, CREATED_BY) VALUES (?, ?, ?, ?, 'ACTIVE', ?)";
    private static final String SQL_UPDATE_QUESTION = "UPDATE QUESTIONS SET QUESTION_TEXT = ?, QUESTION_TEXT_VI = ?, STATUS = ?, UPDATED_BY = ? WHERE QUESTION_CODE = ?";
    private static final String SQL_DELETE_QUESTION = "DELETE FROM QUESTIONS WHERE QUESTION_CODE = ?";

    @Override
    public List<Question> getQuestionsByVolumeSlug(String volumeSlug) throws Exception {
        String thisMethod = "QuestionAdapterImpl.getQuestionsByVolumeSlug";
        List<Question> questions = new ArrayList<>();
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_GET_QUESTIONS_BY_VOLUME_SLUG);
            pstmt.setString(1, volumeSlug);
            rs = DBUtils.executeQuery(pstmt, SQL_GET_QUESTIONS_BY_VOLUME_SLUG);
            while (rs.next()) {
                Question question = new Question();
                question.setId(rs.getString("ID"));
                question.setQuestionCode(rs.getString("QUESTION_CODE"));
                question.setVolumeSlug(rs.getString("VOLUME_SLUG"));
                question.setQuestionText(rs.getString("QUESTION_TEXT"));
                question.setQuestionTextVi(rs.getString("QUESTION_TEXT_VI"));
                question.setStatus(rs.getString("STATUS"));
                question.setCreatedAt(rs.getTimestamp("CREATED_AT"));
                question.setUpdatedAt(rs.getTimestamp("UPDATED_AT"));
                question.setCreatedBy(rs.getString("CREATED_BY"));
                question.setUpdatedBy(rs.getString("UPDATED_BY"));
                questions.add(question);
            }
        } catch (Exception ex) {
            logger.error(thisMethod, ex);
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }
        return questions;
    }

    @Override
    public Question getQuestionByCode(String questionCode) throws Exception {
        String thisMethod = "QuestionAdapterImpl.getQuestionByCode";
        Question question = null;
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_GET_QUESTION_BY_CODE);
            pstmt.setString(1, questionCode);
            rs = DBUtils.executeQuery(pstmt, SQL_GET_QUESTION_BY_CODE);
            if (rs.next()) {
                question = new Question();
                question.setId(rs.getString("ID"));
                question.setQuestionCode(rs.getString("QUESTION_CODE"));
                question.setVolumeSlug(rs.getString("VOLUME_SLUG"));
                question.setQuestionText(rs.getString("QUESTION_TEXT"));
                question.setQuestionTextVi(rs.getString("QUESTION_TEXT_VI"));
                question.setStatus(rs.getString("STATUS"));
                question.setCreatedAt(rs.getTimestamp("CREATED_AT"));
                question.setUpdatedAt(rs.getTimestamp("UPDATED_AT"));
                question.setCreatedBy(rs.getString("CREATED_BY"));
                question.setUpdatedBy(rs.getString("UPDATED_BY"));
            }
        } catch (Exception ex) {
            logger.error(thisMethod, ex);
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }
        return question;
    }

    @Override
    public Question getQuestionWithAnswersByCode(String questionCode) throws Exception {
        String thisMethod = "QuestionAdapterImpl.getQuestionWithAnswersByCode";
        Question question = null;
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_GET_QUESTION_WITH_ANSWERS_BY_CODE);
            pstmt.setString(1, questionCode);
            rs = DBUtils.executeQuery(pstmt, SQL_GET_QUESTION_WITH_ANSWERS_BY_CODE);

            List<Answer> answers = new ArrayList<>();

            while (rs.next()) {
                if (question == null) {
                    question = new Question();
                    question.setId(rs.getString("ID"));
                    question.setQuestionCode(rs.getString("QUESTION_CODE"));
                    question.setVolumeSlug(rs.getString("VOLUME_SLUG"));
                    question.setQuestionText(rs.getString("QUESTION_TEXT"));
                    question.setQuestionTextVi(rs.getString("QUESTION_TEXT_VI"));
                    question.setStatus(rs.getString("STATUS"));
                    question.setCreatedAt(rs.getTimestamp("CREATED_AT"));
                    question.setUpdatedAt(rs.getTimestamp("UPDATED_AT"));
                    question.setCreatedBy(rs.getString("CREATED_BY"));
                    question.setUpdatedBy(rs.getString("UPDATED_BY"));
                    question.setAnswers(answers);
                }

                String answerId = rs.getString("ANSWER_ID");
                if (answerId != null) {
                    Answer answer = new Answer();
                    answer.setId(answerId);
                    answer.setQuestionCode(rs.getString("ANSWER_QUESTION_CODE"));
                    answer.setOptionCode(rs.getString("OPTION_CODE"));
                    answer.setOptionText(rs.getString("OPTION_TEXT"));
                    answer.setAnswerCode(rs.getString("ANSWER_CODE"));
                    answer.setAnswerText(rs.getString("ANSWER_TEXT"));
                    answer.setAnswerTextVi(rs.getString("ANSWER_TEXT_VI"));
                    answer.setIsCorrect(rs.getString("IS_CORRECT"));
                    answer.setDisplayOrder(rs.getInt("DISPLAY_ORDER"));
                    answer.setCreatedAt(rs.getTimestamp("CREATED_AT"));
                    answer.setUpdatedAt(rs.getTimestamp("UPDATED_AT"));
                    answer.setCreatedBy(rs.getString("CREATED_BY"));
                    answer.setUpdatedBy(rs.getString("UPDATED_BY"));
                    answers.add(answer);
                }
            }
        } catch (Exception ex) {
            logger.error(thisMethod, ex);
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }
        return question;
    }

    @Override
    public List<Question> getQuestionsWithAnswersByVolumeSlug(String volumeSlug) throws Exception {
        String thisMethod = "QuestionAdapterImpl.getQuestionsWithAnswersByVolumeSlug";
        List<Question> questions = new ArrayList<>();
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_GET_QUESTIONS_WITH_ANSWERS_BY_VOLUME_SLUG);
            pstmt.setString(1, volumeSlug);
            rs = DBUtils.executeQuery(pstmt, SQL_GET_QUESTIONS_WITH_ANSWERS_BY_VOLUME_SLUG);

            Question currentQuestion = null;
            List<Answer> currentAnswers = null;

            while (rs.next()) {
                String questionId = rs.getString("ID");
                String questionCode = rs.getString("QUESTION_CODE");

                if (currentQuestion == null || !currentQuestion.getQuestionCode().equals(questionCode)) {
                    if (currentQuestion != null) {
                        currentQuestion.setAnswers(currentAnswers);
                        questions.add(currentQuestion);
                    }
                    currentQuestion = new Question();
                    currentQuestion.setId(questionId);
                    currentQuestion.setQuestionCode(questionCode);
                    currentQuestion.setVolumeSlug(rs.getString("VOLUME_SLUG"));
                    currentQuestion.setQuestionText(rs.getString("QUESTION_TEXT"));
                    currentQuestion.setQuestionTextVi(rs.getString("QUESTION_TEXT_VI"));
                    currentQuestion.setStatus(rs.getString("STATUS"));
                    currentQuestion.setCreatedAt(rs.getTimestamp("CREATED_AT"));
                    currentQuestion.setUpdatedAt(rs.getTimestamp("UPDATED_AT"));
                    currentQuestion.setCreatedBy(rs.getString("CREATED_BY"));
                    currentQuestion.setUpdatedBy(rs.getString("UPDATED_BY"));
                    currentAnswers = new ArrayList<>();
                }

                String answerId = rs.getString("ANSWER_ID");
                if (answerId != null) {
                    Answer answer = new Answer();
                    answer.setId(answerId);
                    answer.setQuestionCode(rs.getString("ANSWER_QUESTION_CODE"));
                    answer.setOptionCode(rs.getString("OPTION_CODE"));
                    answer.setOptionText(rs.getString("OPTION_TEXT"));
                    answer.setAnswerCode(rs.getString("ANSWER_CODE"));
                    answer.setAnswerText(rs.getString("ANSWER_TEXT"));
                    answer.setAnswerTextVi(rs.getString("ANSWER_TEXT_VI"));
                    answer.setIsCorrect(rs.getString("IS_CORRECT"));
                    answer.setDisplayOrder(rs.getInt("DISPLAY_ORDER"));
                    answer.setCreatedAt(rs.getTimestamp("CREATED_AT"));
                    answer.setUpdatedAt(rs.getTimestamp("UPDATED_AT"));
                    answer.setCreatedBy(rs.getString("CREATED_BY"));
                    answer.setUpdatedBy(rs.getString("UPDATED_BY"));
                    currentAnswers.add(answer);
                }
            }

            if (currentQuestion != null) {
                currentQuestion.setAnswers(currentAnswers);
                questions.add(currentQuestion);
            }
        } catch (Exception ex) {
            logger.error(thisMethod, ex);
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }
        return questions;
    }

    @Override
    public boolean insertQuestion(Question question) throws Exception {
        String thisMethod = "QuestionAdapterImpl.insertQuestion";
        Connection con = null;
        PreparedStatement pstmt = null;
        try {
            con = DBUtils.getConnection(thisMethod, false, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_INSERT_QUESTION);
            pstmt.setString(1, question.getQuestionCode());
            pstmt.setString(2, question.getVolumeSlug());
            pstmt.setString(3, question.getQuestionText());
            pstmt.setString(4, question.getQuestionTextVi());
            pstmt.setString(5, question.getCreatedBy());
            int rows = pstmt.executeUpdate();
            con.commit();
            return rows > 0;
        } catch (Exception ex) {
            if (con != null) {
                try {
                    con.rollback();
                } catch (Exception ignored) {
                }
            }
            logger.error(thisMethod, ex);
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, null);
        }
    }

    @Override
    public boolean updateQuestion(Question question) throws Exception {
        String thisMethod = "QuestionAdapterImpl.updateQuestion";
        Connection con = null;
        PreparedStatement pstmt = null;
        try {
            con = DBUtils.getConnection(thisMethod, false, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_UPDATE_QUESTION);
            pstmt.setString(1, question.getQuestionText());
            pstmt.setString(2, question.getQuestionTextVi());
            pstmt.setString(3, question.getStatus());
            pstmt.setString(4, question.getUpdatedBy());
            pstmt.setString(5, question.getQuestionCode());
            int rows = pstmt.executeUpdate();
            con.commit();
            return rows > 0;
        } catch (Exception ex) {
            if (con != null) {
                try {
                    con.rollback();
                } catch (Exception ignored) {
                }
            }
            logger.error(thisMethod, ex);
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, null);
        }
    }

    @Override
    public boolean deleteQuestion(String questionCode) throws Exception {
        String thisMethod = "QuestionAdapterImpl.deleteQuestion";
        Connection con = null;
        PreparedStatement pstmt = null;
        try {
            con = DBUtils.getConnection(thisMethod, false, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_DELETE_QUESTION);
            pstmt.setString(1, questionCode);
            int rows = pstmt.executeUpdate();
            con.commit();
            return rows > 0;
        } catch (Exception ex) {
            if (con != null) {
                try {
                    con.rollback();
                } catch (Exception ignored) {
                }
            }
            logger.error(thisMethod, ex);
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, null);
        }
    }
}
