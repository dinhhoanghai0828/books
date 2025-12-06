package books.dao.impl;

import books.dao.interfaces.CategoryAdapter;
import books.entity.Book;
import books.entity.Category;
import books.entity.SubCategory;
import books.utils.DBUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.*;

@Repository
public class CategoryAdapterImpl implements CategoryAdapter {
    private static final Logger logger = LoggerFactory.getLogger(CategoryAdapterImpl.class);
    private static final String SQL_GET_CATEGORY = "SELECT C.ID AS CAT_ID, C.UUID AS CAT_UUID, C.ENG AS CAT_ENG, C.VI AS CAT_VI, C.NUMBER AS CAT_NUMBER, S.UUID AS SUB_UUID, S.ENG AS SUB_ENG, S.VI AS SUB_VI FROM CATEGORIES C LEFT JOIN SUBCATEGORIES S ON C.UUID = S.CATEGORY_ID";
    private static final String SQL_COUNT_BOOKS_BY_SUBCATEGORY_SLUG = "SELECT COUNT(*) FROM BOOKS B INNER JOIN SUBCATEGORIES S ON B.SUBCATEGORY_SLUG = S.SLUG WHERE S.CATEGORY_SLUG = ?";
    private static final String SQL_GET_BOOKS_BY_SUBCATEGORY_SLUG = "SELECT B.* FROM BOOKS B INNER JOIN SUBCATEGORIES S ON B.SUBCATEGORY_SLUG = S.SLUG WHERE S.CATEGORY_SLUG = ? LIMIT ? OFFSET ?";

    @Override
    public List<Category> getCategories() throws Exception {
        String thisMethod = "CategoryAdapterImpl.getCategories";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        Map<String, Category> categoryMap = new LinkedHashMap<>(); // Giữ thứ tự và tránh trùng lặp
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_GET_CATEGORY);
            rs = pstmt.executeQuery();

            while (rs.next()) {
                String categoryId = rs.getString("CAT_ID");
                Category category = categoryMap.get(categoryId);
                if (category == null) {
                    // Nếu category chưa tồn tại, tạo mới và thêm vào map
                    category = new Category();
                    category.setUuid(rs.getString("CAT_UUID"));
                    category.setEng(rs.getString("CAT_ENG"));
                    category.setVi(rs.getString("CAT_VI"));
                    category.setNumber(rs.getLong("CAT_NUMBER"));
                    category.setSubcategories(new ArrayList<>()); // Khởi tạo danh sách subcategory
                    categoryMap.put(categoryId, category);
                }

                // Xử lý subcategory (nếu có)
                String subcategoryUUID = rs.getString("SUB_UUID");
                if (subcategoryUUID != null) { // Kiểm tra nếu có subcategory
                    SubCategory subCategory = new SubCategory();
                    subCategory.setUuid(subcategoryUUID);
                    subCategory.setEng(rs.getString("SUB_ENG"));
                    subCategory.setVi(rs.getString("SUB_VI"));
                    subCategory.setCategoryName(rs.getString("CAT_VI"));
                    category.getSubcategories().add(subCategory);
                }
            }
        } catch (Exception ex) {
            logger.error(ex.getMessage());
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }

        return new ArrayList<>(categoryMap.values());
    }

    @Override
    public Map<String, Object> getBookBySubCategorySlug(String categorySlug, String page, String size) throws Exception {
        String thisMethod = "CategoryAdapterImpl.getBookBySubCategoryId";
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
            pstmt.setString(1, categorySlug);
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
            pstmt.setString(1, categorySlug);
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
