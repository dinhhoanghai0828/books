package books.dao.impl;

import books.dao.interfaces.MathQuestionAdapter;
import books.entity.MathAnswer;
import books.entity.MathQuestion;
import books.utils.DBUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.*;

@Repository
public class MathQuestionAdapterImpl implements MathQuestionAdapter {
    private static final Logger logger = LoggerFactory.getLogger(MathQuestionAdapterImpl.class);
    private static final String SQL_GET_QUESTIONS_BY_CATEGORY = 
        "SELECT Q.ID, Q.CATEGORY_CODE, Q.QUESTION_CODE, Q.QUESTION_TEXT, Q.DIFFICULTY, Q.STATUS " +
        "FROM MATH_QUESTIONS Q WHERE Q.CATEGORY_CODE = ? AND Q.STATUS = 'ACTIVE' ORDER BY Q.DIFFICULTY ASC, Q.ID ASC";
    private static final String SQL_GET_QUESTIONS_BY_PARENT_CATEGORY =
        "SELECT Q.ID, Q.CATEGORY_CODE, Q.QUESTION_CODE, Q.QUESTION_TEXT, Q.DIFFICULTY, Q.STATUS " +
        "FROM MATH_QUESTIONS Q " +
        "WHERE Q.STATUS = 'ACTIVE' " +
        "AND Q.CATEGORY_CODE IN (" +
        "  SELECT CATEGORY_CODE FROM MATH_CATEGORIES WHERE PARENT_CODE = ? AND STATUS = 'ACTIVE'" +
        ") ORDER BY RAND()";
    private static final String SQL_GET_ANSWERS_BY_QUESTION_CODE =
        "SELECT A.ID, A.QUESTION_CODE, A.ANSWER_CODE, A.ANSWER_TEXT, A.IS_CORRECT " +
        "FROM MATH_ANSWERS A WHERE A.QUESTION_CODE = ? ORDER BY A.ANSWER_CODE ASC";

    @Override
    public List<MathQuestion> getQuestionsByCategoryCode(String categoryCode) throws Exception {
        String thisMethod = "MathQuestionAdapterImpl.getQuestionsByCategoryCode";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        List<MathQuestion> questions = new ArrayList<>();

        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            
            // Lấy danh sách câu hỏi
            pstmt = DBUtils.prepareStatement(con, SQL_GET_QUESTIONS_BY_CATEGORY);
            pstmt.setString(1, categoryCode);
            rs = pstmt.executeQuery();

            while (rs.next()) {
                MathQuestion question = new MathQuestion();
                question.setId(rs.getInt("ID"));
                question.setCategoryCode(rs.getString("CATEGORY_CODE"));
                question.setQuestionCode(rs.getString("QUESTION_CODE"));
                question.setQuestionText(rs.getString("QUESTION_TEXT"));
                question.setDifficulty(rs.getInt("DIFFICULTY"));
                question.setStatus(rs.getString("STATUS"));
                question.setAnswers(new ArrayList<>());
                questions.add(question);
            }

            DBUtils.closeResultSet(rs);
            DBUtils.closeStatement(pstmt);

            // Lấy đáp án cho từng câu hỏi
            for (MathQuestion question : questions) {
                pstmt = DBUtils.prepareStatement(con, SQL_GET_ANSWERS_BY_QUESTION_CODE);
                pstmt.setString(1, question.getQuestionCode());
                rs = pstmt.executeQuery();

                List<MathAnswer> answers = new ArrayList<>();
                while (rs.next()) {
                    MathAnswer answer = new MathAnswer();
                    answer.setId(rs.getInt("ID"));
                    answer.setQuestionCode(rs.getString("QUESTION_CODE"));
                    answer.setAnswerCode(rs.getString("ANSWER_CODE"));
                    answer.setAnswerText(rs.getString("ANSWER_TEXT"));
                    answer.setIsCorrect(rs.getString("IS_CORRECT"));
                    answers.add(answer);
                }
                question.setAnswers(answers);

                DBUtils.closeResultSet(rs);
                DBUtils.closeStatement(pstmt);
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
    public List<MathQuestion> getQuestionsByParentCategoryCode(String parentCategoryCode) throws Exception {
        String thisMethod = "MathQuestionAdapterImpl.getQuestionsByParentCategoryCode";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        List<MathQuestion> questions = new ArrayList<>();

        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);

            pstmt = DBUtils.prepareStatement(con, SQL_GET_QUESTIONS_BY_PARENT_CATEGORY);
            pstmt.setString(1, parentCategoryCode);
            rs = pstmt.executeQuery();

            while (rs.next()) {
                MathQuestion question = new MathQuestion();
                question.setId(rs.getInt("ID"));
                question.setCategoryCode(rs.getString("CATEGORY_CODE"));
                question.setQuestionCode(rs.getString("QUESTION_CODE"));
                question.setQuestionText(rs.getString("QUESTION_TEXT"));
                question.setDifficulty(rs.getInt("DIFFICULTY"));
                question.setStatus(rs.getString("STATUS"));
                question.setAnswers(new ArrayList<>());
                questions.add(question);
            }

            DBUtils.closeResultSet(rs);
            DBUtils.closeStatement(pstmt);

            for (MathQuestion question : questions) {
                pstmt = DBUtils.prepareStatement(con, SQL_GET_ANSWERS_BY_QUESTION_CODE);
                pstmt.setString(1, question.getQuestionCode());
                rs = pstmt.executeQuery();

                List<MathAnswer> answers = new ArrayList<>();
                while (rs.next()) {
                    MathAnswer answer = new MathAnswer();
                    answer.setId(rs.getInt("ID"));
                    answer.setQuestionCode(rs.getString("QUESTION_CODE"));
                    answer.setAnswerCode(rs.getString("ANSWER_CODE"));
                    answer.setAnswerText(rs.getString("ANSWER_TEXT"));
                    answer.setIsCorrect(rs.getString("IS_CORRECT"));
                    answers.add(answer);
                }
                question.setAnswers(answers);

                DBUtils.closeResultSet(rs);
                DBUtils.closeStatement(pstmt);
            }

        } catch (Exception ex) {
            logger.error(thisMethod, ex);
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }

        return questions;
    }
}
