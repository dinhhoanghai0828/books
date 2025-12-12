package books.baitap.phep_cong.cong_hang_doc;

import books.baitap.utils.BaiTapUtils;
import org.apache.poi.xwpf.usermodel.BreakType;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class CongCapDo4 {
    public static void main(String[] args) throws IOException {
        XWPFDocument document = new XWPFDocument();
        FileOutputStream out = new FileOutputStream("CongCapDo4_HangDoc.docx");

        generateAdditionExercises(document,
                "Bài tập: Cộng số có 1 chữ số và số có 2 chữ số (tổng ≥ 20, đổi vị trí ngẫu nhiên)",
                240);

        document.write(out);
        out.close();
        document.close();
        System.out.println("✅ Đã tạo xong file Word: CongCapDo4_HangDoc.docx");
    }

    private static void generateAdditionExercises(XWPFDocument doc, String title, int totalCount) {
        List<String> problems = new ArrayList<>();
        Random rand = new Random();

        while (problems.size() < totalCount) {
            // ✅ Random đảo vai trò giữa a và b
            boolean swap = rand.nextBoolean();

            int a, b;
            if (swap) {
                // TH1: a = 10–20, b = 1–9
                a = rand.nextInt(10) + 10;
                b = rand.nextInt(9) + 1;
            } else {
                // TH2: a = 1–9, b = 10–20
                a = rand.nextInt(9) + 1;
                b = rand.nextInt(10) + 10;
            }

            // ✅ Giữ điều kiện tổng ≥ 20
            if (a + b < 20) continue;

            String problem = String.format("%2s + %2s =", a, b);
            problems.add(problem);
        }

        // ✅ Mỗi trang có 20 phép tính (dọc)
        int perPage = 20;
        int pageCount = (int) Math.ceil(problems.size() / (double) perPage);

        BaiTapUtils.addTitle(doc, title);

        for (int page = 0; page < pageCount; page++) {
            int from = page * perPage;
            int to = Math.min(from + perPage, problems.size());
            List<String> pageProblems = problems.subList(from, to);

            // ✅ Hiển thị phép cộng theo cột dọc
            BaiTapUtils.addVerticalAdditionTable(doc, pageProblems);

            if (page < pageCount - 1) {
                doc.createParagraph().createRun().addBreak(BreakType.PAGE);
            }
        }
    }
}
