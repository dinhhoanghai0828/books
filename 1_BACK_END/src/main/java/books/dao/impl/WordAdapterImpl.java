package books.dao.impl;

import books.dao.interfaces.WordAdapter;
import books.entity.Word;
import books.utils.DBUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class WordAdapterImpl implements WordAdapter {
    private static final Logger logger = LoggerFactory.getLogger(WordAdapterImpl.class);
    private static final String SQL_GET_ENG_WORDS    = "SELECT ENG FROM WORDS WHERE ENG LIKE ? GROUP BY ENG";
    private static final String SQL_GET_VI_WORDS     = "SELECT VI FROM WORDS WHERE BINARY VI LIKE ? GROUP BY VI";
    private static final String SQL_GET_HIGHLIGHT_WORDS = "SELECT ENG, VI FROM WORDS WHERE 1 = 1 ";
    private static final String SQL_GET_MEANING_WORDS   = "SELECT ENG, VI FROM WORDS WHERE 1 = 1 ";
    private static final String SQL_INSERT_WORD      = "INSERT INTO WORDS (ENG, VI) VALUES (?, ?)";
    private static final String SQL_COUNT_WORDS      = "SELECT COUNT(*) FROM WORDS WHERE 1 = 1 ";
    private static final String SQL_GET_WORDS        = "SELECT ID, ENG, VI FROM WORDS WHERE 1 = 1 ";
    private static final String SQL_UPDATE_WORD      = "UPDATE WORDS SET ENG = ?, VI = ? WHERE ID = ?";
    private static final String SQL_DELETE_WORD      = "DELETE FROM WORDS WHERE ID = ?";
    private static final String SQL_CHECK_MISSING_WORDS = "SELECT COUNT(*) FROM MISSING_WORDS WHERE LOWER(ENG) = LOWER(?)";

    @Override
    public List<Word> getEngWords(String eng) throws Exception {
        String thisMethod = "WordAdapterImpl.getEngWords";
        List<Word> words = new ArrayList<>();
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_GET_ENG_WORDS);
            pstmt.setString(1, eng + "%");
            rs = DBUtils.executeQuery(pstmt, SQL_GET_ENG_WORDS);
            while (rs.next()) {
                Word word = new Word();
                word.setEng(rs.getString("ENG"));
//                word.setVi(rs.getString("VI"));
                words.add(word);
            }
        } catch (Exception ex) {
            logger.error(thisMethod, ex);
            throw (ex);
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }
        return words;
    }

    @Override
    public List<Word> getViWords(String vi) throws Exception {
        String thisMethod = "WordAdapterImpl.getViWords";
        List<Word> words = new ArrayList<>();
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_GET_VI_WORDS);
            pstmt.setString(1, vi + "%");
            rs = DBUtils.executeQuery(pstmt, SQL_GET_VI_WORDS);
            while (rs.next()) {
                Word word = new Word();
//                word.setEng(rs.getString("ENG"));
                word.setVi(rs.getString("VI"));
                words.add(word);
            }
        } catch (Exception ex) {
            logger.error(thisMethod, ex);
            throw (ex);
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }
        return words;
    }

    @Override
    public List<Word> getHighlight(String eng, String vi) throws Exception {
        String thisMethod = "WordAdapterImpl.getHighlight";
        List<Word> words = new ArrayList<>();
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            StringBuffer sql = new StringBuffer(SQL_GET_HIGHLIGHT_WORDS);
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);

            if (StringUtils.isNotBlank(eng)) {
                sql.append(" AND ENG = ?");
            }
            if (StringUtils.isNotBlank(vi)) {
                sql.append(" AND VI = ?");
            }
            sql.append(" ORDER BY VI DESC");
            pstmt = DBUtils.prepareStatement(con, sql.toString());
            int index = 1;
            if (StringUtils.isNotBlank(eng)) {
                pstmt.setString(index++, eng);
            }
            if (StringUtils.isNotBlank(vi)) {
                pstmt.setString(index++, vi);
            }
            rs = DBUtils.executeQuery(pstmt, SQL_GET_HIGHLIGHT_WORDS);
            while (rs.next()) {
                Word word = new Word();
                word.setEng(rs.getString("ENG"));
                word.setVi(rs.getString("VI"));
                words.add(word);
            }
        } catch (Exception ex) {
            logger.error(thisMethod, ex);
            throw (ex);
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }
        return words;
    }

    @Override
    public List<Word> getMeaning(String eng, String vi) throws Exception {
        String thisMethod = "WordAdapterImpl.getMeaning";
        List<Word> words = new ArrayList<>();
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            StringBuffer sql = new StringBuffer(SQL_GET_MEANING_WORDS);
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);

            if (StringUtils.isNotBlank(eng)) {
                sql.append(" AND ENG LIKE ? ORDER BY ENG ASC, LENGTH(VI) ASC");
            }
            if (StringUtils.isNotBlank(vi)) {
                sql.append(" AND VI LIKE BINARY ? ORDER BY VI ASC, LENGTH(ENG) ASC");
            }

            pstmt = DBUtils.prepareStatement(con, sql.toString());
            int index = 1;
            if (StringUtils.isNotBlank(eng)) {
                pstmt.setString(index++, eng + '%');
            }
            if (StringUtils.isNotBlank(vi)) {
                pstmt.setString(index++, vi + '%');
            }
            rs = DBUtils.executeQuery(pstmt, sql.toString());
            while (rs.next()) {
                Word word = new Word();
                word.setEng(rs.getString("ENG"));
                word.setVi(rs.getString("VI"));
                words.add(word);
            }
        } catch (Exception ex) {
            logger.error(thisMethod, ex);
            throw (ex);
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }
        return words;
    }

    @Override
    public int insertWords(String eng, List<String> viList) throws Exception {
        String thisMethod = "WordAdapterImpl.insertWords";
        Connection con = null;
        PreparedStatement pstmtCheck = null;
        PreparedStatement pstmt = null;
        int totalInserted = 0;
        try {
            con = DBUtils.getConnection(thisMethod, false, Connection.TRANSACTION_READ_COMMITTED);

            // Kiem tra tung cap (eng, vi) truoc khi insert
            String sqlCheck = "SELECT COUNT(*) FROM WORDS WHERE LOWER(ENG) = LOWER(?) AND LOWER(VI) = LOWER(?)";
            for (String vi : viList) {
                pstmtCheck = DBUtils.prepareStatement(con, sqlCheck);
                pstmtCheck.setString(1, eng.trim());
                pstmtCheck.setString(2, vi.trim());
                ResultSet rs = pstmtCheck.executeQuery();
                if (rs.next() && rs.getInt(1) > 0) {
                    rs.close();
                    throw new Exception(
                        "Từ \"" + eng.trim() + "\" có nghĩa tiếng Việt \"" + vi.trim()
                        + "\" đã tồn tại. Vui lòng thêm nghĩa tiếng Việt khác."
                    );
                }
                rs.close();
                DBUtils.closeStatement(pstmtCheck);
                pstmtCheck = null;
            }

            // Tat ca cac cap deu hop le, thuc hien insert
            pstmt = DBUtils.prepareStatement(con, SQL_INSERT_WORD);
            for (String vi : viList) {
                pstmt.setString(1, eng);
                pstmt.setString(2, vi);
                pstmt.addBatch();
            }
            int[] results = pstmt.executeBatch();
            con.commit();
            for (int r : results) {
                if (r > 0) totalInserted += r;
            }
        } catch (Exception ex) {
            if (con != null) {
                try { con.rollback(); } catch (SQLException ignored) {}
            }
            logger.error(thisMethod, ex);
            throw ex;
        } finally {
            DBUtils.closeStatement(pstmtCheck);
            DBUtils.closeAll(thisMethod, con, pstmt, null);
        }
        return totalInserted;
    }

    @Override
    public Map<String, Object> getWords(String eng, String vi, String page, String size) throws Exception {
        String thisMethod = "WordAdapterImpl.getWords";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        Map<String, Object> result = new HashMap<>();
        int totalElements = 0;
        List<Word> words = new ArrayList<>();

        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);

            // Đếm tổng
            StringBuffer countSql = new StringBuffer(SQL_COUNT_WORDS);
            if (StringUtils.isNotBlank(eng)) {
                countSql.append(" AND UPPER(ENG) LIKE CONCAT('%', UPPER(?), '%')");
            }
            if (StringUtils.isNotBlank(vi)) {
                countSql.append(" AND UPPER(VI) LIKE CONCAT('%', UPPER(?), '%')");
            }
            pstmt = DBUtils.prepareStatement(con, countSql.toString());
            int index = 1;
            if (StringUtils.isNotBlank(eng)) pstmt.setString(index++, eng);
            if (StringUtils.isNotBlank(vi))  pstmt.setString(index++, vi);
            rs = DBUtils.executeQuery(pstmt, countSql.toString());
            if (rs.next()) totalElements = rs.getInt(1);

            int pageInt  = Integer.parseInt(page);
            int sizeInt  = Integer.parseInt(size);
            int offset   = pageInt * sizeInt;
            int totalPages = (int) Math.ceil((double) totalElements / sizeInt);

            result.put("TOTAL_ELEMENTS", totalElements);
            result.put("TOTAL_PAGES",    totalPages);
            result.put("SIZE",           sizeInt);
            result.put("PAGE",           pageInt);
            DBUtils.closeResultSet(rs);
            DBUtils.closeStatement(pstmt);

            // Lấy dữ liệu có phân trang
            StringBuffer dataSql = new StringBuffer(SQL_GET_WORDS);
            if (StringUtils.isNotBlank(eng)) {
                dataSql.append(" AND UPPER(ENG) LIKE CONCAT('%', UPPER(?), '%')");
            }
            if (StringUtils.isNotBlank(vi)) {
                dataSql.append(" AND UPPER(VI) LIKE CONCAT('%', UPPER(?), '%')");
            }
            dataSql.append(" ORDER BY ENG ASC LIMIT ? OFFSET ?");
            pstmt = DBUtils.prepareStatement(con, dataSql.toString());
            index = 1;
            if (StringUtils.isNotBlank(eng)) pstmt.setString(index++, eng);
            if (StringUtils.isNotBlank(vi))  pstmt.setString(index++, vi);
            pstmt.setInt(index++, sizeInt);
            pstmt.setInt(index,   offset);
            rs = DBUtils.executeQuery(pstmt, dataSql.toString());
            while (rs.next()) {
                Word word = new Word();
                word.setId(rs.getString("ID"));
                word.setEng(rs.getString("ENG"));
                word.setVi(rs.getString("VI"));
                words.add(word);
            }
            result.put("WORDS", words);
        } catch (Exception ex) {
            logger.error(thisMethod, ex);
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }
        return result;
    }

    @Override
    public boolean updateWord(Long id, String eng, String vi) throws Exception {
        String thisMethod = "WordAdapterImpl.updateWord";
        Connection con = null;
        PreparedStatement pstmtCheck = null;
        PreparedStatement pstmt = null;
        try {
            con = DBUtils.getConnection(thisMethod, false, Connection.TRANSACTION_READ_COMMITTED);

            // Kiem tra cap (eng, vi) da ton tai chua, bo qua chinh record dang sua
            String sqlCheck = "SELECT COUNT(*) FROM WORDS WHERE LOWER(ENG) = LOWER(?) AND LOWER(VI) = LOWER(?) AND ID != ?";
            pstmtCheck = DBUtils.prepareStatement(con, sqlCheck);
            pstmtCheck.setString(1, eng.trim());
            pstmtCheck.setString(2, vi.trim());
            pstmtCheck.setLong(3, id);
            ResultSet rs = pstmtCheck.executeQuery();
            if (rs.next() && rs.getInt(1) > 0) {
                rs.close();
                throw new Exception(
                    "Từ \"" + eng.trim() + "\" có nghĩa tiếng Việt \"" + vi.trim()
                    + "\" đã tồn tại. Vui lòng nhập nghĩa tiếng Việt khác."
                );
            }
            rs.close();
            DBUtils.closeStatement(pstmtCheck);
            pstmtCheck = null;

            // Thuc hien update
            pstmt = DBUtils.prepareStatement(con, SQL_UPDATE_WORD);
            pstmt.setString(1, eng);
            pstmt.setString(2, vi);
            pstmt.setLong(3, id);
            int rows = pstmt.executeUpdate();
            con.commit();
            return rows > 0;
        } catch (Exception ex) {
            if (con != null) { try { con.rollback(); } catch (SQLException ignored) {} }
            logger.error(thisMethod, ex);
            throw ex;
        } finally {
            DBUtils.closeStatement(pstmtCheck);
            DBUtils.closeAll(thisMethod, con, pstmt, null);
        }
    }

    @Override
    public boolean deleteWord(Long id) throws Exception {
        String thisMethod = "WordAdapterImpl.deleteWord";
        Connection con = null;
        PreparedStatement pstmt = null;
        try {
            con = DBUtils.getConnection(thisMethod, false, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_DELETE_WORD);
            pstmt.setLong(1, id);
            int rows = pstmt.executeUpdate();
            con.commit();
            return rows > 0;
        } catch (Exception ex) {
            if (con != null) { try { con.rollback(); } catch (SQLException ignored) {} }
            logger.error(thisMethod, ex);
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, null);
        }
    }

    @Override
    public boolean isInMissingWords(String eng) throws Exception {
        String thisMethod = "WordAdapterImpl.isInMissingWords";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_CHECK_MISSING_WORDS);
            pstmt.setString(1, eng);
            rs = DBUtils.executeQuery(pstmt, SQL_CHECK_MISSING_WORDS);
            if (rs.next()) {
                return rs.getInt(1) > 0;
            }
            return false;
        } catch (Exception ex) {
            logger.error(thisMethod, ex);
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }
    }
}
