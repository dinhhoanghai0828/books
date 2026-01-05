package books.baitap.phep_cong.cong_hang_doc;

import books.baitap.utils.BaiTapUtils;
import org.apache.poi.xwpf.usermodel.BreakType;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class CongCapDo9 {

    public static void main(String[] args) throws IOException {
        XWPFDocument document = new XWPFDocument();
        FileOutputStream out = new FileOutputStream("CongCapDo9_HangDoc.docx");

        generateAdditionExercises(
                document,
                "Bài tập: Cộng 2 số trong phạm vi 100 (có nhớ và không nhớ, trình bày theo cột dọc)",
                240
        );

        document.write(out);
        out.close();
        document.close();

        System.out.println("✅ Đã tạo xong file Word: CongCapDo9_HangDoc.docx");
    }

    private static void generateAdditionExercises(XWPFDocument doc, String title, int totalCount) {
        List<String> problems = new ArrayList<>();
        Random rand = new Random();

        while (problems.size() < totalCount) {
            int a = rand.nextInt(90) + 10; // 10–99
            int b = rand.nextInt(90) + 10; // 10–99

            // tổng không vượt 100
            if (a + b > 100) continue;

            int unitSum = (a % 10) + (b % 10);
            boolean wantCarry = rand.nextBoolean(); // trộn có nhớ / không nhớ

            // lọc theo loại phép tính
            if (wantCarry && unitSum < 10) continue;      // muốn có nhớ
            if (!wantCarry && unitSum >= 10) continue;    // muốn không nhớ

            String problem = String.format("%2d + %2d", a, b);
            problems.add(problem);
        }

        // mỗi trang 20 phép tính (hàng dọc)
        int perPage = 20;
        int pageCount = (int) Math.ceil(problems.size() / (double) perPage);

        BaiTapUtils.addTitle(doc, title);

        for (int page = 0; page < pageCount; page++) {
            int from = page * perPage;
            int to = Math.min(from + perPage, problems.size());
            List<String> pageProblems = problems.subList(from, to);

            BaiTapUtils.addVerticalAdditionTable(doc, pageProblems);

            if (page < pageCount - 1) {
                doc.createParagraph().createRun().addBreak(BreakType.PAGE);
            }
        }
    }
}
