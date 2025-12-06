package books.read;

import org.apache.commons.lang3.StringUtils;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.PrintStream;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class ReadYoutubeStoryFile {
    public static List<String> splitSentences(String input) {
        // Placeholder for ellipses
        String ellipsisPlaceholder = "[ELLIPSIS]";

        // List of common abbreviations
        String[] abbreviations = {"Mr.", "Mrs.", "Dr.", "Ms.", "Prof.", "mr.", "mrs.", "dr.", "prof."};

        // Replace ellipses '...' with a temporary placeholder
        input = input.replace("...", ellipsisPlaceholder);

        // Temporarily replace abbreviations with placeholders
        for (String abbreviation : abbreviations) {
            input = input.replace(abbreviation, abbreviation.replace(".", "[DOT]"));
        }

        // Split by '.', '!', or '?' but ensure they are not part of ellipses or abbreviations
//        String[] splitSentences = input.split("(?<!\\.)[.!?](?!\\.)");
        String[] splitSentences = input.split("(?<=[.!?])");

        // Restore the ellipses and abbreviations in the split sentences
        List<String> sentences = new ArrayList<>();
        for (String sentence : splitSentences) {
            sentence = sentence.replace(ellipsisPlaceholder, "...");
            for (String abbreviation : abbreviations) {
                sentence = sentence.replace(abbreviation.replace(".", "[DOT]"), abbreviation);
            }
            // Remove '.' and '!', but keep '...' and '?'
            sentence = sentence.replaceAll("(?<!\\.)[.!](?!\\.)", "").trim();

            // Add sentence to the list
            if (!sentence.isEmpty()) {
                sentences.add(sentence.trim());
            }
        }

        return sentences;
    }

    public static void main(String args[]) {
//        System.out.println("aaaa");
        try {
            //  Doc file tieng anh
//            File myObj = new File("G:\\20_PROJECT\\2_books\\3_DATABASE\\1.srt");
//            File myObj = new File("I:\\New folder\\1_english_project\\3_DATA\\1.srt");
            File myObj = new File("E:\\2_books\\3_DATABASE\\1.srt");
            Scanner myReader = new Scanner(myObj);

            //  Cau tieng anh
            List<List<String>> listSetences = new ArrayList();
            List<String> sentence = new ArrayList<String>();
            while (myReader.hasNextLine()) {
                String data = myReader.nextLine();
                // Xoa het khoang trang dau va cuoi cau, cac ky tu dac biet nhu nbsp
                data = data.trim().replace("\u00a0", "");
                //  Xoa xuong dong
                data = data.replace("\n", "").replace("\r", "");

                if (!data.contains("00:") && data.contains(".")
                        || (data.contains("?") && !data.contains("?\"") && !data.contains("?”"))
                        || (data.contains("!") && !data.contains("!\"") && !data.contains("!”"))) {
                    List<String> results = splitSentences(data);
                    //  cau do co chua 2 yeu to
                    //  2
                    //  00:08:45,274 --> 00:08:49,110
                    if (sentence.size() > 0) {
                        int i = 0;
                        for (String result : results) {
                            if (!result.trim().isEmpty()) {
                                //  i nay la khi 1 cau chua 2 3 4... cau va co chua 2 yeu to
                                //  i = 0 la cau so 1
                                //  i > 0 là cau 2 3 4... thi phai lay lai gia tri cua cau dau tien
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
                        //  Nguoc lai tuc la cau nay nam trong cau bi cat ben tren
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


            List<Object> listObject = new ArrayList<>();
            for (int i = 0; i < listSetences.size(); i++) {
                List data = (List) listSetences.get(i);
                Object obj = new Object();
                String sent = "";
                List startEndDate = new ArrayList();

                //Get Sentence
                for (int j = 0; j < data.size(); j++) {
                    String value = (String) data.get(j);
                    if (!value.isEmpty() && value.matches("^[0-2][0-3]:[0-5][0-9](.*)")) {
                        startEndDate.add(value);
                    } else {
                        //  khong duoc phep chua so
                        //  90 This study is usually invoked as evidence that, well, 91 women need a little more confidence
                        //  92 But I think it's evidence 93 that women have been socialized to aspire to perfection, 94 and they're overly cautious
                        //  Bi loi truong truong hop cau co so dung dau: 100 percent
                        if (!value.isEmpty() && !value.matches("[0-9](.*)")) {
                            sent += value + " ";
                        }
                    }
                }
                obj.setSentence(sent);

                //Get Date
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


            //Generate Sql
            StringBuilder sqls = new StringBuilder();

            //  *************************************************************************
            //  Cau Hinh sua khi doc file moi
//            String volumeSlug = "'dhar-mann-studio-3'";
//            String volumeSlug = "'life-diary-animated-45'";
            String volumeSlug = "'voa-1'";
            //  *************************************************************************

            if (listObject.size() > 0) {
                //  Thay doi cac ky tu " trong cau
                for (int i = 0; i < listObject.size(); i++) {
                    //  ocject anh
                    Object obj = listObject.get(i);

                    String engSentence = "";
                    if (obj.getSentence().contains("\'") || obj.getSentence().contains("'") || obj.getSentence().contains("’") || obj.getSentence().contains("\"") || obj.getSentence().contains("“") || obj.getSentence().contains("”")) {
                        engSentence = obj.getSentence().replace("'", "\\\'");
                        engSentence = engSentence.replace("’", "\\\'");
                        engSentence = engSentence.replace("“", "\"");
                        engSentence = engSentence.replace("”", "\"");
                    } else {
                        engSentence = obj.getSentence();
                    }
                    if (engSentence.trim().endsWith(".")) {
                        engSentence = engSentence.trim();
                        engSentence = engSentence.trim().substring(0, engSentence.length() - 1);
                    }
                    // Xoa cac khoang trang bi thua trong cau
                    engSentence = engSentence.trim();

                    String startDate = obj != null && obj.getStartDate() != null ? obj.getStartDate().trim().replace(",", ".") : "";
                    String endDate = obj != null && obj.getEndDate() != null ? obj.getEndDate().trim().replace(",", ".") : "";
                    String sql = "('" + engSentence + "','','" + startDate + "','" + endDate + "'," + volumeSlug + ")," + "\n";
                    sqls.append(sql);
                }

                String lastQuery = "INSERT INTO CONTENTS (ENG,VI,START_TIME,END_TIME,VOLUME_SLUG) VALUES " + "\n";
                lastQuery += sqls.toString();
                //  Xoa space dau cuoi cau
                lastQuery = lastQuery.trim();
                //  Xoa ,  cuoi cau thay bang ;
                if (lastQuery.endsWith(",")) {
                    lastQuery = lastQuery.substring(0, lastQuery.length() - 1) + ";";
                }
                try {
                    PrintStream out = new PrintStream(System.out, true, "UTF-8");
                    out.println(lastQuery);
                } catch (UnsupportedEncodingException e) {
                    throw new InternalError("VM does not support mandatory encoding UTF-8");
                }
            }

            myReader.close();

        } catch (FileNotFoundException e) {
            System.out.println("An error occurred.");
            e.printStackTrace();
        }
    }
}
