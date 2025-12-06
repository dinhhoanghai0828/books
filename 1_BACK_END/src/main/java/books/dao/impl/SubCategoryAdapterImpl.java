package books.dao.impl;

import books.dao.interfaces.SubCategoryAdapter;
import books.entity.Book;
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
public class SubCategoryAdapterImpl implements SubCategoryAdapter {
    private static final Logger logger = LoggerFactory.getLogger(SubCategoryAdapterImpl.class);
    private static final String SQL_COUNT_BOOKS_BY_SUBCATEGORY_SLUG = "SELECT COUNT(*) FROM BOOKS B INNER JOIN SUBCATEGORIES S ON B.SUBCATEGORY_SLUG = S.SLUG  WHERE S.SLUG = ?";
    private static final String SQL_GET_BOOKS_BY_SUBCATEGORY_SLUG = "SELECT B.* FROM BOOKS B INNER JOIN SUBCATEGORIES S ON B.SUBCATEGORY_SLUG = S.SLUG  WHERE S.SLUG = ? LIMIT ? OFFSET ?";

    @Override
    public Map<String, Object> getBookBySubCategorySlug(String subCategorySlug, String page, String size) throws Exception {
        String thisMethod = "SubCategoryAdapterImpl.getBookBySubCategoryId";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        Map<String, Object> result = new HashMap<>();  // Sử dụng Map với Object là giá trị
        int totalElements = 0;
        int totalPages = 0;
        List<Book> books = new ArrayList<>();
        try {
            // Truy vấn tổng số sách
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_COUNT_BOOKS_BY_SUBCATEGORY_SLUG);
            pstmt.setString(1, subCategorySlug);
            rs = DBUtils.executeQuery(pstmt, SQL_COUNT_BOOKS_BY_SUBCATEGORY_SLUG);

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
            // Truy vấn danh sách sách theo phân trang
            pstmt = DBUtils.prepareStatement(con, SQL_GET_BOOKS_BY_SUBCATEGORY_SLUG);
            pstmt.setString(1, subCategorySlug);
            pstmt.setInt(2, Integer.parseInt(size));
            int offset = Integer.parseInt(size) * Integer.parseInt(page);
            pstmt.setInt(3, offset);
            rs = DBUtils.executeQuery(pstmt, SQL_GET_BOOKS_BY_SUBCATEGORY_SLUG);
            while (rs.next()) {
                Book book = new Book();
                book.setId(rs.getString("ID"));
                book.setUuid(rs.getString("UUID"));
                book.setSlug(rs.getString("SLUG"));
                book.setEng(rs.getString("ENG"));
                book.setVi(rs.getString("VI"));
                book.setAuthor(rs.getString("AUTHOR"));
                book.setDescription(rs.getString("DESCRIPTION"));
                book.setImg(rs.getString("IMG"));
                book.setSubCategorySlug(rs.getString("SUBCATEGORY_SLUG"));
                book.setNumber(rs.getInt("NUMBER"));
                books.add(book);
            }

            // Đưa danh sách sách vào Map
            result.put("BOOKS", books);

        } catch (Exception ex) {
            logger.error(thisMethod, ex);
            throw (ex);
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }

        return result;  // Trả về Map chứa cả dữ liệu sách và phân trang
    }
}
