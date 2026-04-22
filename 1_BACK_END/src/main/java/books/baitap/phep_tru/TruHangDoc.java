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
//        generate(1, "TruCapDo1_HangDoc.docx", "1 chữ số - 1 chữ số (không nhớ)", 240);
//        generate(2, "TruCapDo2_HangDoc.docx", "1 chữ số - 1 chữ số (có nhớ)", 240);
//        generate(3, "TruCapDo3_HangDoc.docx", "2 chữ số ≤ 20 - 1 chữ số (không nhớ)", 240);
//        generate(4, "TruCapDo4_HangDoc.docx", "2 chữ số ≤ 20 - 1 chữ số (có nhớ)", 240);
//        generate(5, "TruCapDo5_HangDoc.docx", "2 chữ số 20–30 - 1 chữ số (không nhớ)", 240);
//        generate(6, "TruCapDo6_HangDoc.docx", "2 chữ số 20–30 - 1 chữ số (có nhớ)", 240);
//        generate(7, "TruCapDo7_HangDoc.docx", "2 chữ số 31–50 - 2 chữ số (không nhớ)", 240);
//        generate(8, "TruCapDo8_HangDoc.docx", "2 chữ số 31–50 - 2 chữ số (có nhớ)", 240);
//        generate(9, "TruCapDo9_HangDoc.docx", "2 chữ số 51–70 - 2 chữ số (không nhớ)", 240);
//        generate(10, "TruCapDo10_HangDoc.docx", "2 chữ số 51–70 - 2 chữ số (có nhớ)", 240);
//        generate(11, "TruCapDo11_HangDoc.docx", "2 chữ số 71–90 - 2 chữ số (không nhớ)", 240);
//        generate(12, "TruCapDo12_HangDoc.docx", "2 chữ số 71–90 - 2 chữ số (có nhớ)", 240);
//        generate(13, "TruCapDo13_HangDoc.docx", "2 chữ số 91–100 - 2 chữ số (có nhớ)", 240);
        // Tổng hợp
        generate(14, "TruTongHop_HangDoc.docx", "Tổng hợp phép trừ ≤100 (có nhớ + không nhớ)", 240);
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
//                case 14: // Tổng hợp ≤100 (có nhớ + không nhớ)
//                    a = rand.nextInt(100) + 1; // 1–100
//                    b = rand.nextInt(100);     // 0–99
//
//                    if (a < b) continue; // không âm
//                    break;
                case 14:
                    a = rand.nextInt(100) + 1;
                    b = rand.nextInt(100);

                    if (a < b) continue;

                    boolean wantBorrow = rand.nextBoolean(); // random 2 dạng

                    if (wantBorrow) {
                        if ((a % 10) >= (b % 10)) continue; // ép có nhớ
                    } else {
                        if ((a % 10) < (b % 10)) continue; // ép không nhớ
                    }
                    break;

            }

            problems.add(String.format("%3d  - %2d  =", a, b));
        }

        return problems;
    }
}