package books.baitap.phep_tru.tru_hang_doc;

import books.baitap.utils.BaiTapUtils;
import org.apache.poi.xwpf.usermodel.BreakType;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class TruCapDo6 {
    public static void main(String[] args) throws IOException {
        XWPFDocument document = new XWPFDocument();
        FileOutputStream out = new FileOutputStream("TruCapDo6_HangDoc.docx");

        generateSubtractionExercises(document,
                "Bài tập: Phép trừ 2 số có 2 chữ số trong phạm vi 30 (không nhớ) – Dạng cột dọc",
                240);

        document.write(out);
        out.close();
        document.close();
        System.out.println("✅ Đã tạo xong file Word: TruCapDo6_HangDoc.docx");
    }

    private static void generateSubtractionExercises(XWPFDocument doc, String title, int totalCount) {
        List<String> problems = new ArrayList<>();
        Random rand = new Random();

        while (problems.size() < totalCount) {
            int a = rand.nextInt(21) + 10;   // 10 → 30
            int b = rand.nextInt(21) + 10;   // 10 → 30

            if (a < b) continue;            // đảm bảo không âm
            if ((a % 10) < (b % 10)) continue; // không nhớ

            String problem = String.format("%2s - %2s =", a, b);
            problems.add(problem);
        }

        int perPage = 20; // hàng dọc nên 1 trang ít bài hơn
        int pageCount = (int) Math.ceil(problems.size() / (double) perPage);

        // Tiêu đề
        BaiTapUtils.addTitle(doc, title);

        for (int page = 0; page < pageCount; page++) {
            int from = page * perPage;
            int to = Math.min(from + perPage, problems.size());
            List<String> pageProblems = problems.subList(from, to);

            // bảng trừ hàng dọc
            BaiTapUtils.addVerticalSubtractTable(doc, pageProblems);

            if (page < pageCount - 1) {
                doc.createParagraph().createRun().addBreak(BreakType.PAGE);
            }
        }
    }
}
