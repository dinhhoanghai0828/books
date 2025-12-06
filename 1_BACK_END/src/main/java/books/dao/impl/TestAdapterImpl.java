package books.dao.impl;

import books.dao.interfaces.TestAdapter;
import books.entity.Content;
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
public class TestAdapterImpl implements TestAdapter {
    private static final Logger logger = LoggerFactory.getLogger(TestAdapterImpl.class);
    private static final String SQL_GET_TEST = "SELECT C.*, V.ENG AS VOLUME_ENG, V.VI AS VOLUME_VI, V.AUDIO AS AUDIO, V.NUMBER AS NUMBER, B.ENG AS BOOK_ENG FROM CONTENTS C JOIN VOLUMES V ON C.VOLUME_SLUG = V.SLUG INNER JOIN BOOKS B ON B.SLUG = V.BOOK_SLUG WHERE V.CHECKED = 'YES' ORDER BY RAND() LIMIT ?";
    private static final String SQL_GET_TEST_BY_VOLUME_SLUG = "SELECT C.*, V.ENG AS VOLUME_ENG, V.VI AS VOLUME_VI, V.AUDIO AS AUDIO, V.NUMBER AS NUMBER, B.ENG AS BOOK_ENG FROM CONTENTS C JOIN VOLUMES V ON C.VOLUME_SLUG = V.SLUG INNER JOIN BOOKS B ON B.SLUG = V.BOOK_SLUG WHERE V.CHECKED = 'YES' AND V.SLUG = ? ORDER BY RAND() LIMIT ?";

    @Override
    public List<Content> getTest(String volumeSlug, String limit) throws Exception {
        String thisMethod = "TestAdapterImpl.getTest";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        List<Content> contents = new ArrayList<>();
        try {
            String sql = SQL_GET_TEST;
            if (StringUtils.isNotBlank(volumeSlug)) {
                sql = SQL_GET_TEST_BY_VOLUME_SLUG;
            }
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, sql);
            if (StringUtils.isNotBlank(volumeSlug)) {
                pstmt.setString(1, volumeSlug);
                pstmt.setInt(2, Integer.parseInt(limit));
            } else {
                pstmt.setInt(1, Integer.parseInt(limit));
            }
            rs = DBUtils.executeQuery(pstmt, sql);
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
                content.setBookEngName(rs.getString("BOOK_ENG") + " " + rs.getString("NUMBER"));
                contents.add(content);
            }
        } catch (Exception ex) {
            logger.error(thisMethod, ex);
            throw (ex);
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }
        return contents;
    }
}
