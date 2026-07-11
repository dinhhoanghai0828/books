package books.utils;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.sql.*;
import java.util.Properties;
import javax.sql.DataSource;

public class DBUtils {
    private static final Logger logger = LoggerFactory.getLogger(DBUtils.class);
    private static final Properties properties = new Properties();
    private static final HikariDataSource dataSource;

    static {
        // Load application.properties
        try (InputStream input = DBUtils.class.getClassLoader().getResourceAsStream("application.properties")) {
            if (input == null) {
                throw new RuntimeException("File application.properties not found");
            }
            properties.load(input);
        } catch (IOException ex) {
            logger.error("Error loading properties file", ex);
            throw new RuntimeException("Failed to load properties", ex);
        }

        // Khoi tao HikariCP connection pool (dung chung cho toan ung dung)
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(properties.getProperty("spring.datasource.url"));
        config.setUsername(properties.getProperty("spring.datasource.username"));
        config.setPassword(properties.getProperty("spring.datasource.password"));
        config.setDriverClassName(properties.getProperty("spring.datasource.driver-class-name"));

        // Kich thuoc pool
        config.setMaximumPoolSize(
            getIntProperty("hikari.maximumPoolSize", 10));
        config.setMinimumIdle(
            getIntProperty("hikari.minimumIdle", 5));

        // Timeout (ms)
        config.setConnectionTimeout(
            getLongProperty("hikari.connectionTimeout", 30000L));
        config.setIdleTimeout(
            getLongProperty("hikari.idleTimeout", 600000L));
        config.setMaxLifetime(
            getLongProperty("hikari.maxLifetime", 1800000L));

        // Kiem tra connection con song truoc khi tra ra
        config.setConnectionTestQuery("SELECT 1");
        config.setPoolName("DBUtils-HikariPool");

        dataSource = new HikariDataSource(config);
        logger.info("HikariCP pool initialized: maxPoolSize={}",
            config.getMaximumPoolSize());
    }

    // Helper doc int tu properties voi gia tri mac dinh
    private static int getIntProperty(String key, int defaultValue) {
        String val = properties.getProperty(key);
        if (val != null) {
            try { return Integer.parseInt(val.trim()); } catch (NumberFormatException ignored) {}
        }
        return defaultValue;
    }

    // Helper doc long tu properties voi gia tri mac dinh
    private static long getLongProperty(String key, long defaultValue) {
        String val = properties.getProperty(key);
        if (val != null) {
            try { return Long.parseLong(val.trim()); } catch (NumberFormatException ignored) {}
        }
        return defaultValue;
    }

    /**
     * Lay connection tu HikariCP pool.
     * Luon phai close() connection sau khi dung de tra ve pool.
     */
    public static DataSource getDataSource() {
        return dataSource;
    }

    public static Connection getConnection(String poolName, boolean autoCommit, int isolationLevel) throws SQLException {
        Connection con = dataSource.getConnection();
        con.setAutoCommit(autoCommit);
        con.setTransactionIsolation(isolationLevel);
        return con;
    }

    public static PreparedStatement prepareStatement(Connection con, String sql) throws SQLException, Exception {
        PreparedStatement pstmt = con.prepareStatement(sql);
        if (pstmt == null) {
            throw new Exception("Couldn't prepare statement");
        }
        return pstmt;
    }

    public static PreparedStatement prepareStatement(Connection con, String sql,
            int resultSetType, int resultSetConcurrency) throws SQLException, Exception {
        PreparedStatement pstmt = con.prepareStatement(sql, resultSetType, resultSetConcurrency);
        if (pstmt == null) {
            throw new Exception("Couldn't prepare statement");
        }
        return pstmt;
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
        }
        return rs;
    }

    public static ResultSet executeQuery(PreparedStatement pStmt, String sql) throws Exception {
        ResultSet rs = null;
        try {
            rs = pStmt.executeQuery();
        } catch (Exception e) {
            logger.error(sql, e);
        }
        return rs;
    }

    public static void closeResultSet(ResultSet rs) {
        try {
            if (rs != null) rs.close();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public static void closeStatement(PreparedStatement pstmt) {
        try {
            if (pstmt != null) pstmt.close();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    /**
     * Dong rs, pstmt, con theo thu tu nguoc lai.
     * Voi HikariCP, con.close() tra connection ve pool (khong dong that).
     */
    public static void closeAll(String poolName, Connection con, PreparedStatement pstmt, ResultSet rs) {
        try {
            if (rs    != null) rs.close();
            if (pstmt != null) pstmt.close();
            if (con   != null) con.close(); // tra ve pool, khong dong that
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
