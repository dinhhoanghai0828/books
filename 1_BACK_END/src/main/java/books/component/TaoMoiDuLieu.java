package books.component;

import books.read.Object;
import org.apache.commons.lang3.StringUtils;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.PrintStream;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class TaoMoiDuLieu {

    public static List<String> splitSentences(String input) {
        String ellipsisPlaceholder = "[ELLIPSIS]";
        String[] abbreviations = {"Mr.", "Mrs.", "Dr.", "Ms.", "Prof.", "mr.", "mrs.", "dr.", "prof."};

        input = input.replace("...", ellipsisPlaceholder);

        for (String abbreviation : abbreviations) {
            input = input.replace(abbreviation, abbreviation.replace(".", "[DOT]"));
        }

        String[] splitSentences = input.split("(?<=[.!?])");

        List<String> sentences = new ArrayList<>();
        for (String sentence : splitSentences) {
            sentence = sentence.replace(ellipsisPlaceholder, "...");
            for (String abbreviation : abbreviations) {
                sentence = sentence.replace(abbreviation.replace(".", "[DOT]"), abbreviation);
            }
            sentence = sentence.replaceAll("(?<!\\.)[.!](?!\\.)", "").trim();

            if (!sentence.isEmpty()) {
                sentences.add(sentence.trim());
            }
        }

        return sentences;
    }

    public static void main(String args[]) {
        try {
            String databasePath = "D:\\20_PROJECT\\books\\3_DATABASE";
            File databaseDir = new File(databasePath);

            if (!databaseDir.exists() || !databaseDir.isDirectory()) {
                System.out.println("Directory not found: " + databasePath);
                return;
            }

            File[] sqlFiles = databaseDir.listFiles((dir, name) -> name.startsWith("sql-") && name.endsWith(".srt"));

            if (sqlFiles == null || sqlFiles.length == 0) {
                System.out.println("No files starting with 'sql-' found in directory");
                return;
            }

            StringBuilder allSqls = new StringBuilder();

            for (File sqlFile : sqlFiles) {
                String fileName = sqlFile.getName();
                String volumeSlug = fileName.substring(4, fileName.length() - 4);

                System.out.println("Processing file: " + fileName);
                System.out.println("Volume slug: " + volumeSlug);

                Scanner myReader = new Scanner(sqlFile);
                List<List<String>> listSetences = new ArrayList();
                List<String> sentence = new ArrayList<String>();

                while (myReader.hasNextLine()) {
                    String data = myReader.nextLine();
                    data = data.trim().replace("\u00a0", "");
                    data = data.replace("\n", "").replace("\r", "");

                    // Remove TurboScribe messages from the line
                    data = data.replaceAll("\\(Transcribed by TurboScribe\\. Go Unlimited to remove this message\\.\\) ", "");
                    data = data.replaceAll("\\(Được chép bởi TurboScribe\\. Nâng cấp lên Không giới hạn để gỡ bỏ thông báo này\\.\\) ", "");

                    if (!data.contains("00:") && data.contains(".")
                            || (data.contains("?") && !data.contains("?\"") && !data.contains("?\""))
                            || (data.contains("!") && !data.contains("!\"") && !data.contains("!\""))) {
                        List<String> results = splitSentences(data);

                        if (sentence.size() > 0) {
                            int i = 0;
                            for (String result : results) {
                                if (!result.trim().isEmpty()) {
                                    if (i == 0) {
                                        sentence.add(result);
                                        listSetences.add(sentence);
                                        i++;
                                    } else {
                                        List<String> sameSentence = new ArrayList<>();
                                        sentence = listSetences.get(listSetences.size() - 1);
                                        sameSentence.add(sentence.get(0));
                                        sameSentence.add(sentence.get(1));
                                        sameSentence.add(result);
                                        listSetences.add(sameSentence);
                                    }
                                }
                            }
                        } else {
                            sentence = listSetences.get(listSetences.size() - 1);
                            for (String result : results) {
                                List<String> sameSentence = new ArrayList<>();
                                sameSentence.add(sentence.get(0));
                                sameSentence.add(sentence.get(1));
                                sameSentence.add(result);
                                listSetences.add(sameSentence);
                            }
                        }
                        sentence = new ArrayList<>();
                    } else {
                        if (StringUtils.isNotBlank(data)) {
                            sentence.add(data);
                        }
                    }
                }

                List<books.read.Object> listObject = new ArrayList<>();
                for (int i = 0; i < listSetences.size(); i++) {
                    List data = (List) listSetences.get(i);
                    books.read.Object obj = new books.read.Object();
                    String sent = "";
                    List startEndDate = new ArrayList();

                    for (int j = 0; j < data.size(); j++) {
                        String value = (String) data.get(j);
                        if (!value.isEmpty() && value.matches("^[0-2][0-3]:[0-5][0-9](.*)")) {
                            startEndDate.add(value);
                        } else {
                            if (!value.isEmpty() && !value.matches("[0-9](.*)")) {
                                sent += value + " ";
                            }
                        }
                    }
                    obj.setSentence(sent);

                    for (int k = 0; k < startEndDate.size(); k++) {
                        if (k == 0) {
                            String vl = (String) startEndDate.get(k);
                            String startDate = (String) vl.substring(0, vl.indexOf("-->") - 1);
                            obj.setStartDate(startDate);
                        }
                        if (k == startEndDate.size() - 1) {
                            String vl = (String) startEndDate.get(k);
                            String endDate = (String) vl.substring(vl.indexOf(">") + 2, vl.length());
                            obj.setEndDate(endDate);
                        }
                    }
                    listObject.add(obj);
                }

                StringBuilder sqls = new StringBuilder();

                if (listObject.size() > 0) {
                    for (int i = 0; i < listObject.size(); i++) {
                        books.read.Object obj = listObject.get(i);

                        String engSentence = "";
                        if (obj.getSentence().contains("\'") || obj.getSentence().contains("'") || obj.getSentence().contains("'") || obj.getSentence().contains("\"") || obj.getSentence().contains("\"") || obj.getSentence().contains("\"")) {
                            engSentence = obj.getSentence().replace("'", "\\'");
                            engSentence = engSentence.replace("'", "\\'");
                            engSentence = engSentence.replace("\"", "\"");
                            engSentence = engSentence.replace("\"", "\"");
                        } else {
                            engSentence = obj.getSentence();
                        }
                        if (engSentence.trim().endsWith(".")) {
                            engSentence = engSentence.trim();
                            engSentence = engSentence.trim().substring(0, engSentence.length() - 1);
                        }
                        engSentence = engSentence.trim();

                        String startDate = obj != null && obj.getStartDate() != null ? obj.getStartDate().trim().replace(",", ".") : "";
                        String endDate = obj != null && obj.getEndDate() != null ? obj.getEndDate().trim().replace(",", ".") : "";
                        String sql = "('" + engSentence + "','','" + startDate + "','" + endDate + "','" + volumeSlug + "')," + "\n";
                        sqls.append(sql);
                    }

                    String lastQuery = "INSERT INTO CONTENTS (ENG,VI,START_TIME,END_TIME,VOLUME_SLUG) VALUES " + "\n";
                    lastQuery += sqls.toString();
                    lastQuery = lastQuery.trim();
                    if (lastQuery.endsWith(",")) {
                        lastQuery = lastQuery.substring(0, lastQuery.length() - 1) + ";";
                    }
                    allSqls.append(lastQuery).append("\n\n");
                }

                myReader.close();
            }

            File outputFile = new File(databasePath + "\\TONG_HOP_DU_LIEU_MOI.sql");
            PrintStream out = new PrintStream(outputFile, "UTF-8");
            out.print(allSqls.toString());
            out.close();

            System.out.println("Successfully generated TONG_HOP_DU_LIEU_MOI.sql with " + sqlFiles.length + " files processed.");

        } catch (FileNotFoundException e) {
            System.out.println("An error occurred.");
            e.printStackTrace();
        } catch (UnsupportedEncodingException e) {
            System.out.println("Encoding error occurred.");
            e.printStackTrace();
        }
    }
}
