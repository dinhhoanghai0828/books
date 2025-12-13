package books.baitap.phep_cong.cong_hang_doc;

import books.baitap.utils.BaiTapUtils;
import org.apache.poi.xwpf.usermodel.BreakType;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class CongCapDo6 {
    public static void main(String[] args) throws IOException {
        XWPFDocument document = new XWPFDocument();
        FileOutputStream out = new FileOutputStream("CongCapDo6_HangDoc.docx");

        generateAdditionExercises(document,
                "Bài tập: Cộng 2 số có 2 chữ số (10–20), tổng ≥ 30, có nhớ theo cột dọc",
                240);

        document.write(out);
        out.close();
        document.close();
        System.out.println("✅ Đã tạo xong file Word: CongCapDo6_HangDoc.docx");
    }

    private static void generateAdditionExercises(XWPFDocument doc, String title, int totalCount) {
        List<String> problems = new ArrayList<>();
        Random rand = new Random();

        while (problems.size() < totalCount) {
            int a = rand.nextInt(10) + 10; // số từ 10 đến 19
            int b = rand.nextInt(10) + 10; // số từ 10 đến 19

            // chỉ lấy khi tổng >= 30 → có nhớ
            if (a + b < 30) continue;

            String problem = String.format("%2s + %2s =", a, b);
            problems.add(problem);
        }

        // Mỗi trang 20 phép tính (hàng dọc chiếm nhiều chỗ hơn)
        int perPage = 20;
        int pageCount = (int) Math.ceil(problems.size() / (double) perPage);

        BaiTapUtils.addTitle(doc, title);

        for (int page = 0; page < pageCount; page++) {
            int from = page * perPage;
            int to = Math.min(from + perPage, problems.size());
            List<String> pageProblems = problems.subList(from, to);

            // Dạng trình bày hàng dọc
            BaiTapUtils.addVerticalAdditionTable(doc, pageProblems);

            if (page < pageCount - 1) {
                doc.createParagraph().createRun().addBreak(BreakType.PAGE);
            }
        }
    }
}
