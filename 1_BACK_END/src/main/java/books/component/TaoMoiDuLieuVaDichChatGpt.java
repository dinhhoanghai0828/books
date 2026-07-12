package books.component;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class TaoMoiDuLieuVaDichChatGpt {

    private static final String API_KEY = "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";
    private static final String API_URL = "https://api.openai.com/v1/chat/completions";

    public static void main(String args[]) {
        try {
            String databasePath = "D:\\20_PROJECT\\books\\3_DATABASE";
            File inputFile = new File(databasePath + "\\TONG_HOP_DU_LIEU_MOI.sql");

            if (!inputFile.exists()) {
                System.out.println("Input file not found: " + inputFile.getPath());
                return;
            }

            Scanner reader = new Scanner(inputFile, StandardCharsets.UTF_8.name());
            StringBuilder sqlContent = new StringBuilder();
            while (reader.hasNextLine()) {
                sqlContent.append(reader.nextLine()).append("\n");
            }
            reader.close();

            List<SqlRecord> records = parseSqlRecords(sqlContent.toString());
            System.out.println("Found " + records.size() + " records to translate");

            int translatedCount = 0;
            System.out.println("Starting translation...");

            for (SqlRecord record : records) {
                if (record.vi == null || record.vi.trim().isEmpty()) {
                    String translation = translateWithChatGPT(record.eng);
                    if (translation != null && !translation.isEmpty()) {
                        record.vi = translation;
                        translatedCount++;
                        System.out.println("Translated: " + record.eng + " -> " + translation);
                        Thread.sleep(2000); // Giảm xuống 2s nếu dùng tài khoản Pay-as-you-go
                    } else {
                        System.out.println("Failed to translate: " + record.eng);
                        Thread.sleep(3000);
                    }
                }
            }

            System.out.println("Translated " + translatedCount + " sentences");

            StringBuilder outputSql = generateOutputSql(records);
            File outputFile = new File(databasePath + "\\TONG_HOP_DU_LIEU_MOI_VA_DICH_CHAT_GPT.sql");
            PrintStream out = new PrintStream(outputFile, StandardCharsets.UTF_8.name());
            out.print(outputSql.toString());
            out.close();

            System.out.println("Successfully generated TONG_HOP_DU_LIEU_MOI_VA_DICH_CHAT_GPT.sql");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static String translateWithChatGPT(String englishText) {
        int maxRetries = 3;
        int retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                URL url = new URL(API_URL);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                conn.setRequestProperty("Authorization", "Bearer " + API_KEY);
                conn.setDoOutput(true);

                String prompt = "Translate the following English sentence to Vietnamese professionally. " +
                        "Do not translate word by word. Provide a natural, professional translation. " +
                        "Only return the Vietnamese translation, no explanations: " + englishText;

                // Escape JSON an toàn
                String jsonBody = "{"
                        + "\"model\": \"gpt-3.5-turbo\","
                        + "\"messages\": [{\"role\": \"user\", \"content\": " + escapeJsonString(prompt) + "}],"
                        + "\"temperature\": 0.3"
                        + "}";

                try (OutputStream os = conn.getOutputStream()) {
                    byte[] input = jsonBody.getBytes(StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                }

                int responseCode = conn.getResponseCode();
                if (responseCode == 429) {
                    conn.disconnect();
                    retryCount++;
                    int waitTime = (int) Math.pow(2, retryCount) * 2000;
                    System.out.println("Rate limited. Waiting " + waitTime + "ms...");
                    Thread.sleep(waitTime);
                    continue;
                }

                if (responseCode != 200) {
                    conn.disconnect();
                    System.out.println("API returned error code: " + responseCode);
                    return null;
                }

                try (BufferedReader br = new BufferedReader(
                        new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                    StringBuilder response = new StringBuilder();
                    String responseLine;
                    while ((responseLine = br.readLine()) != null) {
                        response.append(responseLine.trim());
                    }

                    conn.disconnect();
                    return extractContentFromJson(response.toString());
                }

            } catch (Exception e) {
                e.printStackTrace();
                retryCount++;
            }
        }
        return null;
    }

    // Hàm Escape JSON thủ công để tránh hỏng Request Body
    private static String escapeJsonString(String input) {
        if (input == null) return "\"\"";
        StringBuilder sb = new StringBuilder("\"");
        for (char c : input.toCharArray()) {
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < ' ') {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        sb.append("\"");
        return sb.toString();
    }

    // Hàm Unescape để lấy câu dịch chính xác
    private static String extractContentFromJson(String json) {
        int contentMarker = json.indexOf("\"content\":");
        if (contentMarker == -1) return null;

        int startQuote = json.indexOf("\"", contentMarker + 10);
        StringBuilder sb = new StringBuilder();
        boolean isEscaped = false;

        for (int i = startQuote + 1; i < json.length(); i++) {
            char c = json.charAt(i);
            if (isEscaped) {
                if (c == 'n') sb.append('\n');
                else if (c == 't') sb.append('\t');
                else sb.append(c);
                isEscaped = false;
            } else if (c == '\\') {
                isEscaped = true;
            } else if (c == '"') {
                break; // Hết chuỗi content
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    private static List<SqlRecord> parseSqlRecords(String sqlContent) {
        List<SqlRecord> records = new ArrayList<>();
        String[] insertBlocks = sqlContent.split("INSERT INTO CONTENTS");

        for (String block : insertBlocks) {
            if (block.trim().isEmpty()) continue;
            int valuesIndex = block.indexOf("VALUES");
            if (valuesIndex == -1) continue;

            String valuesPart = block.substring(valuesIndex + 6).trim();
            String[] recordStrings = valuesPart.split("\\),\\s*\\(");

            for (String recordStr : recordStrings) {
                recordStr = recordStr.trim();
                if (recordStr.startsWith("(")) recordStr = recordStr.substring(1);
                if (recordStr.endsWith(");")) recordStr = recordStr.substring(0, recordStr.length() - 2);
                else if (recordStr.endsWith(")")) recordStr = recordStr.substring(0, recordStr.length() - 1);

                String[] fields = recordStr.split("','");
                if (fields.length >= 5) {
                    SqlRecord record = new SqlRecord();
                    record.eng = fields[0].replace("'", "").trim();
                    record.vi = fields[1].replace("'", "").trim();
                    record.startTime = fields[2].replace("'", "").trim();
                    record.endTime = fields[3].replace("'", "").trim();
                    record.volumeSlug = fields[4].replace("'", "").trim();
                    records.add(record);
                }
            }
        }
        return records;
    }

    private static StringBuilder generateOutputSql(List<SqlRecord> records) {
        StringBuilder output = new StringBuilder();
        String currentVolumeSlug = "";

        for (SqlRecord record : records) {
            if (!record.volumeSlug.equals(currentVolumeSlug)) {
                if (!currentVolumeSlug.isEmpty()) {
                    output.setLength(output.length() - 2);
                    output.append(";\n\n");
                }
                currentVolumeSlug = record.volumeSlug;
                output.append("INSERT INTO CONTENTS (ENG,VI,START_TIME,END_TIME,VOLUME_SLUG) VALUES \n");
            }

            // Escape ký tự ' cho SQL
            String escapedEng = record.eng.replace("'", "''");
            String escapedVi = record.vi.replace("'", "''");

            output.append("('").append(escapedEng).append("','")
                    .append(escapedVi).append("','")
                    .append(record.startTime).append("','")
                    .append(record.endTime).append("','")
                    .append(record.volumeSlug).append("'),\n");
        }

        if (output.length() > 2) {
            output.setLength(output.length() - 2);
            output.append(";");
        }

        return output;
    }

    static class SqlRecord {
        String eng;
        String vi;
        String startTime;
        String endTime;
        String volumeSlug;
    }
}