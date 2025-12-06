package books.component;

import books.utils.DBUtils;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class RunSQLComponent {
    // Autowire bean cụ thể
    //    @Autowired
    private DataSource dataSource;
    String path = "G:\\20_PROJECT\\2_books\\3_DATABASE\\";
    //    String path = "E:\\2_books\\3_DATABASE\\";
    private String url;
    private String username;
    private String password;
    private String driverClassName;

    public DataSource getDataSource() {
        try {
            Properties prop = new Properties();
            ClassLoader loader = Thread.currentThread().getContextClassLoader();
            InputStream stream = loader.getResourceAsStream("application.properties");
            prop.load(stream);
            url = prop.getProperty("spring.datasource.url");
            driverClassName = prop.getProperty("spring.datasource.driver-class-name");
            username = prop.getProperty("spring.datasource.username");
            password = prop.getProperty("spring.datasource.password");
        } catch (Exception e) {
            System.out.printf("123");
        }

        DataSourceBuilder dataSourceBuilder = DataSourceBuilder.create();
        dataSourceBuilder.driverClassName(driverClassName);
        dataSourceBuilder.url(url);
        dataSourceBuilder.username(username);
        dataSourceBuilder.password(password);
        return dataSourceBuilder.build();

    }

    @Bean
    public JdbcTemplate jdbcTemplate() {
        dataSource = getDataSource();
        return new JdbcTemplate(dataSource);
    }

    //    @PostConstruct
    public void insertContent() throws SQLException, IOException {
        dataSource = getDataSource();
        List<String> scripts = new ArrayList<>();
        //	Doc SQL tu cac file
        scripts.add(path + "2_SQL_CREATE_DATA.sql");
        scripts.add(path + "APP_BOOKS_IELTS_BOOK_01_4000_ESSENTIAL_ENGLISH_WORDS.sql");
        scripts.add(path + "APP_BOOKS_PHILOSOPHY_BOOK_01_4000_I_AM_MARY.sql");
        scripts.add(path + "APP_CONVERSATIONS_ACADEMIC_CONVERSATION_01_TEDTALKS.sql");
        scripts.add(path + "APP_CONVERSATIONS_ACADEMIC_CONVERSATION_02_ALL_EARS_ENGLISH.sql");
        scripts.add(path + "APP_CONVERSATIONS DAILY CONVERSATION 01 DHAR MANN STUDIO.sql");
        scripts.add(path + "APP_NEWS_DAILY_NEW_01_ECONOMIST.sql");
        scripts.add(path + "APP_NEWS_DAILY_NEW_02_VOA.sql");
        scripts.add(path + "APP_STORIES_ADULT_STORY_01_ANIMATERS.sql");
        scripts.add(path + "APP_STORIES_FAIRY_TALE_STORY_01_ENGLISH_FAIRY_TALE.sql");
        scripts.add(path + "APP_STORIES_HORROR_STORY_01_NIGHTMARE_TALES.sql");
        scripts.add(path + "APP_STORIES_INSPIRATIONAL_STORY_01_THE_FICTIONIST.sql");
        scripts.add(path + "APP_STORIES_INSPIRATIONAL_STORY_02_GOD_OF_MOTIVE.sql");
        scripts.add(path + "APP_STORIES_TEEN_STORY_01_LIFE_DIARY_ANIMATED.sql");
        scripts.add(path + "APP_STORIES_TEEN_STORY_02_YOUR_ANIMATED_STORY_SHOW.sql");

        //  Tong hop ra file Z_SQL_RESULTS_SENTENCE.sql
        String outputFilePath = path + "SUMMARY.sql";
        try (FileWriter outputWriter = new FileWriter(outputFilePath)) {
            for (String filePath : scripts) {
                try (FileReader fileReader = new FileReader(filePath);
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
            Connection connection = dataSource.getConnection();
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
        dataSource = getDataSource();
        String selectSql = "SELECT ENG FROM CONTENTS";
        String insertSql = "INSERT IGNORE INTO ENG_WORDS (WORD) VALUES (?)";

        Connection connection = null;
        PreparedStatement selectStmt = null;
        ResultSet resultSet = null;

        // Sử dụng kết nối JDBC trực tiếp
        try {
            connection = dataSource.getConnection();
            selectStmt = connection.prepareStatement(selectSql);
            resultSet = selectStmt.executeQuery();

            Set<String> allWords = new HashSet<>();

            // Duyệt qua tất cả các câu trong cột ENG
            while (resultSet.next()) {
                String sentence = resultSet.getString("ENG");
                if (sentence != null && !sentence.trim().isEmpty()) {
                    Set<String> validWords = getValidWords(sentence);
                    allWords.addAll(validWords);  // Thêm các từ hợp lệ vào set
                }
            }

            // Chuyển Set sang List và sắp xếp theo thứ tự alphabet
            List<String> sortedWords = new ArrayList<>(allWords);
            Collections.sort(sortedWords);

            // Chèn từ vào bảng ENG_WORDS (tránh trùng lặp bằng INSERT IGNORE)
            try (PreparedStatement insertStmt = connection.prepareStatement(insertSql)) {
                for (String word : sortedWords) {
                    insertStmt.setString(1, word);
                    insertStmt.addBatch();  // Thêm vào batch
                }
                insertStmt.executeBatch();  // Thực hiện batch insert
            }

            System.out.println("Words inserted into ENG_WORDS table in alphabetical order.");
        } catch (SQLException e) {
            System.err.println("Error in extractAndInsertWords: " + e.getMessage());
            e.printStackTrace();
        } finally {
            DBUtils.closeAll(thisMethod, connection, selectStmt, resultSet);
        }
    }

    public void extractAndInsertViWords() {
        String thisMethod = "extractAndInsertEngWords";
        dataSource = getDataSource();
        String selectSql = "SELECT VI FROM CONTENTS";  // Lấy cột VI
        String insertSql = "INSERT IGNORE INTO VI_WORDS (WORD) VALUES (?)";  // Chèn vào VI_WORDS

        Connection connection = null;
        PreparedStatement selectStmt = null;
        ResultSet resultSet = null;

        // Sử dụng kết nối JDBC trực tiếp
        try {
            connection = dataSource.getConnection();
            selectStmt = connection.prepareStatement(selectSql);
            resultSet = selectStmt.executeQuery();

            Set<String> allWords = new HashSet<>();

            // Duyệt qua tất cả các câu trong cột VI
            while (resultSet.next()) {
                String sentence = resultSet.getString("VI");
                if (sentence != null && !sentence.trim().isEmpty()) {
                    Set<String> validWords = getValidViWords(sentence);
                    allWords.addAll(validWords);  // Thêm các từ hợp lệ vào set
                }
            }

            // Chuyển Set sang List và sắp xếp theo thứ tự alphabet
            List<String> sortedWords = new ArrayList<>(allWords);
            Collections.sort(sortedWords);

            // Chèn từ vào bảng VI_WORDS (tránh trùng lặp bằng INSERT IGNORE)
            try (PreparedStatement insertStmt = connection.prepareStatement(insertSql)) {
                for (String word : sortedWords) {
                    insertStmt.setString(1, word);
                    insertStmt.addBatch();  // Thêm vào batch
                }
                insertStmt.executeBatch();  // Thực hiện batch insert
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
        dataSource = getDataSource();
        List<String> scripts = new ArrayList<>();
        scripts.add(path + "3_SQL_ENG_WORDS.sql");
        for (String scriptPath : scripts) {
            Connection connection = dataSource.getConnection();
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
        dataSource = getDataSource();
        List<String> scripts = new ArrayList<>();
        scripts.add(path + "3_SQL_ENG_MISSING_WORDS.sql");
        for (String scriptPath : scripts) {
            Connection connection = dataSource.getConnection();
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
        JdbcTemplate jdbcTemplate = jdbcTemplate();
        List<Map<String, Object>> results = jdbcTemplate.queryForList(
                "SELECT * FROM WORDS"  // Your SQL query
        );
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
        int i = 0;
        for (Map<String, java.lang.Object> row : results) {
            try {
                String eng = (String) row.get("eng");
                eng = eng.trim();
                if (eng.contains("\'")) {
                    eng = eng.replace("\'", "\\'");
                }
                String vi = (String) row.get("vi");
                vi = vi.trim();
                String color = (String) row.get("color");
                if (i == results.size() - 1) {
                    String sql = "\t" + "('" + eng + "','" + vi + "');" + "\n";
                    sqls.append(sql);
                } else {
                    String sql = "\t" + "('" + eng + "','" + vi + "')," + "\n";
                    sqls.append(sql);
                }
            } catch (Exception e) {
                System.out.println(row.get("eng"));
                System.out.println(row.get("vi"));
                throw e;
            }
            i++;
        }
        lastQuery = table + "\n\n\n" + lastQuery + sqls;
        System.out.println(lastQuery);
        try (FileWriter writer = new FileWriter(path + "3_SQL_ENG_WORDS.sql")) {
            writer.write(lastQuery);
            writer.flush();
        } catch (IOException e) {
            e.printStackTrace();
        }

    }

    public void createWordTableTemp() throws SQLException {
        dataSource = getDataSource();
        List<String> scripts = new ArrayList<>();
        //	Lay toan bo gia tri bang WORD va insert vao bang WORDS2
        //	Lay toan bo gia tri bang WORD2 va insert lai vao bang WORDS
        scripts.add(path + "4_SQL_CREATE_WORD2.sql");
        for (String scriptPath : scripts) {
            Connection connection = dataSource.getConnection();
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

    public void insertChart() throws SQLException, IOException {
        dataSource = getDataSource();
        List<String> scripts = new ArrayList<>();

        //	Doc SQL tu cac file
        scripts.add(path + "CHART.sql");
        System.out.println("File reading and writing completed successfully.");
        //  Insert du lieu vao db
        for (String scriptPath : scripts) {
            Connection connection = dataSource.getConnection();
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
