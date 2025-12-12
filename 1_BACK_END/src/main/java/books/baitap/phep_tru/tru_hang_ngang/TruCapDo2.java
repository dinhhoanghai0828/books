package books.baitap.phep_tru.tru_hang_ngang;

import books.baitap.utils.BaiTapUtils;
import org.apache.poi.xwpf.usermodel.BreakType;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class TruCapDo2 {
    public static void main(String[] args) throws IOException {
        XWPFDocument document = new XWPFDocument();
        FileOutputStream out = new FileOutputStream("TruCapDo2.docx");

        generateSubtractionExercises(document, "Bài tập: Phép trừ số có 2 chữ số với số có 1 chữ số (có nhớ)", 240);

        document.write(out);
        out.close();
        document.close();
        System.out.println("✅ Đã tạo xong file Word: TruCapDo2.docx");
    }

    private static void generateSubtractionExercises(XWPFDocument doc, String title, int totalCount) {
        List<String> problems = new ArrayList<>();
        Random rand = new Random();

        while (problems.size() < totalCount) {
            int a = rand.nextInt(11) + 10;   // số bị trừ từ 10 đến 20
            int b = rand.nextInt(9) + 1;     // số trừ từ 1 đến 9

            // chỉ lấy phép trừ có nhớ => hàng đơn vị a < hàng đơn vị b
            if ((a % 10) >= (b % 10)) {
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