package books.baitap.tong_hop;

import books.baitap.utils.BaiTapUtils;
import org.apache.poi.xwpf.usermodel.BreakType;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class CongTruPhamVi100 {
    public static void main(String[] args) throws IOException {
        XWPFDocument document = new XWPFDocument();
        FileOutputStream out = new FileOutputStream("CongTruPhamVi100.docx");

        generateExercises(document, "Bài tập: Cộng trừ 2 số có 2 chữ số (≤100)", 240);

        document.write(out);
        out.close();
        document.close();
        System.out.println("✅ Đã tạo xong file Word: CongTruPhamVi100.docx");
    }

    private static void generateExercises(XWPFDocument doc, String title, int totalCount) {
        List<String> problems = new ArrayList<>();
        Random rand = new Random();

        while (problems.size() < totalCount) {
            int a = rand.nextInt(90) + 10; // số từ 10 đến 99
            int b = rand.nextInt(90) + 10; // số từ 10 đến 99

            String problem;
            if (rand.nextBoolean()) {
                // phép cộng
                if (a + b > 100) continue;
                problem = String.format("%2d + %2d =", a, b);
            } else {
                // phép trừ
                if (a - b < 0) continue;
                problem = String.format("%2d - %2d =", a, b);
            }
            problems.add(problem);
        }

        int perPage = 24;
        int pageCount = (int) Math.ceil(problems.size() / (double) perPage);
        BaiTapUtils.addTitle(doc, title);
        for (int page = 0; page < pageCount; page++) {
            int from = page * perPage;
            int to = Math.min(from + perPage, problems.size());
            List<String> pageProblems = problems.subList(from, to);

            BaiTapUtils.addProblemsTable(doc, pageProblems);

            if (page < pageCount - 1) {
                doc.createParagraph().createRun().addBreak(BreakType.PAGE);
            }
        }
    }
}
