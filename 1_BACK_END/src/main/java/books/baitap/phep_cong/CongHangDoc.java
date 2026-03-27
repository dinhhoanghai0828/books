package books.baitap.phep_cong;

import books.baitap.utils.BaiTapUtils;
import org.apache.poi.xwpf.usermodel.BreakType;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class CongHangDoc {
    public static void main(String[] args) throws IOException {
        generate(4, "CongCapDo4_HangDoc.docx", "1 chữ số + 2 chữ số (≥20, đảo vị trí)", 240);
        generate(5, "CongCapDo5_HangDoc.docx", "2 số 10–20, tổng < 30", 240);
        generate(6, "CongCapDo6_HangDoc.docx", "2 số 10–20, tổng ≥ 30", 240);
        generate(7, "CongCapDo7_HangDoc.docx", "≤100 không nhớ", 240);
        generate(8, "CongCapDo8_HangDoc.docx", "≤100 có nhớ", 240);
        generate(9, "CongCapDo9_HangDoc.docx", "≤100 mix có nhớ/không nhớ", 240);
    }

    private static void generate(int level, String fileName, String title, int totalCount) throws IOException {
        XWPFDocument document = new XWPFDocument();
        FileOutputStream out = new FileOutputStream(fileName);

        List<String> problems = generateProblems(level, totalCount);

        int perPage = 20; // hàng dọc chiếm chỗ hơn
        int pageCount = (int) Math.ceil(problems.size() / (double) perPage);

        BaiTapUtils.addTitle(document, title);

        for (int page = 0; page < pageCount; page++) {
            int from = page * perPage;
            int to = Math.min(from + perPage, problems.size());

            BaiTapUtils.addVerticalAdditionTable(document, problems.subList(from, to));

            if (page < pageCount - 1) {
                document.createParagraph().createRun().addBreak(BreakType.PAGE);
            }
        }

        document.write(out);
        out.close();
        document.close();

        System.out.println("✅ Đã tạo: " + fileName);
    }

    private static List<String> generateProblems(int level, int totalCount) {
        List<String> problems = new ArrayList<>();
        Random rand = new Random();

        while (problems.size() < totalCount) {
            int a = 0, b = 0;

            switch (level) {

                case 4: // đảo vị trí
                    if (rand.nextBoolean()) {
                        a = rand.nextInt(10) + 10;
                        b = rand.nextInt(9) + 1;
                    } else {
                        a = rand.nextInt(9) + 1;
                        b = rand.nextInt(10) + 10;
                    }
                    if (a + b < 20) continue;
                    break;

                case 5:
                    a = rand.nextInt(11) + 10;
                    b = rand.nextInt(11) + 10;
                    if (a + b >= 30) continue;
                    break;

                case 6:
                    a = rand.nextInt(10) + 10;
                    b = rand.nextInt(10) + 10;
                    if (a + b < 30) continue;
                    break;

                case 7: // không nhớ
                    a = rand.nextInt(90) + 10;
                    b = rand.nextInt(90) + 10;
                    if (a + b > 100 || (a % 10 + b % 10) >= 10) continue;
                    break;

                case 8: // có nhớ
                    a = rand.nextInt(90) + 10;
                    b = rand.nextInt(90) + 10;
                    if (a + b > 100 || (a % 10 + b % 10) < 10) continue;
                    break;

                case 9: // mix
                    a = rand.nextInt(90) + 10;
                    b = rand.nextInt(90) + 10;

                    if (a + b > 100) continue;

                    int unitSum = (a % 10) + (b % 10);
                    boolean wantCarry = rand.nextBoolean();

                    if (wantCarry && unitSum < 10) continue;
                    if (!wantCarry && unitSum >= 10) continue;
                    break;
            }

            problems.add(String.format("%2d + %2d", a, b));
        }

        return problems;
    }
}