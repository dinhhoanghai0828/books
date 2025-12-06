package books.dao.impl;

import books.dao.interfaces.ContentAdapter;
import books.entity.Content;
import books.utils.DBUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

@Repository
public class ContentAdapterImpl implements ContentAdapter {
    private static final Logger logger = LoggerFactory.getLogger(ContentAdapterImpl.class);
    private static final String SQL_GET_CONTENTS_BY_VOLUME_SLUG = "SELECT C.*, V.ENG AS VOLUME_ENG, V.VI AS VOLUME_VI, V.AUDIO AS AUDIO FROM CONTENTS C JOIN VOLUMES V ON C.VOLUME_SLUG = V.SLUG WHERE V.SLUG = ?";
    private static final String SQL_GET_MISSING_WORDS = "SELECT * FROM MISSING_WORDS";
    private static final String SQL_COUNT_CONTENTS_SEARCH = "SELECT COUNT(*) FROM CONTENTS WHERE 1 = 1 ";
    private static final String SQL_GET_CONTENTS_SEARCH = "SELECT C.*, V.ENG AS VOLUME_ENG, V.VI AS VOLUME_VI, V.AUDIO AS AUDIO, V.CHECKED AS CHECKED, V.NUMBER AS NUMBER, B.ENG AS BOOK_ENG FROM CONTENTS C INNER JOIN VOLUMES V ON C.VOLUME_SLUG = V.SLUG  INNER JOIN BOOKS B ON B.SLUG = V.BOOK_SLUG WHERE 1 = 1 ";

    @Override
    public List<Content> getContentByVolumeSlug(String volumeSlug) throws Exception {
        String thisMethod = "CategoryAdapterImpl.getContentByVolumeSlug";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        List<Content> contents = new ArrayList<>();
        Set<String> skipWords = new HashSet<>();
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);

            // Lấy danh sách skipWords
            pstmt = DBUtils.prepareStatement(con, SQL_GET_MISSING_WORDS);
            rs = DBUtils.executeQuery(pstmt, SQL_GET_MISSING_WORDS);
            while (rs.next()) {
                skipWords.add(rs.getString("ENG"));
            }
            DBUtils.closeAll(thisMethod, null, pstmt, rs);

            // Lấy nội dung theo volumeSlug
            pstmt = DBUtils.prepareStatement(con, SQL_GET_CONTENTS_BY_VOLUME_SLUG);
            pstmt.setString(1, volumeSlug);
            rs = DBUtils.executeQuery(pstmt, SQL_GET_CONTENTS_BY_VOLUME_SLUG);
            List<String> allWords = new ArrayList<>();  // Lưu tất cả từ trong nội dung

            while (rs.next()) {
                Content content = new Content();
                content.setId(rs.getString("ID"));
                content.setEng(rs.getString("ENG"));
                content.setVi(rs.getString("VI"));
                content.setStartTime(rs.getString("START_TIME"));
                content.setEndTime(rs.getString("END_TIME"));
                content.setVolumeViName(rs.getString("VOLUME_VI"));
                content.setVolumeEngName(rs.getString("VOLUME_ENG"));
                content.setAudio(rs.getString("AUDIO"));

                // Tách các từ trong nội dung và thêm vào danh sách allWords
                String[] words = content.getEng().replaceAll("[^a-zA-Z ]", " ").toLowerCase().split("\\s+");
                for (String word : words) {
                    if (word.length() >= 2 && !skipWords.contains(word)) {
                        allWords.add(word);
                    }
                }

                contents.add(content);
            }

            // Lấy tất cả các từ cần kiểm tra trong cơ sở dữ liệu một lần duy nhất
            if (!allWords.isEmpty()) {
                Set<String> foundWords = getWordsFromDB(allWords, con);  // Truy vấn cơ sở dữ liệu một lần
                for (Content content : contents) {
                    // Tìm các từ thiếu trong nội dung
                    List<String> missingWords = new ArrayList<>();
                    String[] words = content.getEng().replaceAll("[^a-zA-Z ]", " ").toLowerCase().split("\\s+");
                    for (String word : words) {
                        if (word.length() >= 2 && !skipWords.contains(word) && !foundWords.contains(word)) {
                            missingWords.add(word);
                        }
                    }
                    content.setMissingWords(missingWords);
                }
            }

        } catch (Exception ex) {
            logger.error(thisMethod, ex);
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }
        return contents;
    }

    private Set<String> getWordsFromDB(List<String> allWords, Connection con) throws Exception {
        String thisMethod = "CategoryAdapterImpl.getWordsFromDB";
        Set<String> foundWords = new HashSet<>();
        if (!allWords.isEmpty()) {
            // Tạo query với tất cả các từ cần kiểm tra
            String placeholders = String.join(",", Collections.nCopies(allWords.size(), "?"));
            String sql = "SELECT LOWER(ENG) AS ENG FROM WORDS WHERE LOWER(ENG) IN (" + placeholders + ")";
            PreparedStatement pstmt = null;
            ResultSet rs = null;
            try {
                pstmt = DBUtils.prepareStatement(con, sql);
                int i = 1;
                for (String word : allWords) {
                    pstmt.setString(i++, word);
                }
                rs = pstmt.executeQuery();
                while (rs.next()) {
                    foundWords.add(rs.getString("ENG").toLowerCase());
                }
            } finally {
                DBUtils.closeAll(thisMethod, null, pstmt, rs);
            }
        }
        return foundWords;
    }



    public Map<String, Object> getContents(String eng, String vi, String page, String size) throws Exception {
        String thisMethod = "CategoryAdapterImpl.getContents";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        Map<String, Object> result = new HashMap<>();
        int totalElements = 0;
        int totalPages = 0;
        List<Content> contents = new ArrayList<>();

        try {
            StringBuffer sql = new StringBuffer(SQL_COUNT_CONTENTS_SEARCH);
            if (StringUtils.isNotBlank(eng)) {
                sql.append(" AND UPPER(eng) REGEXP CONCAT('\\\\b', UPPER(?), '\\\\b')");
            }
            if (StringUtils.isNotBlank(vi)) {
                sql.append(" AND UPPER(vi) REGEXP CONCAT('\\\\b', UPPER(?), '\\\\b')");
            }
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, sql.toString());

            int index = 1;
            if (StringUtils.isNotBlank(eng)) {
                pstmt.setString(index++, eng);
            }
            if (StringUtils.isNotBlank(vi)) {
                pstmt.setString(index++, vi);
            }
            rs = DBUtils.executeQuery(pstmt, sql.toString());
            if (rs.next()) {
                totalElements = rs.getInt(1);
            }
            // Tính tổng số trang
            totalPages = (int) Math.ceil((double) totalElements / Integer.parseInt(size));
            // Đưa thông tin phân trang vào Map
            result.put("TOTAL_ELEMENTS", totalElements);
            result.put("TOTAL_PAGES", totalPages);
            result.put("SIZE", Integer.parseInt(size));
            result.put("PAGE", Integer.parseInt(page));
            DBUtils.closeResultSet(rs);
            DBUtils.closeStatement(pstmt);

            // Tính toán offset tương ứng với trang hiện tại (page bắt đầu từ 0)
            int pageInt = Integer.parseInt(page);
            int sizeInt = Integer.parseInt(size);
            int offset = pageInt * sizeInt;

            // Truy vấn danh sách sách theo phân trang
            sql = new StringBuffer(SQL_GET_CONTENTS_SEARCH);
            if (StringUtils.isNotBlank(eng)) {
                sql.append(" AND UPPER(C.ENG) REGEXP CONCAT('\\\\b', UPPER(?), '\\\\b')");
            }
            if (StringUtils.isNotBlank(vi)) {
                sql.append(" AND UPPER(C.VI) REGEXP CONCAT('\\\\b', UPPER(?), '\\\\b')");
            }
            if (StringUtils.isNotBlank(eng) || StringUtils.isNotBlank(vi)) {
                sql.append(" ORDER BY V.CHECKED DESC");
            }
            sql.append(" LIMIT ? OFFSET ?");
            pstmt = DBUtils.prepareStatement(con, sql.toString());
            index = 1;
            if (StringUtils.isNotBlank(eng)) {
                pstmt.setString(index++, eng);
            }
            if (StringUtils.isNotBlank(vi)) {
                pstmt.setString(index++, vi);
            }
            pstmt.setInt(index++, sizeInt); // Số phần tử mỗi trang
            pstmt.setInt(index++, offset);  // Offset được tính từ trang và kích thước

            rs = DBUtils.executeQuery(pstmt, sql.toString());
            while (rs.next()) {
                Content content = new Content();
                content.setId(rs.getString("ID"));
                content.setEng(rs.getString("ENG"));
                content.setVi(rs.getString("VI"));
                content.setStartTime(rs.getString("START_TIME"));
                content.setEndTime(rs.getString("END_TIME"));
                content.setVolumeViName(rs.getString("VOLUME_VI"));
                content.setVolumeEngName(rs.getString("VOLUME_ENG"));
                content.setBookEngName(rs.getString("BOOK_ENG") + " " + rs.getString("NUMBER"));
                content.setAudio(rs.getString("AUDIO"));
                content.setChecked(rs.getString("CHECKED"));
                contents.add(content);
            }
            result.put("CONTENTS", contents);
        } catch (Exception ex) {
            logger.error(thisMethod, ex);
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }
        return result;
    }

}
