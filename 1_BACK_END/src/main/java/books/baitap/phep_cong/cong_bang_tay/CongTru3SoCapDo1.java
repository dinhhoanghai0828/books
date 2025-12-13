package books.baitap.phep_cong.cong_bang_tay;

import books.baitap.utils.BaiTapUtils3So;
import org.apache.poi.xwpf.usermodel.BreakType;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class CongTru3SoCapDo1 {
    public static void main(String[] args) throws IOException {
        XWPFDocument document = new XWPFDocument();
        FileOutputStream out = new FileOutputStream("BaiTapCongTru3So.docx");

        generateCarryBorrowExercises(document, "Bài tập: Cộng – trừ 3 số (luôn có nhớ/mượn)", 240);

        document.write(out);
        out.close();
        document.close();
        System.out.println("✅ Đã tạo xong file Word: BaiTapCongTru3So.docx");
    }

    /**
     * Sinh bài tập cộng/trừ 3 số:
     *  - Không phép trừ nào cho kết quả âm.
     *  - Ít nhất một bước cộng > 10 (có nhớ) hoặc trừ phải mượn.
     */
    private static void generateCarryBorrowExercises(XWPFDocument doc, String title, int totalCount) {
        List<String> problems = new ArrayList<>();
        Random rand = new Random();

        while (problems.size() < totalCount) {
            int a = rand.nextInt(10) + 1; // 1..10

            // Sinh phép 1
            boolean op1Minus = rand.nextBoolean();
            int b;
            if (op1Minus) {
                b = rand.nextInt(a) + 1; // 1..a để không âm
            } else {
                b = rand.nextInt(10) + 1;
            }
            int r1 = op1Minus ? a - b : a + b;

            // Sinh phép 2
            boolean op2Minus = rand.nextBoolean();
            int c;
            if (op2Minus) {
                if (r1 == 0) {
                    op2Minus = false;           // 0 không thể trừ
                    c = rand.nextInt(10) + 1;
                } else {
                    int maxC = Math.min(10, r1);
                    c = rand.nextInt(maxC) + 1; // 1..r1
                }
            } else {
                c = rand.nextInt(10) + 1;
            }

            // Kiểm tra điều kiện có nhớ / mượn
            boolean step1CarryBorrow = (!op1Minus && (a + b) >= 10) || (op1Minus && a < b);
            boolean step2CarryBorrow = (!op2Minus && (r1 + c) >= 10) || (op2Minus && r1 < c);

            if (step1CarryBorrow || step2CarryBorrow) {
                String op1 = op1Minus ? "-" : "+";
                String op2 = op2Minus ? "-" : "+";
                String problem = String.format("%2s  %s %2s  %s %2s  =", a, op1, b, op2, c);
                problems.add(problem);
            }
            // Nếu chưa đạt điều kiện, while lặp và sinh lại
        }

        // Ghi ra Word
        int perPage = 24;
        int pageCount = (int) Math.ceil(problems.size() / (double) perPage);
        BaiTapUtils3So.addTitle(doc, title);

        for (int page = 0; page < pageCount; page++) {
            int from = page * perPage;
            int to = Math.min(from + perPage, problems.size());
            List<String> pageProblems = problems.subList(from, to);

            BaiTapUtils3So.addProblemsTable(doc, pageProblems);

            if (page < pageCount - 1) {
                doc.createParagraph().createRun().addBreak(BreakType.PAGE);
            }
        }
    }
}
