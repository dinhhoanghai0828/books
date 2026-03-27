package books.baitap.phep_tru;

import books.baitap.utils.BaiTapUtils;
import org.apache.poi.xwpf.usermodel.BreakType;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class TruHangDoc {

    public static void main(String[] args) throws IOException {
        // Sinh tất cả 13 cấp độ
        for (int level = 1; level <= 13; level++) {
            String fileName = String.format("TruCapDo%d_HangDoc.docx", level);
            String title = getTitle(level);
            generate(level, fileName, title, 240);
        }
    }

    private static String getTitle(int level) {
        switch (level) {
            case 1:
                return "1 chữ số - 1 chữ số (không nhớ)";
            case 2:
                return "1 chữ số - 1 chữ số (có nhớ)";
            case 3:
                return "2 chữ số ≤ 20 - 1 chữ số (không nhớ)";
            case 4:
                return "2 chữ số ≤ 20 - 1 chữ số (có nhớ)";
            case 5:
                return "2 chữ số 20–30 - 1 chữ số (không nhớ)";
            case 6:
                return "2 chữ số 20–30 - 1 chữ số (có nhớ)";
            case 7:
                return "2 chữ số 31–50 - 2 chữ số (không nhớ)";
            case 8:
                return "2 chữ số 31–50 - 2 chữ số (có nhớ)";
            case 9:
                return "2 chữ số 51–70 - 2 chữ số (không nhớ)";
            case 10:
                return "2 chữ số 51–70 - 2 chữ số (có nhớ)";
            case 11:
                return "2 chữ số 71–90 - 2 chữ số (không nhớ)";
            case 12:
                return "2 chữ số 71–90 - 2 chữ số (có nhớ)";
            case 13:
                return "2 chữ số 91–100 - 2 chữ số (có nhớ)";
            default:
                return "Bài tập trừ";
        }
    }

    private static void generate(int level, String fileName, String title, int totalCount) throws IOException {
        XWPFDocument document = new XWPFDocument();
        FileOutputStream out = new FileOutputStream(fileName);

        List<String> problems = generateProblems(level, totalCount);

        int perPage = 20; // số phép trừ mỗi trang
        int pageCount = (int) Math.ceil(problems.size() / (double) perPage);

        BaiTapUtils.addTitle(document, title);

        for (int page = 0; page < pageCount; page++) {
            int from = page * perPage;
            int to = Math.min(from + perPage, problems.size());
            List<String> pageProblems = problems.subList(from, to);

            // Bảng phép trừ cột dọc
            BaiTapUtils.addVerticalSubtractTable(document, pageProblems);

            if (page < pageCount - 1) {
                document.createParagraph().createRun().addBreak(BreakType.PAGE);
            }
        }

        document.write(out);
        out.close();
        document.close();

        System.out.println("✅ Đã tạo xong file Word: " + fileName);
    }

    private static List<String> generateProblems(int level, int totalCount) {
        List<String> problems = new ArrayList<>();
        Random rand = new Random();

        while (problems.size() < totalCount) {
            int a = 0, b = 0;

            switch (level) {
                case 1: // 1 chữ số - 1 chữ số, không nhớ
                    a = rand.nextInt(9) + 1;
                    b = rand.nextInt(a + 1);
                    if (b == 0 || a == b) continue;
                    break;
                case 2: // 1 chữ số - 1 chữ số, có nhớ
                    a = rand.nextInt(9) + 1;
                    b = rand.nextInt(9) + 1;
                    if (a <= b) continue;
                    break;
                case 3: // 2 chữ số ≤20 - 1 chữ số, không nhớ
                    a = rand.nextInt(11) + 10;
                    b = rand.nextInt(10);
                    if ((a % 10) < b) continue;
                    break;
                case 4: // 2 chữ số ≤20 - 1 chữ số, có nhớ
                    a = rand.nextInt(11) + 10;
                    b = rand.nextInt(10);
                    if ((a % 10) >= b) continue;
                    break;
                case 5: // 2 chữ số 20–30 - 1 chữ số, không nhớ
                    a = rand.nextInt(11) + 20;
                    b = rand.nextInt(9) + 1;
                    if ((a % 10) < b) continue;
                    break;
                case 6: // 2 chữ số 20–30 - 1 chữ số, có nhớ
                    a = rand.nextInt(11) + 20;
                    b = rand.nextInt(9) + 1;
                    if ((a % 10) >= b) continue;
                    break;
                case 7: // 2 chữ số 31–50 - 2 chữ số, không nhớ
                    a = rand.nextInt(20) + 31;
                    b = rand.nextInt(20) + 10;
                    if (a < b || (a % 10) < (b % 10)) continue;
                    break;
                case 8: // 2 chữ số 31–50 - 2 chữ số, có nhớ
                    a = rand.nextInt(20) + 31;
                    b = rand.nextInt(20) + 10;
                    if (a < b || (a % 10) >= (b % 10)) continue;
                    break;
                case 9: // 2 chữ số 51–70 - 2 chữ số, không nhớ
                    a = rand.nextInt(20) + 51;
                    b = rand.nextInt(20) + 10;
                    if (a < b || (a % 10) < (b % 10)) continue;
                    break;
                case 10: // 2 chữ số 51–70 - 2 chữ số, có nhớ
                    a = rand.nextInt(20) + 51;
                    b = rand.nextInt(20) + 10;
                    if (a < b || (a % 10) >= (b % 10)) continue;
                    break;
                case 11: // 2 chữ số 71–90 - 2 chữ số, không nhớ
                    a = rand.nextInt(20) + 71;
                    b = rand.nextInt(20) + 10;
                    if (a < b || (a % 10) < (b % 10)) continue;
                    break;
                case 12: // 2 chữ số 71–90 - 2 chữ số, có nhớ
                    a = rand.nextInt(20) + 71;
                    b = rand.nextInt(20) + 10;
                    if (a < b || (a % 10) >= (b % 10)) continue;
                    break;
                case 13: // 2 chữ số 91–100 - 2 chữ số, có nhớ
                    a = rand.nextInt(10) + 91;
                    b = rand.nextInt(20) + 10;
                    if (a < b || (a % 10) >= (b % 10)) continue;
                    break;
            }

            problems.add(String.format("%3d  - %2d  =", a, b));
        }

        return problems;
    }
}