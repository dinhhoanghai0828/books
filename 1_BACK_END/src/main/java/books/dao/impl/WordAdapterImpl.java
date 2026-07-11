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
        PreparedStatement pstmt = null;
        int totalInserted = 0;
        try {
            con = DBUtils.getConnection(thisMethod, false, Connection.TRANSACTION_READ_COMMITTED);
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
}
