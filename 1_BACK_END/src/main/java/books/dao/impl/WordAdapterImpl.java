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
import java.util.ArrayList;
import java.util.List;

@Repository
public class WordAdapterImpl implements WordAdapter {
    private static final Logger logger = LoggerFactory.getLogger(WordAdapterImpl.class);
    private static final String SQL_GET_ENG_WORDS = "SELECT ENG FROM WORDS WHERE ENG LIKE ? GROUP BY ENG";
    private static final String SQL_GET_VI_WORDS = "SELECT VI FROM WORDS WHERE BINARY VI LIKE ? GROUP BY VI";
    private static final String SQL_GET_HIGHLIGHT_WORDS = "SELECT ENG, VI FROM WORDS WHERE 1 = 1 ";
    private static final String SQL_GET_MEANING_WORDS = "SELECT ENG, VI FROM WORDS WHERE 1 = 1 ";

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
}
