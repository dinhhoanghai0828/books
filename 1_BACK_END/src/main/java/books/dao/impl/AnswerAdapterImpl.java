package books.dao.impl;

import books.dao.interfaces.AnswerAdapter;
import books.entity.Answer;
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
public class AnswerAdapterImpl implements AnswerAdapter {
    private static final Logger logger = LoggerFactory.getLogger(AnswerAdapterImpl.class);
    private static final String SQL_GET_ANSWERS_BY_QUESTION_CODE = "SELECT * FROM ANSWERS WHERE QUESTION_CODE = ? ORDER BY DISPLAY_ORDER";
    private static final String SQL_INSERT_ANSWER = "INSERT INTO ANSWERS (QUESTION_CODE, OPTION_CODE, OPTION_TEXT, IS_CORRECT, DISPLAY_ORDER, CREATED_BY) VALUES (?, ?, ?, ?, ?, ?)";
    private static final String SQL_UPDATE_ANSWER = "UPDATE ANSWERS SET OPTION_TEXT = ?, IS_CORRECT = ?, DISPLAY_ORDER = ?, UPDATED_BY = ? WHERE QUESTION_CODE = ? AND OPTION_CODE = ?";
    private static final String SQL_DELETE_ANSWER = "DELETE FROM ANSWERS WHERE QUESTION_CODE = ? AND OPTION_CODE = ?";
    private static final String SQL_DELETE_ANSWERS_BY_QUESTION_CODE = "DELETE FROM ANSWERS WHERE QUESTION_CODE = ?";

    @Override
    public List<Answer> getAnswersByQuestionCode(String questionCode) throws Exception {
        String thisMethod = "AnswerAdapterImpl.getAnswersByQuestionCode";
        List<Answer> answers = new ArrayList<>();
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_GET_ANSWERS_BY_QUESTION_CODE);
            pstmt.setString(1, questionCode);
            rs = DBUtils.executeQuery(pstmt, SQL_GET_ANSWERS_BY_QUESTION_CODE);
            while (rs.next()) {
                Answer answer = new Answer();
                answer.setId(rs.getString("ID"));
                answer.setQuestionCode(rs.getString("QUESTION_CODE"));
                answer.setOptionCode(rs.getString("OPTION_CODE"));
                answer.setOptionText(rs.getString("OPTION_TEXT"));
                answer.setIsCorrect(rs.getString("IS_CORRECT"));
                answer.setDisplayOrder(rs.getInt("DISPLAY_ORDER"));
                answer.setCreatedAt(rs.getTimestamp("CREATED_AT"));
                answer.setUpdatedAt(rs.getTimestamp("UPDATED_AT"));
                answer.setCreatedBy(rs.getString("CREATED_BY"));
                answer.setUpdatedBy(rs.getString("UPDATED_BY"));
                answers.add(answer);
            }
        } catch (Exception ex) {
            logger.error(thisMethod, ex);
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }
        return answers;
    }

    @Override
    public boolean insertAnswer(Answer answer) throws Exception {
        String thisMethod = "AnswerAdapterImpl.insertAnswer";
        Connection con = null;
        PreparedStatement pstmt = null;
        try {
            con = DBUtils.getConnection(thisMethod, false, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_INSERT_ANSWER);
            pstmt.setString(1, answer.getQuestionCode());
            pstmt.setString(2, answer.getOptionCode());
            pstmt.setString(3, answer.getOptionText());
            pstmt.setString(4, answer.getIsCorrect());
            pstmt.setInt(5, answer.getDisplayOrder());
            pstmt.setString(6, answer.getCreatedBy());
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
    public boolean updateAnswer(Answer answer) throws Exception {
        String thisMethod = "AnswerAdapterImpl.updateAnswer";
        Connection con = null;
        PreparedStatement pstmt = null;
        try {
            con = DBUtils.getConnection(thisMethod, false, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_UPDATE_ANSWER);
            pstmt.setString(1, answer.getOptionText());
            pstmt.setString(2, answer.getIsCorrect());
            pstmt.setInt(3, answer.getDisplayOrder());
            pstmt.setString(4, answer.getUpdatedBy());
            pstmt.setString(5, answer.getQuestionCode());
            pstmt.setString(6, answer.getOptionCode());
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
    public boolean deleteAnswer(String questionCode, String optionCode) throws Exception {
        String thisMethod = "AnswerAdapterImpl.deleteAnswer";
        Connection con = null;
        PreparedStatement pstmt = null;
        try {
            con = DBUtils.getConnection(thisMethod, false, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_DELETE_ANSWER);
            pstmt.setString(1, questionCode);
            pstmt.setString(2, optionCode);
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
    public boolean deleteAnswersByQuestionCode(String questionCode) throws Exception {
        String thisMethod = "AnswerAdapterImpl.deleteAnswersByQuestionCode";
        Connection con = null;
        PreparedStatement pstmt = null;
        try {
            con = DBUtils.getConnection(thisMethod, false, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_DELETE_ANSWERS_BY_QUESTION_CODE);
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
