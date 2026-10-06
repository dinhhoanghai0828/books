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
    private static final String SQL_GET_MATH_CATEGORY = "SELECT C.ID, C.CATEGORY_CODE, C.CATEGORY_NAME, C.CATEGORY_DESC, C.PARENT_CODE, C.STATUS FROM MATH_CATEGORIES C WHERE C.STATUS = 'ACTIVE' ORDER BY C.ID ASC";

    @Override
    public List<MathCategory> getMathCategories() throws Exception {
        String thisMethod = "MathCategoryAdapterImpl.getMathCategories";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        Map<String, MathCategory> categoryMap = new LinkedHashMap<>();
        List<MathCategory> rootCategories = new ArrayList<>();

        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_GET_MATH_CATEGORY);
            rs = pstmt.executeQuery();

            // Đầu tiên đọc tất cả categories
            while (rs.next()) {
                MathCategory category = new MathCategory();
                category.setId(rs.getInt("ID"));
                category.setCategoryCode(rs.getString("CATEGORY_CODE"));
                category.setCategoryName(rs.getString("CATEGORY_NAME"));
                category.setCategoryDesc(rs.getString("CATEGORY_DESC"));
                category.setParentCode(rs.getString("PARENT_CODE"));
                category.setStatus(rs.getString("STATUS"));
                category.setChildren(new ArrayList<>());
                categoryMap.put(rs.getString("CATEGORY_CODE"), category);
            }

            // Xây cây cấu trúc cha-con dựa trên PARENT_CODE
            for (MathCategory category : categoryMap.values()) {
                if (category.getParentCode() == null || category.getParentCode().isEmpty()) {
                    // Đây là category gốc
                    rootCategories.add(category);
                } else {
                    // Đây là category con, thêm vào cha của nó
                    MathCategory parent = categoryMap.get(category.getParentCode());
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
}
