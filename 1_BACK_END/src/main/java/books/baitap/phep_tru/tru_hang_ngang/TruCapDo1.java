package books.baitap.phep_tru.tru_hang_ngang;

import books.baitap.utils.BaiTapUtils;
import org.apache.poi.xwpf.usermodel.BreakType;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class TruCapDo1 {
    public static void main(String[] args) throws IOException {
        XWPFDocument document = new XWPFDocument();
        FileOutputStream out = new FileOutputStream("TruCapDo1.docx");

        generateSubtractionExercises(document, "Bài tập: Phép trừ 2 số có 1 chữ số", 240);

        document.write(out);
        out.close();
        document.close();
        System.out.println("✅ Đã tạo xong file Word: TruCapDo1.docx");
    }

    private static void generateSubtractionExercises(XWPFDocument doc, String title, int totalCount) {
        List<String> problems = new ArrayList<>();
        Random rand = new Random();

        while (problems.size() < totalCount) {
            int a = rand.nextInt(10) + 1;       // a từ 1 đến 10
            int b = rand.nextInt(a + 1);        // b từ 0 đến a, đảm bảo a - b ≥ 0

            // Bỏ trường hợp b = 0 và a = b
            if (b == 0 || a == b) {
                continue;
            }

            String problem = String.format("%2s  - %2s  =", a, b);
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
