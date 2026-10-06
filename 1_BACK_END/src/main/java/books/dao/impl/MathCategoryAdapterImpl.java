package books.dao.impl;

import books.dao.interfaces.MathCategoryAdapter;
import books.entity.MathCategory;
import books.utils.DBUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.*;

@Repository
public class MathCategoryAdapterImpl implements MathCategoryAdapter {
    private static final Logger logger = LoggerFactory.getLogger(MathCategoryAdapterImpl.class);

    private static final String SQL_GET_ALL =
        "SELECT C.ID, C.CATEGORY_CODE, C.CATEGORY_NAME, C.CATEGORY_DESC, C.PARENT_CODE, C.STATUS, C.FULL_PATH " +
        "FROM MATH_CATEGORIES C WHERE C.STATUS = 'ACTIVE' ORDER BY C.ID ASC";

    // Lấy tất cả categories có FULL_PATH bắt đầu bằng fullPath truyền vào
    // VD: fullPath = "toan/lop-1" → lấy ra category có FULL_PATH = "toan/lop-1" và children "toan/lop-1/..."
    private static final String SQL_GET_BY_FULL_PATH =
        "SELECT C.ID, C.CATEGORY_CODE, C.CATEGORY_NAME, C.CATEGORY_DESC, C.PARENT_CODE, C.STATUS, C.FULL_PATH " +
        "FROM MATH_CATEGORIES C WHERE C.STATUS = 'ACTIVE' AND (C.FULL_PATH = ? OR C.FULL_PATH LIKE ?) ORDER BY C.ID ASC";

    @Override
    public List<MathCategory> getMathCategories() throws Exception {
        return fetchCategories(SQL_GET_ALL, null);
    }

    @Override
    public List<MathCategory> getMathCategoriesByFullPath(String fullPath) throws Exception {
        // param1 = exact match, param2 = children match (fullPath/...)
        return fetchCategoriesByFullPath(fullPath);
    }

    private List<MathCategory> fetchCategoriesByFullPath(String fullPath) throws Exception {
        String thisMethod = "MathCategoryAdapterImpl.fetchCategoriesByFullPath";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        Map<String, MathCategory> categoryMap = new LinkedHashMap<>();
        List<MathCategory> rootCategories = new ArrayList<>();

        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_GET_BY_FULL_PATH);
            pstmt.setString(1, fullPath);
            pstmt.setString(2, fullPath + "/%");
            rs = pstmt.executeQuery();

            while (rs.next()) {
                MathCategory category = mapRow(rs);
                categoryMap.put(category.getCategoryCode(), category);
            }

            buildTree(categoryMap, rootCategories, fullPath);

        } catch (Exception ex) {
            logger.error(thisMethod, ex);
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }

        return rootCategories;
    }

    private List<MathCategory> fetchCategories(String sql, String param) throws Exception {
        String thisMethod = "MathCategoryAdapterImpl.fetchCategories";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        Map<String, MathCategory> categoryMap = new LinkedHashMap<>();
        List<MathCategory> rootCategories = new ArrayList<>();

        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, sql);
            rs = pstmt.executeQuery();

            while (rs.next()) {
                MathCategory category = mapRow(rs);
                categoryMap.put(category.getCategoryCode(), category);
            }

            buildTree(categoryMap, rootCategories, null);

        } catch (Exception ex) {
            logger.error(thisMethod, ex);
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }

        return rootCategories;
    }

    private MathCategory mapRow(ResultSet rs) throws Exception {
        MathCategory category = new MathCategory();
        category.setId(rs.getInt("ID"));
        category.setCategoryCode(rs.getString("CATEGORY_CODE"));
        category.setCategoryName(rs.getString("CATEGORY_NAME"));
        category.setCategoryDesc(rs.getString("CATEGORY_DESC"));
        category.setParentCode(rs.getString("PARENT_CODE"));
        category.setStatus(rs.getString("STATUS"));
        category.setFullPath(rs.getString("FULL_PATH"));
        category.setChildren(new ArrayList<>());
        return category;
    }

    // Khi lọc theo fullPath: root là category có PARENT_CODE = null (trong tập kết quả đã lọc)
    // Khi lấy tất cả: root là category có PARENT_CODE = null
    private void buildTree(Map<String, MathCategory> categoryMap, List<MathCategory> rootCategories, String rootFullPath) {
        for (MathCategory category : categoryMap.values()) {
            String parentCode = category.getParentCode();
            boolean isRoot = (parentCode == null || parentCode.isEmpty())
                    || !categoryMap.containsKey(parentCode); // parent không có trong tập kết quả → là root

            if (isRoot) {
                rootCategories.add(category);
            } else {
                MathCategory parent = categoryMap.get(parentCode);
                if (parent != null) {
                    parent.getChildren().add(category);
                }
            }
        }
    }
}
