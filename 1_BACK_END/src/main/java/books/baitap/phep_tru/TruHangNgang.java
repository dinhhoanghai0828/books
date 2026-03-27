package books.baitap.phep_tru;

import books.baitap.utils.BaiTapUtils;
import org.apache.poi.xwpf.usermodel.BreakType;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import java.io.FileOutputStream;
import java.io.IOException;
import java.util.*;

public class TruHangNgang {

    public static void main(String[] args) throws IOException {
        // Tạo 13 cấp độ trừ ≤100
        generate(1, "TruCapDo1.docx", "1 chữ số - 1 chữ số (không nhớ)", 240);
        generate(2, "TruCapDo2.docx", "1 chữ số - 1 chữ số (có nhớ)", 240);
        generate(3, "TruCapDo3.docx", "2 chữ số ≤ 20 - 1 chữ số (không nhớ)", 240);
        generate(4, "TruCapDo4.docx", "2 chữ số ≤ 20 - 1 chữ số (có nhớ)", 240);
        generate(5, "TruCapDo5.docx", "2 chữ số 20–30 - 1 chữ số (không nhớ)", 240);
        generate(6, "TruCapDo6.docx", "2 chữ số 20–30 - 1 chữ số (có nhớ)", 240);
        generate(7, "TruCapDo7.docx", "2 chữ số 31–50 - 2 chữ số (không nhớ)", 240);
        generate(8, "TruCapDo8.docx", "2 chữ số 31–50 - 2 chữ số (có nhớ)", 240);
        generate(9, "TruCapDo9.docx", "2 chữ số 51–70 - 2 chữ số (không nhớ)", 240);
        generate(10, "TruCapDo10.docx", "2 chữ số 51–70 - 2 chữ số (có nhớ)", 240);
        generate(11, "TruCapDo11.docx", "2 chữ số 71–90 - 2 chữ số (không nhớ)", 240);
        generate(12, "TruCapDo12.docx", "2 chữ số 71–90 - 2 chữ số (có nhớ)", 240);
        generate(13, "TruCapDo13.docx", "2 chữ số 91–100 - 2 chữ số (có nhớ)", 240);
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
                case 1: // 1 chữ số - 1 chữ số, không nhớ
                    a = rand.nextInt(9) + 1; // 1–9
                    b = rand.nextInt(a);     // < a
                    break;

                case 2: // 1 chữ số - 1 chữ số, có nhớ (vượt 10)
                    a = rand.nextInt(9) + 1;
                    b = rand.nextInt(9) + 1;
                    if (a <= b) continue;
                    break;

                case 3: // 2 chữ số ≤20 - 1 chữ số, không nhớ
                    a = rand.nextInt(11) + 10; // 10–20
                    b = rand.nextInt(10);      // 0–9
                    if ((a % 10) < b) continue; // không nhớ
                    break;

                case 4: // 2 chữ số ≤20 - 1 chữ số, có nhớ
                    a = rand.nextInt(11) + 10;
                    b = rand.nextInt(10);
                    if ((a % 10) >= b) continue; // phải mượn
                    break;

                case 5: // 2 chữ số 20–30 - 1 chữ số, không nhớ
                    a = rand.nextInt(11) + 20; // 20–30
                    b = rand.nextInt(10);
                    if ((a % 10) < b) continue;
                    break;

                case 6: // 2 chữ số 20–30 - 1 chữ số, có nhớ
                    a = rand.nextInt(11) + 20;
                    b = rand.nextInt(10);
                    if ((a % 10) >= b) continue;
                    break;

                case 7: // 2 chữ số 31–50 - 2 chữ số, không nhớ
                    a = rand.nextInt(20) + 31; // 31–50
                    b = rand.nextInt(20) + 10; // 10–29
                    if (a < b || (a % 10) < (b % 10)) continue;
                    break;

                case 8: // 2 chữ số 31–50 - 2 chữ số, có nhớ
                    a = rand.nextInt(20) + 31;
                    b = rand.nextInt(20) + 10;
                    if (a < b || (a % 10) >= (b % 10)) continue;
                    break;

                case 9: // 2 chữ số 51–70 - 2 chữ số, không nhớ
                    a = rand.nextInt(20) + 51; // 51–70
                    b = rand.nextInt(20) + 10;
                    if (a < b || (a % 10) < (b % 10)) continue;
                    break;

                case 10: // 2 chữ số 51–70 - 2 chữ số, có nhớ
                    a = rand.nextInt(20) + 51;
                    b = rand.nextInt(20) + 10;
                    if (a < b || (a % 10) >= (b % 10)) continue;
                    break;

                case 11: // 2 chữ số 71–90 - 2 chữ số, không nhớ
                    a = rand.nextInt(20) + 71; // 71–90
                    b = rand.nextInt(20) + 10;
                    if (a < b || (a % 10) < (b % 10)) continue;
                    break;

                case 12: // 2 chữ số 71–90 - 2 chữ số, có nhớ
                    a = rand.nextInt(20) + 71;
                    b = rand.nextInt(20) + 10;
                    if (a < b || (a % 10) >= (b % 10)) continue;
                    break;

                case 13: // 2 chữ số 91–100 - 2 chữ số, có nhớ
                    a = rand.nextInt(10) + 91; // 91–100
                    b = rand.nextInt(20) + 10; // 10–29
                    if (a < b || (a % 10) >= (b % 10)) continue;
                    break;
            }

            problems.add(String.format("%3d  - %3d  =", a, b));
        }

        return problems;
    }
}