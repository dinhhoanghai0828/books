package books.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.sql.*;
import java.util.Properties;

public class DBUtils {
    private static final Logger logger = LoggerFactory.getLogger(DBUtils.class);
    private static final Properties properties = new Properties();
    static {
        try (InputStream input = DBUtils.class.getClassLoader().getResourceAsStream("application.properties")) {
            if (input == null) {
                logger.error("Sorry, unable to find application.properties");
                throw new RuntimeException("File application.properties not found");
            }
            properties.load(input);
        } catch (IOException ex) {
            logger.error("Error loading properties file", ex);
            throw new RuntimeException("Failed to load properties", ex);
        }
    }
    public static Connection getConnection(String poolName, boolean autoCommit, int isolationLevel) throws SQLException {
        String url = properties.getProperty("spring.datasource.url");
        String username = properties.getProperty("spring.datasource.username");
        String password = properties.getProperty("spring.datasource.password");
        Connection con = DriverManager.getConnection(url, username, password);
        con.setAutoCommit(autoCommit);
        con.setTransactionIsolation(isolationLevel);
        return con;
    }

    public static PreparedStatement prepareStatement(Connection con, String sql) throws SQLException, Exception {
        PreparedStatement pstmt = con.prepareStatement(sql);
        if (pstmt == null) {
            throw new Exception("Couldn't prepare statement");
        } else {
            return pstmt;
        }
    }

    public static PreparedStatement prepareStatement(Connection con, String sql, int resultSetType, int resultSetConcurrency) throws SQLException, Exception {
        PreparedStatement pstmt = con.prepareStatement(sql, resultSetType, resultSetConcurrency);
        if (pstmt == null) {
            throw new Exception("Couldn't prepare statement");
        } else {
            return pstmt;
        }
    }

    public static boolean execute(Statement stmt, String sql) throws Exception {
        boolean ret = false;

        try {
            ret = stmt.execute(sql);
        } finally {
            logger.error(sql);
        }

        return ret;
    }

    public static ResultSet executeQuery(Statement stmt, String sql) throws Exception {
        ResultSet rs = null;

        try {
            rs = stmt.executeQuery(sql);
        } catch (Exception e) {
            logger.error(sql);
        } finally {

        }

        return rs;
    }

    public static ResultSet executeQuery(PreparedStatement pStmt, String sql) throws Exception {
        ResultSet rs = null;
        try {
            rs = pStmt.executeQuery();
        } catch (Exception e) {
            logger.error(sql);
        } finally {

        }
        return rs;
    }

    public static void closeResultSet(ResultSet rs) {
        try {
            if (rs != null) {
                rs.close();
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public static void closeStatement(PreparedStatement pstmt) {
        try {
            if (pstmt != null) {
                pstmt.close();
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public static void closeAll(String poolName, Connection con, PreparedStatement pstmt, ResultSet rs) {
        try {
            if (rs != null) {
                rs.close();
            }
            if (pstmt != null) {
                pstmt.close();
            }
            if (con != null) {
                con.close();
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
