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
        // Lấy danh sách BOOK_SLUG có contents trong DB
//        String sqlGetBooks = "SELECT DISTINCT B.SLUG AS BOOK_SLUG FROM BOOKS B " +
//                "INNER JOIN VOLUMES V ON V.BOOK_SLUG = B.SLUG " +
//                "INNER JOIN CONTENTS C ON C.VOLUME_SLUG = V.SLUG " +
//                "ORDER BY B.SLUG";

        List<String> scripts = new ArrayList<>();
        scripts.add(path + "1_SQL_CREATE_TABLES.sql");
        scripts.add(path + "2_SQL_CREATE_DATA.sql");
        scripts.add(path + "3_SQL_ENG_MISSING_WORDS.sql");
        scripts.add(path + "3_SQL_ENG_WORDS.sql");
        scripts.add(path + "APP_4000_ESSENTIAL_ENGLISH_WORDS.sql");
        scripts.add(path + "APP_ALL_EARS_ENGLISH.sql");
        scripts.add(path + "APP_ANIMATTERS.sql");
        scripts.add(path + "APP_DHAR_MANN_STUDIO.sql");
        scripts.add(path + "APP_ECONOMIST.sql");
        scripts.add(path + "APP_ENGLISH_FAIRY_TALES.sql");
        scripts.add(path + "APP_ESL_FAST_CHILDREN_1.sql");
        scripts.add(path + "APP_ESL_FAST_ELEMENTARY_1.sql");
        scripts.add(path + "APP_GOD_OF_MOTIVE.sql");
        scripts.add(path + "APP_I_AM_MARY.sql");
        scripts.add(path + "APP_LIFE_DIARY_ANIMATED.sql");
        scripts.add(path + "APP_NIGHTMARE_TALES.sql");
        scripts.add(path + "APP_PEPPA_PIG.sql");
        scripts.add(path + "APP_TEDTALKS.sql");
        scripts.add(path + "APP_THE_FICTIONIST.sql");
        scripts.add(path + "APP_TIGER_CLUB_LEARNING.sql");
        scripts.add(path + "APP_VOA.sql");
        scripts.add(path + "APP_YOUR_ANIMATED_STORY_SHOW.sql");

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

        String sqlGetBooks = "SELECT DISTINCT B.SLUG AS BOOK_SLUG FROM BOOKS B " +
                "INNER JOIN VOLUMES V ON V.BOOK_SLUG = B.SLUG " +
                "INNER JOIN CONTENTS C ON C.VOLUME_SLUG = V.SLUG " +
                "ORDER BY B.SLUG";

        String sqlGetContents =
                "SELECT C.ENG, C.VI, C.START_TIME, C.END_TIME, C.VOLUME_SLUG, " +
                "V.SLUG AS V_SLUG, V.ENG AS V_ENG, V.VI AS V_VI, V.AUDIO AS V_AUDIO, " +
                "V.START_TIME AS V_START, V.END_TIME AS V_END, V.BOOK_SLUG AS V_BOOK_SLUG, " +
                "V.CHECKED AS V_CHECKED, V.NUMBER AS V_NUMBER, V.ID AS V_ID " +
                "FROM CONTENTS C " +
                "INNER JOIN VOLUMES V ON C.VOLUME_SLUG = V.SLUG " +
                "WHERE V.BOOK_SLUG = ? " +
                "ORDER BY V.ID, C.ID";

        Connection connection = null;
        PreparedStatement pstmtBooks = null;
        ResultSet rsBooks = null;

        try {
            connection = resolveDataSource().getConnection();
            pstmtBooks = connection.prepareStatement(sqlGetBooks);
            rsBooks = pstmtBooks.executeQuery();

            List<String> bookSlugs = new ArrayList<>();
            while (rsBooks.next()) {
                bookSlugs.add(rsBooks.getString("BOOK_SLUG"));
            }
            DBUtils.closeAll("generalContents-books", null, pstmtBooks, rsBooks);

            final int ROWS_PER_BATCH    = 1000; // tách INSERT nếu 1 tập quá dài
            final int VOLUMES_PER_BATCH = 5;    // gom tối đa 5 tập vào 1 INSERT
            final String SEPARATOR = "\n/*=====================================================================================================================================================================================================================================================*/\n\n";

            for (String bookSlug : bookSlugs) {
                String fileNameKey  = bookSlug.toUpperCase().replace("-", "_");
                String outputFilePath = path + "APP_" + fileNameKey + ".sql";

                PreparedStatement pstmtContents = null;
                ResultSet rsContents = null;
                try {
                    pstmtContents = connection.prepareStatement(sqlGetContents);
                    pstmtContents.setString(1, bookSlug);
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
                        String vChecked  = rsContents.getString("V_CHECKED");
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
                              .append(vBookSlug).append("','").append(vChecked).append("',")
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
                    DBUtils.closeAll("generalContents-contents-" + bookSlug, null, pstmtContents, rsContents);
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

        // Lấy danh sách BOOK_SLUG có contents trong DB
        String sqlGetBooks = "SELECT DISTINCT B.SLUG AS BOOK_SLUG FROM BOOKS B " +
                "INNER JOIN VOLUMES V ON V.BOOK_SLUG = B.SLUG " +
                "INNER JOIN CONTENTS C ON C.VOLUME_SLUG = V.SLUG " +
                "ORDER BY B.SLUG";

        List<String> scripts = new ArrayList<>();
        Connection conQuery = resolveDataSource().getConnection();
        try {
            PreparedStatement pstmt = conQuery.prepareStatement(sqlGetBooks);
            ResultSet rs = pstmt.executeQuery();
            while (rs.next()) {
                String bookSlug = rs.getString("BOOK_SLUG");
                String fileNameKey = bookSlug.toUpperCase().replace("-", "_");
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
