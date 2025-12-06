package books.dao.impl;

import books.dao.interfaces.UserAdapter;
import books.entity.User;
import books.entity.Volume;
import books.utils.DBUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

@Repository
public class UserAdapterImpl implements UserAdapter {
    private static final Logger logger = LoggerFactory.getLogger(UserAdapterImpl.class);
    private static final String SQL_GET_USER_BY_USER_NAME = "SELECT * FROM USERS WHERE USERNAME = ?";
    private static final String SQL_GET_USER_BY_ID = "SELECT * FROM USERS WHERE ID = ?";

    @Override
    public User getUserByUserName(String username) throws Exception {
        String thisMethod = "UserAdapterImpl.getUserByUserName";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        User user = null;
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_GET_USER_BY_USER_NAME);
            pstmt.setString(1, username);
            rs = DBUtils.executeQuery(pstmt, SQL_GET_USER_BY_USER_NAME);
            if (rs.next()) {
                user = new User();
                user.setId(rs.getString("ID"));
                user.setUsername(rs.getString("USERNAME"));
                user.setPassword(rs.getString("PASSWORD"));
            }

        } catch (Exception ex) {
            logger.error(ex.getMessage());
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }
        return user;
    }

    @Override
    public User getUserById(String id) throws Exception {
        String thisMethod = "UserAdapterImpl.getUserByUserName";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        User user = null;
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_GET_USER_BY_ID);
            pstmt.setString(1, id);
            rs = DBUtils.executeQuery(pstmt, SQL_GET_USER_BY_ID);
            if (rs.next()) {
                user = new User();
                user.setId(rs.getString("ID"));
                user.setUsername(rs.getString("USERNAME"));
                user.setPassword(rs.getString("PASSWORD"));
            }

        } catch (Exception ex) {
            logger.error(ex.getMessage());
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }
        return user;
    }

    @Override
    public void save(User user) throws Exception {
        String thisMethod = "UserAdapterImpl.saveUser";
        Connection con = null;
        PreparedStatement pstmt = null;

        try {
            // Kết nối cơ sở dữ liệu với mức độ cô lập giao dịch
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);

            // Câu lệnh SQL chèn người dùng
            String SQL_SAVE_USER = "INSERT INTO USERS (ID, USERNAME, PASSWORD) VALUES (?, ?, ?)";

            // Chuẩn bị câu lệnh SQL
            pstmt = DBUtils.prepareStatement(con, SQL_SAVE_USER);

            // Gán giá trị cho các tham số
            pstmt.setString(1, user.getId());
            pstmt.setString(2, user.getUsername());
            pstmt.setString(3, user.getPassword());

            // Thực thi câu lệnh
            int rowsAffected = pstmt.executeUpdate();
            if (rowsAffected > 0) {
                logger.info("User saved successfully: " + user.getUsername());
            } else {
                logger.warn("No rows were affected when saving user: " + user.getUsername());
            }

        } catch (Exception ex) {
            logger.error("Error saving user: " + ex.getMessage());
            throw ex; // Ném ngoại lệ để xử lý ở cấp cao hơn
        } finally {
            // Đóng kết nối và giải phóng tài nguyên
            DBUtils.closeAll(thisMethod, con, pstmt, null);
        }
    }
}
