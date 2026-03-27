package books.baitap.phep_cong;

import books.baitap.utils.BaiTapUtils;
import org.apache.poi.xwpf.usermodel.BreakType;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class CongTimSoHangNgang {

    public static void main(String[] args) throws IOException {
        generate(1, "CongTimSoCapDo1.docx", "Tìm số chưa biết (tổng ≤ 10)", 240);
        generate(2, "CongTimSoCapDo2.docx", "Tìm số chưa biết (tổng > 10)", 240);
        generate(3, "CongTimSoCapDo3.docx", "1 chữ số + 2 chữ số (tổng < 20)", 240);
        generate(4, "CongTimSoCapDo4.docx", "1 chữ số + 2 chữ số (tổng ≥ 20)", 240);
        generate(5, "CongTimSoCapDo5.docx", "2 số (10–20), tổng < 30", 240);
        generate(6, "CongTimSoCapDo6.docx", "2 số (10–20), tổng ≥ 30", 240);
        generate(7, "CongTimSoCapDo7.docx", "≤ 100 (không nhớ)", 240);
        generate(8, "CongTimSoCapDo8.docx", "≤ 100 (có nhớ)", 240);
    }

    private static void generate(int level, String fileName, String title, int totalCount) throws IOException {
        XWPFDocument document = new XWPFDocument();
        FileOutputStream out = new FileOutputStream(fileName);

        List<String> problems = generateProblems(level, totalCount);

        int perPage = 24;
        int pageCount = (int) Math.ceil(problems.size() / (double) perPage);

        BaiTapUtils.addTitle(document, title);

        for (int page = 0; page < pageCount; page++) {
            int from = page * perPage;
            int to = Math.min(from + perPage, problems.size());

            BaiTapUtils.addProblemsTable(document, problems.subList(from, to));

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

                case 1:
                    a = rand.nextInt(9) + 1;
                    b = rand.nextInt(9) + 1;
                    if (a + b > 10) continue;
                    break;

                case 2:
                    a = rand.nextInt(9) + 1;
                    b = rand.nextInt(9) + 1;
                    if (a + b <= 10) continue;
                    break;

                case 3:
                    a = rand.nextInt(9) + 1;
                    b = rand.nextInt(11) + 10;
                    if (a + b >= 20) continue;
                    break;

                case 4:
                    a = rand.nextInt(9) + 1;
                    b = rand.nextInt(11) + 10;
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
            }

            int sum = a + b;

            boolean hideA = rand.nextBoolean();

            String problem;

            if (hideA) {
                // □ + b = sum
                problem = String.format("%2s  +  %2d  =  %2d", " ", b, sum);
            } else {
                // a + □ = sum
                problem = String.format("%2d  +  %2s  =  %2d", a, " ", sum);
            }

            problems.add(problem);
        }

        return problems;
    }
}