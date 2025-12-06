package books.dao.impl;

import books.dao.interfaces.BookAdapter;
import books.entity.Volume;
import books.utils.DBUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class BookAdapterImpl implements BookAdapter {
    private static final Logger logger = LoggerFactory.getLogger(BookAdapterImpl.class);
    private static final String SQL_GET_VOLUMES_BY_BOOK_SLUG = "SELECT V.* FROM VOLUMES V INNER JOIN BOOKS B ON V.BOOK_SLUG = B.SLUG WHERE B.SLUG = ? LIMIT ? OFFSET ?";
    private static final String SQL_COUNT_VOLUMES_BY_BOOK_SLUG = "SELECT COUNT(*) FROM VOLUMES V INNER JOIN BOOKS B ON V.BOOK_SLUG = B.SLUG WHERE B.SLUG = ?";

    @Override
    public Map<String, Object> getVolumeByBookSlug(String slug, String page, String size) throws Exception {
        String thisMethod = "CategoryAdapterImpl.getVolumeByBookSlug";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        Map<String, Object> result = new HashMap<>();
        int totalElements = 0;
        int totalPages = 0;
        List<Volume> volumes = new ArrayList<>();
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_COUNT_VOLUMES_BY_BOOK_SLUG);
            pstmt.setString(1, slug);
            rs = DBUtils.executeQuery(pstmt, SQL_COUNT_VOLUMES_BY_BOOK_SLUG);
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
            pstmt = DBUtils.prepareStatement(con, SQL_GET_VOLUMES_BY_BOOK_SLUG);
            pstmt.setString(1, slug);
            pstmt.setInt(2, Integer.parseInt(size));
            int offset = Integer.parseInt(size) * Integer.parseInt(page);
            pstmt.setInt(3, offset);
            rs = DBUtils.executeQuery(pstmt, SQL_GET_VOLUMES_BY_BOOK_SLUG);
            while (rs.next()) {
                Volume volume = new Volume();
                volume.setId(rs.getString("ID"));
                volume.setUuid(rs.getString("UUID"));
                volume.setSlug(rs.getString("SLUG"));
                volume.setEng(rs.getString("ENG"));
                volume.setVi(rs.getString("VI"));
                volume.setStartTime(rs.getString("START_TIME"));
                volume.setEndTime(rs.getString("END_TIME"));
                volume.setAudio(rs.getString("AUDIO"));
                volume.setImg(rs.getString("IMG"));
                volume.setBookSlug(rs.getString("BOOK_SLUG"));
                volume.setNumber(rs.getInt("NUMBER"));
                volume.setChecked(rs.getString("CHECKED"));
                volumes.add(volume);
            }
            // Đưa danh sách sách vào Map
            result.put("VOLUMES", volumes);
        } catch (Exception ex) {
            logger.error(thisMethod, ex);
            throw (ex);
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }

        return result;  // Trả về Map chứa cả dữ liệu sách và phân trang
    }
}
