package books.component;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import books.utils.DBUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class RunSQLComponent {

    // Inject DataSource cua Spring (HikariCP) - su dung duy mot pool cho toan ung dung
    @Autowired(required = false)
    private DataSource dataSource;

    String path = "D:\\20_PROJECT\\books\\3_DATABASE\\";

    /** Pool nhe (1-2 connection) chi dung khi chay main() standalone, tranh khoi tao DBUtils pool lon. */
    private static volatile DataSource standaloneDataSource;

    private DataSource resolveDataSource() {
        if (dataSource != null) {
            return dataSource;
        }
        // Fallback cho standalone main() khi Spring context khong active
        if (standaloneDataSource == null) {
            synchronized (RunSQLComponent.class) {
                if (standaloneDataSource == null) {
                    standaloneDataSource = createStandaloneDataSource();
                }
            }
        }
        return standaloneDataSource;
    }

    private static DataSource createStandaloneDataSource() {
        Properties props = new Properties();
        try (InputStream in = RunSQLComponent.class.getClassLoader()
                .getResourceAsStream("application.properties")) {
            if (in == null) {
                throw new RuntimeException("File application.properties not found");
            }
            props.load(in);
        } catch (IOException e) {
            throw new RuntimeException("Failed to load application.properties", e);
        }

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(props.getProperty("spring.datasource.url"));
        config.setUsername(props.getProperty("spring.datasource.username"));
        config.setPassword(props.getProperty("spring.datasource.password"));
        config.setDriverClassName(props.getProperty("spring.datasource.driver-class-name"));
        config.setMaximumPoolSize(2);
        config.setMinimumIdle(1);
        config.setPoolName("RunSQL-Standalone");
        return new HikariDataSource(config);
    }

    @Bean
    public JdbcTemplate jdbcTemplate() {
        return new JdbcTemplate(resolveDataSource());
    }

    //    @PostConstruct
    public void insertContent() throws SQLException, IOException {
        List<String> scripts = new ArrayList<>();
        // Thêm các file cấu trúc cơ bản trước
        scripts.add(path + "1_SQL_CREATE_TABLES.sql");
        scripts.add(path + "2_SQL_CREATE_DATA.sql");
        scripts.add(path + "3_SQL_ENG_MISSING_WORDS.sql");
        scripts.add(path + "3_SQL_ENG_WORDS.sql");
        scripts.add(path + "MATH_CATEGORIES.sql");

        // Thêm các file APP_*.sql theo format APP_<ROOT_PARENT>_<CATEGORY>.sql
        scripts.add(path + "APP_BOOK_4000_ESSENTIAL_ENGLISH_WORDS.sql");
        scripts.add(path + "APP_NEWS_NEWS.sql");
        scripts.add(path + "APP_PRESENTATION_TRO_CHUYEN_HANG_NGAY.sql");
        scripts.add(path + "APP_TRUYEN_TRUYEN_CO_TICH.sql");
        scripts.add(path + "APP_TRUYEN_TRUYEN_CUOC_SONG.sql");
        scripts.add(path + "APP_TRUYEN_TRUYEN_KINH_DI.sql");
        scripts.add(path + "APP_TRUYEN_TRUYEN_TRUYEN_CAM_HUNG.sql");
        scripts.add(path + "APP_TRUYEN_TRUYEN_TUOI_TEEN.sql");
        scripts.add(path + "APP_WEB_ESL_FAST_BEGINNER.sql");
        scripts.add(path + "APP_WEB_ESL_FAST_ELEMENTARY.sql");
        scripts.add(path + "APP_WEB_LITTLE_CAT_LEVEL_1.sql");


        // Thêm các file MATH cố định
        scripts.add(path + "APP_QUESTIONS.sql");
        scripts.add(path + "APP_QUESTIONS_ANSWERS.sql");
        scripts.add(path + "MATH_QUESTIONS.sql");
        scripts.add(path + "MATH_ANSWERS.sql");

        if (scripts.isEmpty()) {
            System.out.println("insertContentFromExport: no APP_*.sql files found from DB.");
        };

        //  Tong hop ra file Z_SQL_RESULTS_SENTENCE.sql
        String outputFilePath = path + "SUMMARY.sql";
        try (OutputStreamWriter outputWriter = new OutputStreamWriter(new FileOutputStream(outputFilePath), StandardCharsets.UTF_8)) {
            for (String filePath : scripts) {
                try (InputStreamReader fileReader = new InputStreamReader(new FileInputStream(filePath), StandardCharsets.UTF_8);
                     BufferedReader reader = new BufferedReader(fileReader)) {
                    String line;

                    while ((line = reader.readLine()) != null) {
                        outputWriter.write(line);
                        outputWriter.write("\n");
                    }
                } catch (IOException e) {
                    System.err.println("Error reading file: " + filePath + " - " + e.getMessage());
                }

            }
        } catch (IOException e) {
            System.err.println("Error writing to output file: " + e.getMessage());
        }
        System.out.println("File reading and writing completed successfully.");
        //  Insert du lieu vao db
        for (String scriptPath : scripts) {
            Connection connection = resolveDataSource().getConnection();
            try {
                Resource resource = new FileSystemResource(scriptPath);
                ScriptUtils.executeSqlScript(connection, resource);
            } catch (Exception e) {
                System.out.println(scriptPath);
                throw e;
            } finally {
                connection.close();
            }
        }
    }

    public void extractAndInsertEngWords() {
        String thisMethod = "extractAndInsertEngWords";
        String selectSql = "SELECT ENG FROM CONTENTS";
        String insertSql = "INSERT IGNORE INTO ENG_WORDS (WORD) VALUES (?)";

        Connection connection = null;
        PreparedStatement selectStmt = null;
        ResultSet resultSet = null;

        // Sử dụng kết nối JDBC trực tiếp với pagination
        try {
            connection = resolveDataSource().getConnection();
            selectStmt = connection.prepareStatement(selectSql, ResultSet.TYPE_FORWARD_ONLY, ResultSet.CONCUR_READ_ONLY);
            selectStmt.setFetchSize(1000); // Fetch size để giảm memory usage
            resultSet = selectStmt.executeQuery();

            Set<String> allWords = new HashSet<>();
            int batchSize = 1000;
            int wordCount = 0;

            // Duyệt qua tất cả các câu trong cột ENG
            while (resultSet.next()) {
                String sentence = resultSet.getString("ENG");
                if (sentence != null && !sentence.trim().isEmpty()) {
                    Set<String> validWords = getValidWords(sentence);
                    allWords.addAll(validWords);  // Thêm các từ hợp lệ vào set
                    wordCount += validWords.size();
                    
                    // Batch insert định kỳ để tránh memory overflow
                    if (wordCount >= batchSize) {
                        insertWordsBatch(connection, insertSql, new ArrayList<>(allWords));
                        allWords.clear();
                        wordCount = 0;
                    }
                }
            }

            // Insert các từ còn lại
            if (!allWords.isEmpty()) {
                insertWordsBatch(connection, insertSql, new ArrayList<>(allWords));
            }

            System.out.println("Words inserted into ENG_WORDS table in alphabetical order.");
        } catch (SQLException e) {
            System.err.println("Error in extractAndInsertWords: " + e.getMessage());
            e.printStackTrace();
        } finally {
            DBUtils.closeAll(thisMethod, connection, selectStmt, resultSet);
        }
    }

    private void insertWordsBatch(Connection connection, String insertSql, List<String> words) throws SQLException {
        if (words.isEmpty()) return;
        
        Collections.sort(words);
        try (PreparedStatement insertStmt = connection.prepareStatement(insertSql)) {
            for (String word : words) {
                insertStmt.setString(1, word);
                insertStmt.addBatch();
            }
            insertStmt.executeBatch();
        }
    }

    public void extractAndInsertViWords() {
        String thisMethod = "extractAndInsertViWords";
        String selectSql = "SELECT VI FROM CONTENTS";  // Lấy cột VI
        String insertSql = "INSERT IGNORE INTO VI_WORDS (WORD) VALUES (?)";  // Chèn vào VI_WORDS

        Connection connection = null;
        PreparedStatement selectStmt = null;
        ResultSet resultSet = null;

        // Sử dụng kết nối JDBC trực tiếp với pagination
        try {
            connection = resolveDataSource().getConnection();
            selectStmt = connection.prepareStatement(selectSql, ResultSet.TYPE_FORWARD_ONLY, ResultSet.CONCUR_READ_ONLY);
            selectStmt.setFetchSize(1000); // Fetch size để giảm memory usage
            resultSet = selectStmt.executeQuery();

            Set<String> allWords = new HashSet<>();
            int batchSize = 1000;
            int wordCount = 0;

            // Duyệt qua tất cả các câu trong cột VI
            while (resultSet.next()) {
                String sentence = resultSet.getString("VI");
                if (sentence != null && !sentence.trim().isEmpty()) {
                    Set<String> validWords = getValidViWords(sentence);
                    allWords.addAll(validWords);  // Thêm các từ hợp lệ vào set
                    wordCount += validWords.size();
                    
                    // Batch insert định kỳ để tránh memory overflow
                    if (wordCount >= batchSize) {
                        insertWordsBatch(connection, insertSql, new ArrayList<>(allWords));
                        allWords.clear();
                        wordCount = 0;
                    }
                }
            }

            // Insert các từ còn lại
            if (!allWords.isEmpty()) {
                insertWordsBatch(connection, insertSql, new ArrayList<>(allWords));
            }

            System.out.println("Words inserted into VI_WORDS table in alphabetical order.");
        } catch (SQLException e) {
            System.err.println("Error in extractAndInsertViWords: " + e.getMessage());
            e.printStackTrace();
        } finally {
            DBUtils.closeAll(thisMethod, connection, selectStmt, resultSet);
        }
    }

    // Helper method to filter valid words (excluding null, punctuation, single-letter words, and numeric-only words)
    private Set<String> getValidWords(String sentence) {
        Set<String> validWords = new HashSet<>();

        // Regular expression to extract only letters and numbers
        Pattern pattern = Pattern.compile("[a-zA-Z0-9]+");
        Matcher matcher = pattern.matcher(sentence);

        while (matcher.find()) {
            String word = matcher.group().toLowerCase();

            // Kiểm tra từ có ít nhất 2 ký tự và không phải là số
            if (word.length() > 1 && !word.matches("\\d+")) {
                validWords.add(word); // Thêm từ hợp lệ vào set (tự động loại bỏ trùng lặp)
            }
        }

        return validWords;
    }

    private static Set<String> getValidViWords(String sentence) {
        Set<String> validWords = new HashSet<>();

        // Kiểm tra nếu câu là null hoặc rỗng
        if (sentence == null || sentence.isEmpty()) {
            return validWords;
        }

        // Biểu thức chính quy để lấy các từ (bao gồm cả dấu tiếng Việt và các ký tự Latin)
        Pattern pattern = Pattern.compile("[a-zA-Zàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]+");
        Matcher matcher = pattern.matcher(sentence);

        // Duyệt qua các từ tìm được và kiểm tra tính hợp lệ
        while (matcher.find()) {
            String word = matcher.group(); // Không chuyển về chữ thường
            if (word.length() > 1) {
                validWords.add(word); // Thêm từ hợp lệ vào set
            }
        }

        return validWords;
    }

    public void insertWord() throws SQLException {
        List<String> scripts = new ArrayList<>();
        scripts.add(path + "3_SQL_ENG_WORDS.sql");
        for (String scriptPath : scripts) {
            Connection connection = resolveDataSource().getConnection();
            try {
                Resource resource = new FileSystemResource(scriptPath);
                ScriptUtils.executeSqlScript(connection, resource);
            } catch (Exception e) {
                throw e;
            } finally {
                connection.close();
            }
        }
    }

    public void insertMissingWord() throws SQLException {
        List<String> scripts = new ArrayList<>();
        scripts.add(path + "3_SQL_ENG_MISSING_WORDS.sql");
        for (String scriptPath : scripts) {
            Connection connection = resolveDataSource().getConnection();
            try {
                Resource resource = new FileSystemResource(scriptPath);
                ScriptUtils.executeSqlScript(connection, resource);
            } catch (Exception e) {
                throw e;
            } finally {
                connection.close();
            }
        }
    }

    public void generalWord() throws SQLException {
        //  Tao cau query
        StringBuffer sqls = new StringBuffer();
        String table = "DROP TABLE IF EXISTS `WORDS`;\n" +
                "CREATE TABLE `WORDS`  (\n" +
                "  `ID` INT AUTO_INCREMENT PRIMARY KEY,\n" +
                "  `ENG` varchar(200) NOT NULL, \n" +
                "  `VI` varchar(200)  NOT NULL, \n" +
                "  `CREATED_AT` datetime(6) NULL DEFAULT NULL,\n" +
                "  `UPDATED_AT` datetime(6) NULL DEFAULT NULL,\n" +
                "  INDEX `IDX_WORD_ENG`(`ENG`) USING BTREE,\n" +
                "  INDEX `IDX_WORD_VI`(`VI`) USING BTREE\n" +
                ");" +
                "\n" +
                "TRUNCATE TABLE `WORDS`;";
        String lastQuery = "INSERT INTO `WORDS` (`ENG`,`VI`) VALUES " + "\n";

        Connection connection = null;
        PreparedStatement selectStmt = null;
        ResultSet resultSet = null;

        try {
            connection = resolveDataSource().getConnection();
            selectStmt = connection.prepareStatement("SELECT * FROM WORDS ORDER BY ENG ASC, VI ASC;", ResultSet.TYPE_FORWARD_ONLY, ResultSet.CONCUR_READ_ONLY);
            selectStmt.setFetchSize(1000); // Fetch size để giảm memory usage
            resultSet = selectStmt.executeQuery();

            int i = 0;
            int totalRows = 0;

            // First pass: count total rows
            while (resultSet.next()) {
                totalRows++;
            }
            resultSet.close();
            selectStmt.close();

            // Second pass: process data
            selectStmt = connection.prepareStatement("SELECT * FROM WORDS ORDER BY ENG ASC, VI ASC;", ResultSet.TYPE_FORWARD_ONLY, ResultSet.CONCUR_READ_ONLY);
            selectStmt.setFetchSize(1000);
            resultSet = selectStmt.executeQuery();

            while (resultSet.next()) {
                try {
                    String eng = resultSet.getString("eng");
                    eng = eng.trim();
                    if (eng.contains("\'")) {
                        eng = eng.replace("\'", "\\'");
                    }
                    String vi = resultSet.getString("vi");
                    vi = vi.trim();

                    if (i == totalRows - 1) {
                        String sql = "\t" + "('" + eng + "','" + vi + "');" + "\n";
                        sqls.append(sql);
                    } else {
                        String sql = "\t" + "('" + eng + "','" + vi + "')," + "\n";
                        sqls.append(sql);
                    }
                } catch (Exception e) {
                    System.out.println(resultSet.getString("eng"));
                    System.out.println(resultSet.getString("vi"));
                    throw e;
                }
                i++;
            }

            lastQuery = table + "\n\n\n" + lastQuery + sqls;
            System.out.println("Generated SQL with " + i + " words");

            try (OutputStreamWriter writer = new OutputStreamWriter(new FileOutputStream(path + "3_SQL_ENG_WORDS.sql"), StandardCharsets.UTF_8)) {
                writer.write(lastQuery);
                writer.flush();
            } catch (IOException e) {
                e.printStackTrace();
            }
        } finally {
            DBUtils.closeAll("generalWord", connection, selectStmt, resultSet);
        }
    }

    public void generalVolume() throws SQLException, IOException {
        Connection connection = null;
        PreparedStatement selectStmt = null;
        ResultSet resultSet = null;

        try {
            connection = resolveDataSource().getConnection();
            selectStmt = connection.prepareStatement("SELECT * FROM VOLUMES ORDER BY BOOK_SLUG ASC, NUMBER ASC;", ResultSet.TYPE_FORWARD_ONLY, ResultSet.CONCUR_READ_ONLY);
            selectStmt.setFetchSize(1000);
            resultSet = selectStmt.executeQuery();

            // Read existing file up to -- DU LIEU BANG VOLUMES
            String filePath = path + "2_SQL_CREATE_DATA.sql";
            StringBuilder headerContent = new StringBuilder();
            boolean foundVolumeSection = false;

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream(filePath), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.contains("DU LIEU BANG VOLUMES")) {
                        foundVolumeSection = true;
                        break;
                    }
                    headerContent.append(line).append("\n");
                }
            }

            if (!foundVolumeSection) {
                throw new IOException("Could not find '-- DU LIEU BANG VOLUMES' section in file");
            }

            // Generate new VOLUMES INSERT statements
            StringBuilder volumeSql = new StringBuilder();
            volumeSql.append("-- DU LIEU BANG VOLUMES\n");
            volumeSql.append("TRUNCATE TABLE VOLUMES;\n");

            int i = 0;
            int totalRows = 0;

            // First pass: count total rows
            while (resultSet.next()) {
                totalRows++;
            }
            resultSet.close();
            selectStmt.close();

            // Second pass: process data
            selectStmt = connection.prepareStatement("SELECT * FROM VOLUMES ORDER BY BOOK_SLUG ASC, NUMBER ASC;", ResultSet.TYPE_FORWARD_ONLY, ResultSet.CONCUR_READ_ONLY);
            selectStmt.setFetchSize(1000);
            resultSet = selectStmt.executeQuery();

            String currentBookSlug = null;
            List<String> currentGroupValues = new ArrayList<>();

            while (resultSet.next()) {
                try {
                    String slug = resultSet.getString("SLUG");
                    String eng = resultSet.getString("ENG");
                    eng = eng.trim();
                    if (eng.contains("\'")) {
                        eng = eng.replace("\'", "\\'");
                    }
                    String vi = resultSet.getString("VI");
                    vi = vi.trim();
                    if (vi.contains("\'")) {
                        vi = vi.replace("\'", "\\'");
                    }
                    String audio = resultSet.getString("AUDIO");
                    if (audio != null) {
                        audio = audio.trim();
                        if (audio.contains("\'")) {
                            audio = audio.replace("\'", "\\'");
                        }
                    }
                    String img = resultSet.getString("IMG");
                    if (img != null) {
                        img = img.trim();
                        if (img.contains("\'")) {
                            img = img.replace("\'", "\\'");
                        }
                    }
                    String startTime = resultSet.getString("START_TIME");
                    String endTime = resultSet.getString("END_TIME");
                    String bookSlug = resultSet.getString("BOOK_SLUG");
                    if (bookSlug != null) {
                        bookSlug = bookSlug.trim();
                        if (bookSlug.contains("\'")) {
                            bookSlug = bookSlug.replace("\'", "\\'");
                        }
                    }
                    int isLanguageApproved = resultSet.getInt("IS_LANGUAGE_APPROVED");
                    int isReviewCompleted = resultSet.getInt("IS_REVIEW_COMPLETED");
                    int isRead = resultSet.getInt("IS_READ");
                    int number = resultSet.getInt("NUMBER");

                    // Convert null to SQL NULL (without quotes)
                    String audioSql = (audio == null) ? "NULL" : "'" + audio + "'";
                    String imgSql = (img == null) ? "NULL" : "'" + img + "'";
                    String startTimeSql = (startTime == null) ? "NULL" : "'" + startTime + "'";
                    String endTimeSql = (endTime == null) ? "NULL" : "'" + endTime + "'";

                    // Check if book_slug changed
                    if (currentBookSlug == null || !currentBookSlug.equals(bookSlug)) {
                        // Flush previous group if exists
                        if (currentBookSlug != null && !currentGroupValues.isEmpty()) {
                            volumeSql.append("INSERT INTO VOLUMES(UUID,SLUG,ENG,VI,AUDIO,IMG,START_TIME,END_TIME,BOOK_SLUG,IS_LANGUAGE_APPROVED,IS_REVIEW_COMPLETED,IS_READ,NUMBER) VALUES\n");
                            for (int j = 0; j < currentGroupValues.size(); j++) {
                                String value = currentGroupValues.get(j);
                                if (j == currentGroupValues.size() - 1) {
                                    volumeSql.append(value).append(";\n\n");
                                } else {
                                    volumeSql.append(value).append(",\n");
                                }
                            }
                        }
                        // Start new group
                        currentBookSlug = bookSlug;
                        currentGroupValues.clear();
                    }

                    String value = "\t(UUID(),'" + slug + "','" + eng + "','" + vi + "'," + audioSql + "," + imgSql + "," + startTimeSql + "," + endTimeSql + ",'" + bookSlug + "'," + isLanguageApproved + "," + isReviewCompleted + "," + isRead + "," + number + ")";
                    currentGroupValues.add(value);
                } catch (Exception e) {
                    System.out.println(resultSet.getString("SLUG"));
                    throw e;
                }
                i++;
            }

            // Flush the last group
            if (!currentGroupValues.isEmpty()) {
                volumeSql.append("INSERT INTO VOLUMES(UUID,SLUG,ENG,VI,AUDIO,IMG,START_TIME,END_TIME,BOOK_SLUG,IS_LANGUAGE_APPROVED,IS_REVIEW_COMPLETED,IS_READ,NUMBER) VALUES\n");
                for (int j = 0; j < currentGroupValues.size(); j++) {
                    String value = currentGroupValues.get(j);
                    if (j == currentGroupValues.size() - 1) {
                        volumeSql.append(value).append(";\n\n");
                    } else {
                        volumeSql.append(value).append(",\n");
                    }
                }
            }

            // Write back to file
            String fullContent = headerContent.toString() + volumeSql.toString();
            try (OutputStreamWriter writer = new OutputStreamWriter(new FileOutputStream(filePath), StandardCharsets.UTF_8)) {
                writer.write(fullContent);
                writer.flush();
            }
            System.out.println("Generated VOLUMES SQL with " + i + " volumes");

        } finally {
            DBUtils.closeAll("generalVolume", connection, selectStmt, resultSet);
        }
    }

    public void createWordTableTemp() throws SQLException {
        List<String> scripts = new ArrayList<>();
        //	Lay toan bo gia tri bang WORD va insert vao bang WORDS2
        //	Lay toan bo gia tri bang WORD2 va insert lai vao bang WORDS
        scripts.add(path + "4_SQL_CREATE_WORD2.sql");
        for (String scriptPath : scripts) {
            Connection connection = resolveDataSource().getConnection();
            try {
                Resource resource = new FileSystemResource(scriptPath);
                ScriptUtils.executeSqlScript(connection, resource);
            } catch (Exception e) {
                throw e;
            } finally {
                connection.close();
            }
        }
    }

    /**
     * Wrapper của createWordTableTemp + generalWord, trả về thống kê số lượng từ trước/sau.
     * - BEFORE: đếm số từ trong file 3_SQL_ENG_WORDS.sql hiện tại (trước khi chạy)
     * - AFTER:  đếm số từ trong DB sau khi chạy xong
     * Map keys: BEFORE, AFTER, ADDED
     */
    public Map<String, Integer> wordGeneralWithStats() throws SQLException {

        // Đếm BEFORE: đọc file 3_SQL_ENG_WORDS.sql, đếm số dòng là data row (bắt đầu bằng tab + dấu ngoặc đơn)
        int before = 0;
        File wordsFile = new File(path + "3_SQL_ENG_WORDS.sql");
        if (wordsFile.exists()) {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream(wordsFile), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    String trimmed = line.trim();
                    if (trimmed.startsWith("('")) {
                        before++;
                    }
                }
            } catch (IOException e) {
                System.err.println("wordGeneralWithStats: cannot read 3_SQL_ENG_WORDS.sql - " + e.getMessage());
            }
        }

        // Chạy nghiệp vụ
        createWordTableTemp();
        try {
            //  Tao file Word
            generalWord();
        } catch (Exception e) {
            throw new SQLException("generalWord failed: " + e.getMessage(), e);
        }

        // Đếm AFTER: đếm trong DB sau khi generalWord() ghi xong
        JdbcTemplate jdbc = jdbcTemplate();
        Integer after = jdbc.queryForObject("SELECT COUNT(*) FROM WORDS", Integer.class);
        if (after == null) after = 0;

        Map<String, Integer> stats = new LinkedHashMap<>();
        stats.put("BEFORE", before);
        stats.put("AFTER",  after);
        stats.put("ADDED",  after - before);
        System.out.println("wordGeneralWithStats: before=" + before + " after=" + after + " added=" + (after - before));
        return stats;
    }

    /**
     * Đọc toàn bộ CONTENTS từ DB, nhóm theo BOOK_SLUG,
     * và ghi mỗi nhóm ra file APP_<BOOK_SLUG>.sql trong thư mục path.
     */
    public List<String> generalContents() throws SQLException, IOException {
        List<String> generatedFiles = new ArrayList<>();

        String sqlGetCategories = "SELECT DISTINCT B.CATEGORY_SLUG AS CATEGORY_SLUG " +
                "FROM BOOKS B " +
                "INNER JOIN VOLUMES V ON V.BOOK_SLUG = B.SLUG " +
                "INNER JOIN CONTENTS C ON C.VOLUME_SLUG = V.SLUG " +
                "ORDER BY B.CATEGORY_SLUG";

        String sqlGetContents =
                "SELECT C.ENG, C.VI, C.START_TIME, C.END_TIME, C.VOLUME_SLUG, " +
                "V.SLUG AS V_SLUG, V.ENG AS V_ENG, V.VI AS V_VI, V.AUDIO AS V_AUDIO, " +
                "V.START_TIME AS V_START, V.END_TIME AS V_END, V.BOOK_SLUG AS V_BOOK_SLUG, " +
                "V.IS_LANGUAGE_APPROVED AS V_IS_LANGUAGE_APPROVED, V.IS_REVIEW_COMPLETED AS V_IS_REVIEW_COMPLETED, V.NUMBER AS V_NUMBER, V.ID AS V_ID " +
                "FROM CONTENTS C " +
                "INNER JOIN VOLUMES V ON C.VOLUME_SLUG = V.SLUG " +
                "INNER JOIN BOOKS B ON V.BOOK_SLUG = B.SLUG " +
                "WHERE B.CATEGORY_SLUG = ? " +
                "ORDER BY V.ID, C.ID";

        String sqlGetRootParent = "WITH RECURSIVE CategoryTree AS (" +
                "  SELECT SLUG, PARENT_SLUG FROM CATEGORIES WHERE SLUG = ? " +
                "  UNION ALL " +
                "  SELECT C.SLUG, C.PARENT_SLUG FROM CATEGORIES C " +
                "  INNER JOIN CategoryTree CT ON C.SLUG = CT.PARENT_SLUG " +
                ") " +
                "SELECT SLUG FROM CategoryTree WHERE PARENT_SLUG IS NULL OR PARENT_SLUG = '' LIMIT 1";

        Connection connection = null;
        PreparedStatement pstmtCategories = null;
        ResultSet rsCategories = null;

        try {
            connection = resolveDataSource().getConnection();
            pstmtCategories = connection.prepareStatement(sqlGetCategories);
            rsCategories = pstmtCategories.executeQuery();

            List<String> categorySlugs = new ArrayList<>();
            while (rsCategories.next()) {
                categorySlugs.add(rsCategories.getString("CATEGORY_SLUG"));
            }
            DBUtils.closeAll("generalContents-categories", null, pstmtCategories, rsCategories);

            final int ROWS_PER_BATCH    = 1000; // tách INSERT nếu 1 tập quá dài
            final int VOLUMES_PER_BATCH = 5;    // gom tối đa 5 tập vào 1 INSERT
            final String SEPARATOR = "\n/*=====================================================================================================================================================================================================================================================*/\n\n";

            for (String categorySlug : categorySlugs) {
                // Find root parent of this category
                String rootParentSlug = categorySlug;
                PreparedStatement pstmtRootParent = null;
                ResultSet rsRootParent = null;
                try {
                    pstmtRootParent = connection.prepareStatement(sqlGetRootParent);
                    pstmtRootParent.setString(1, categorySlug);
                    rsRootParent = pstmtRootParent.executeQuery();
                    if (rsRootParent.next()) {
                        rootParentSlug = rsRootParent.getString("SLUG");
                    }
                } finally {
                    DBUtils.closeAll("generalContents-rootparent-" + categorySlug, null, pstmtRootParent, rsRootParent);
                }

                String fileNameKey = rootParentSlug.toUpperCase().replace("-", "_") + "_" + categorySlug.toUpperCase().replace("-", "_");
                String outputFilePath = path + "APP_" + fileNameKey + ".sql";

                PreparedStatement pstmtContents = null;
                ResultSet rsContents = null;
                try {
                    pstmtContents = connection.prepareStatement(sqlGetContents);
                    pstmtContents.setString(1, categorySlug);
                    rsContents = pstmtContents.executeQuery();

                    StringBuilder sb        = new StringBuilder();
                    boolean hasRows         = false;
                    int rowCountInBatch     = 0;  // số content-row trong INSERT hiện tại
                    int volumeCountInBatch  = 0;  // số tập đã gom vào INSERT hiện tại
                    boolean insertOpen      = false; // có INSERT đang mở không
                    boolean firstRowInInsert = true; // row đầu tiên trong INSERT hiện tại
                    String prevVolumeSlug   = null;

                    while (rsContents.next()) {
                        hasRows = true;
                        String eng        = rsContents.getString("ENG");
                        String vi         = rsContents.getString("VI");
                        String startTime  = rsContents.getString("START_TIME");
                        String endTime    = rsContents.getString("END_TIME");
                        String volumeSlug = rsContents.getString("VOLUME_SLUG");

                        String vSlug     = rsContents.getString("V_SLUG");
                        String vEng      = rsContents.getString("V_ENG");
                        String vVi       = rsContents.getString("V_VI");
                        String vAudio    = rsContents.getString("V_AUDIO");
                        String vStart    = rsContents.getString("V_START");
                        String vEnd      = rsContents.getString("V_END");
                        String vBookSlug = rsContents.getString("V_BOOK_SLUG");
                        int    vIsLanguageApproved = rsContents.getInt("V_IS_LANGUAGE_APPROVED");
                        int    vIsReviewCompleted = rsContents.getInt("V_IS_REVIEW_COMPLETED");
                        int    vNumber   = rsContents.getInt("V_NUMBER");

                        if (eng   != null) eng   = eng.replace("'", "\\'");
                        if (vi    != null) vi    = vi.replace("'", "\\'");
                        if (vEng  != null) vEng  = vEng.replace("'", "\\'");
                        if (vVi   != null) vVi   = vVi.replace("'", "\\'");

                        boolean isNewVolume = !volumeSlug.equals(prevVolumeSlug);

                        if (isNewVolume) {
                            if (insertOpen) {
                                // Đủ 5 tập → đóng INSERT hiện tại + separator, mở INSERT mới
                                if (volumeCountInBatch >= VOLUMES_PER_BATCH) {
                                    sb.append(";\n");
                                    sb.append(SEPARATOR);
                                    insertOpen       = false;
                                    firstRowInInsert = true;
                                    rowCountInBatch  = 0;
                                    volumeCountInBatch = 0;
                                }
                                // Ngược lại tiếp tục INSERT đang mở (thêm tập mới vào trong)
                            }

                            // Mở INSERT mới nếu chưa có
                            if (!insertOpen) {
                                sb.append("INSERT INTO CONTENTS (ENG,VI,START_TIME,END_TIME,VOLUME_SLUG) VALUES\n");
                                insertOpen       = true;
                                firstRowInInsert = true;
                            }

                            // Comment volume nằm trong VALUES, trước row đầu tiên của tập
                            String audioVal = (vAudio != null) ? "'" + vAudio + "'" : "NULL";
                            if (!firstRowInInsert) {
                                sb.append(",\n\n");
                            }

                            sb.append("\t/* (UUID(),'").append(vSlug).append("','")
                              .append(vEng).append("','").append(vVi).append("',")
                              .append(audioVal).append(",NULL,'")
                              .append(vStart).append("','").append(vEnd).append("','")
                              .append(vBookSlug).append("',").append(vIsLanguageApproved).append(",")
                              .append(vIsReviewCompleted).append(",")
                              .append(vNumber).append(") */");

                            firstRowInInsert = false;
                            volumeCountInBatch++;
                            prevVolumeSlug = volumeSlug;
                        }

                        // Append row content
                        // Chỉ thêm dấu , nếu KHÔNG phải row đầu tiên sau comment
                        if (!isNewVolume) {
                            sb.append(",\n");
                        } else {
                            sb.append("\n");
                        }
                        sb.append("\t('").append(eng).append("','").append(vi).append("','")
                          .append(startTime).append("','").append(endTime).append("','")
                          .append(volumeSlug).append("')");

                        rowCountInBatch++;

                        // Tập quá dài (>1000 dòng) → tách batch giữa chừng
                        if (rowCountInBatch % ROWS_PER_BATCH == 0) {
                            sb.append(";\n");
                            sb.append(SEPARATOR);
                            insertOpen         = false;
                            firstRowInInsert   = true;
                            rowCountInBatch    = 0;
                            volumeCountInBatch = 0;
                            prevVolumeSlug     = null; // buộc in lại comment volume ở batch tiếp theo
                        }
                    }

                    // Đóng INSERT cuối
                    if (hasRows && insertOpen) {
                        sb.append(";\n");
                    }

                    if (hasRows) {
                        try (OutputStreamWriter writer = new OutputStreamWriter(new FileOutputStream(outputFilePath), StandardCharsets.UTF_8)) {
                            writer.write(sb.toString());
                            writer.flush();
                        }
                        generatedFiles.add(outputFilePath);
                        System.out.println("Generated: " + outputFilePath);
                    }
                } finally {
                    DBUtils.closeAll("generalContents-contents-" + categorySlug, null, pstmtContents, rsContents);
                }
            }
        } finally {
            DBUtils.closeAll("generalContents-final", connection, null, null);
        }

        System.out.println("generalContents completed. Files generated: " + generatedFiles.size());
        return generatedFiles;
    }

    /**
     * Tương đương RunSQLContentService nhưng thay scripts hardcode bằng
     * danh sách file APP_<BOOK_SLUG>.sql được build động từ DB.
     * Thực hiện: TRUNCATE CONTENTS → execute từng APP_*.sql → ghi SUMMARY.sql
     */
    public List<String> insertContentFromExport() throws SQLException, IOException {

        // Lấy danh sách category slugs có contents trong DB
        String sqlGetCategories = "SELECT DISTINCT B.CATEGORY_SLUG AS CATEGORY_SLUG " +
                "FROM BOOKS B " +
                "INNER JOIN VOLUMES V ON V.BOOK_SLUG = B.SLUG " +
                "INNER JOIN CONTENTS C ON C.VOLUME_SLUG = V.SLUG " +
                "ORDER BY B.CATEGORY_SLUG";

        String sqlGetRootParent = "WITH RECURSIVE CategoryTree AS (" +
                "  SELECT SLUG, PARENT_SLUG FROM CATEGORIES WHERE SLUG = ? " +
                "  UNION ALL " +
                "  SELECT C.SLUG, C.PARENT_SLUG FROM CATEGORIES C " +
                "  INNER JOIN CategoryTree CT ON C.SLUG = CT.PARENT_SLUG " +
                ") " +
                "SELECT SLUG FROM CategoryTree WHERE PARENT_SLUG IS NULL OR PARENT_SLUG = '' LIMIT 1";

        List<String> scripts = new ArrayList<>();
        Connection conQuery = resolveDataSource().getConnection();
        try {
            PreparedStatement pstmt = conQuery.prepareStatement(sqlGetCategories);
            ResultSet rs = pstmt.executeQuery();
            while (rs.next()) {
                String categorySlug = rs.getString("CATEGORY_SLUG");

                // Find root parent of this category
                String rootParentSlug = categorySlug;
                PreparedStatement pstmtRootParent = null;
                ResultSet rsRootParent = null;
                try {
                    pstmtRootParent = conQuery.prepareStatement(sqlGetRootParent);
                    pstmtRootParent.setString(1, categorySlug);
                    rsRootParent = pstmtRootParent.executeQuery();
                    if (rsRootParent.next()) {
                        rootParentSlug = rsRootParent.getString("SLUG");
                    }
                } finally {
                    DBUtils.closeAll("insertContentFromExport-rootparent-" + categorySlug, null, pstmtRootParent, rsRootParent);
                }

                String fileNameKey = rootParentSlug.toUpperCase().replace("-", "_") + "_" + categorySlug.toUpperCase().replace("-", "_");
                String filePath = path + "APP_" + fileNameKey + ".sql";
                scripts.add(filePath);
            }
            DBUtils.closeAll("insertContentFromExport-query", null, pstmt, rs);
        } finally {
            DBUtils.closeAll("insertContentFromExport-query-con", conQuery, null, null);
        }

        if (scripts.isEmpty()) {
            System.out.println("insertContentFromExport: no APP_*.sql files found from DB.");
            return scripts;
        }

        // Ghi SUMMARY.sql từ các file APP_*.sql
        String summaryPath = path + "SUMMARY.sql";
        try (OutputStreamWriter outputWriter = new OutputStreamWriter(new FileOutputStream(summaryPath), StandardCharsets.UTF_8)) {
            for (String filePath : scripts) {
                File f = new File(filePath);
                if (!f.exists()) {
                    System.err.println("File not found, skipped: " + filePath);
                    continue;
                }
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream(f), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        outputWriter.write(line);
                        outputWriter.write("\n");
                    }
                } catch (IOException e) {
                    System.err.println("Error reading file: " + filePath + " - " + e.getMessage());
                }
            }
        }
        System.out.println("SUMMARY.sql written with " + scripts.size() + " APP files.");

        // TRUNCATE CONTENTS rồi execute từng file
        Connection conTruncate = resolveDataSource().getConnection();
        try {
            conTruncate.prepareStatement("TRUNCATE TABLE CONTENTS").executeUpdate();
            conTruncate.commit();
        } catch (Exception e) {
            // auto-commit datasource — ignore commit error
        } finally {
            DBUtils.closeAll("insertContentFromExport-truncate", conTruncate, null, null);
        }

        List<String> executedFiles = new ArrayList<>();
        for (String scriptPath : scripts) {
            File f = new File(scriptPath);
            if (!f.exists()) {
                System.err.println("File not found, skipped: " + scriptPath);
                continue;
            }
            Connection con = resolveDataSource().getConnection();
            try {
                Resource resource = new FileSystemResource(scriptPath);
                ScriptUtils.executeSqlScript(con, resource);
                executedFiles.add(scriptPath);
                System.out.println("Executed: " + scriptPath);
            } catch (Exception e) {
                System.err.println("Error executing: " + scriptPath + " - " + e.getMessage());
                throw e;
            } finally {
                DBUtils.closeAll("insertContentFromExport-exec", con, null, null);
            }
        }

        System.out.println("insertContentFromExport completed. Executed: " + executedFiles.size() + " files.");
        return executedFiles;
    }

    public void insertChart() throws SQLException, IOException {
        List<String> scripts = new ArrayList<>();

        //	Doc SQL tu cac file
        scripts.add(path + "CHART.sql");
        System.out.println("File reading and writing completed successfully.");
        //  Insert du lieu vao db
        for (String scriptPath : scripts) {
            Connection connection = resolveDataSource().getConnection();
            try {
                Resource resource = new FileSystemResource(scriptPath);
                ScriptUtils.executeSqlScript(connection, resource);
            } catch (Exception e) {
                System.out.println(scriptPath);
                throw e;
            } finally {
                connection.close();
            }
        }
    }
}
