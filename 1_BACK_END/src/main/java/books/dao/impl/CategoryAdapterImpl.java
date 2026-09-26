package books.dao.impl;

import books.dao.interfaces.CategoryAdapter;
import books.entity.Book;
import books.entity.Category;
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
    private static final String SQL_GET_CATEGORY = "SELECT C.ID, C.UUID, C.SLUG, C.ENG, C.VI, C.PARENT_SLUG, C.NUMBER FROM CATEGORIES C ORDER BY C.NUMBER ASC";
    private static final String SQL_COUNT_BOOKS_BY_CATEGORY_SLUG = "SELECT COUNT(*) FROM BOOKS B WHERE B.CATEGORY_SLUG = ?";
    private static final String SQL_GET_BOOKS_BY_CATEGORY_SLUG = "SELECT B.* FROM BOOKS B WHERE B.CATEGORY_SLUG = ? LIMIT ? OFFSET ?";

    @Override
    public List<Category> getCategories() throws Exception {
        String thisMethod = "CategoryAdapterImpl.getCategories";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        Map<String, Category> categoryMap = new LinkedHashMap<>();
        List<Category> rootCategories = new ArrayList<>();
        
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_GET_CATEGORY);
            rs = pstmt.executeQuery();

            // Đầu tiên đọc tất cả categories
            while (rs.next()) {
                Category category = new Category();
                category.setId(rs.getString("ID"));
                category.setUuid(rs.getString("UUID"));
                category.setSlug(rs.getString("SLUG"));
                category.setEng(rs.getString("ENG"));
                category.setVi(rs.getString("VI"));
                category.setParentSlug(rs.getString("PARENT_SLUG"));
                category.setNumber(rs.getLong("NUMBER"));
                category.setChildren(new ArrayList<>());
                categoryMap.put(rs.getString("SLUG"), category);
            }

            // Xây cây cấu trúc cha-con dựa trên PARENT_SLUG
            for (Category category : categoryMap.values()) {
                if (category.getParentSlug() == null || category.getParentSlug().isEmpty()) {
                    // Đây là category gốc
                    rootCategories.add(category);
                } else {
                    // Đây là category con, thêm vào cha của nó
                    Category parent = categoryMap.get(category.getParentSlug());
                    if (parent != null) {
                        parent.getChildren().add(category);
                    }
                }
            }

        } catch (Exception ex) {
            logger.error(thisMethod, ex);
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }

        return rootCategories;
    }

    @Override
    public Map<String, Object> getBookBySubCategorySlug(String categorySlug, String page, String size) throws Exception {
        String thisMethod = "CategoryAdapterImpl.getBookBySubCategorySlug";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        Map<String, Object> result = new HashMap<>();
        int totalElements = 0;
        int totalPages = 0;
        List<Book> books = new ArrayList<>();
        
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            
            // Truy vấn tổng số sách
            pstmt = DBUtils.prepareStatement(con, SQL_COUNT_BOOKS_BY_CATEGORY_SLUG);
            pstmt.setString(1, categorySlug);
            rs = DBUtils.executeQuery(pstmt, SQL_COUNT_BOOKS_BY_CATEGORY_SLUG);

            if (rs.next()) {
                totalElements = rs.getInt(1);
            }
            
            // Tính tổng số trang
            totalPages = (int) Math.ceil((double) totalElements / Integer.parseInt(size));
            result.put("TOTAL_ELEMENTS", totalElements);
            result.put("TOTAL_PAGES", totalPages);
            result.put("SIZE", Integer.parseInt(size));
            result.put("PAGE", Integer.parseInt(page));
            DBUtils.closeResultSet(rs);
            DBUtils.closeStatement(pstmt);
            
            // Truy vấn danh sách sách theo phân trang
            pstmt = DBUtils.prepareStatement(con, SQL_GET_BOOKS_BY_CATEGORY_SLUG);
            pstmt.setString(1, categorySlug);
            pstmt.setInt(2, Integer.parseInt(size));
            int offset = Integer.parseInt(size) * Integer.parseInt(page);
            pstmt.setInt(3, offset);
            rs = DBUtils.executeQuery(pstmt, SQL_GET_BOOKS_BY_CATEGORY_SLUG);
            
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
                book.setCategorySlug(rs.getString("CATEGORY_SLUG"));
                book.setNumber(rs.getInt("NUMBER"));
                books.add(book);
            }

            result.put("BOOKS", books);

        } catch (Exception ex) {
            logger.error(thisMethod, ex);
            throw (ex);
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }

        return result;
    }
}