package books.baitap.phep_tru.tru_hang_doc;

import books.baitap.utils.BaiTapUtils;
import org.apache.poi.xwpf.usermodel.BreakType;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class TruCapDo9 {
    public static void main(String[] args) throws IOException {
        XWPFDocument document = new XWPFDocument();
        FileOutputStream out = new FileOutputStream("TruCapDo9_HangDoc.docx");

        generateSubtractionExercises(
                document,
                "Bài tập: Phép trừ 2 số có 2 chữ số trong phạm vi 100 (có nhớ và không nhớ) – Dạng cột dọc",
                240
        );

        document.write(out);
        out.close();
        document.close();

        System.out.println("✅ Đã tạo xong file Word: TruCapDo9_HangDoc.docx");
    }

    private static void generateSubtractionExercises(XWPFDocument doc, String title, int totalCount) {
        List<String> problems = new ArrayList<>();
        Random rand = new Random();

        int coNho = 0;
        int khongNho = 0;

        while (problems.size() < totalCount) {
            int a = rand.nextInt(90) + 10; // 10 → 99
            int b = rand.nextInt(90) + 10;

            if (a < b) continue; // không âm

            boolean isBorrow = (a % 10) < (b % 10);

            // đảm bảo phân bố tương đối đều
            if (isBorrow && coNho > totalCount / 2) continue;
            if (!isBorrow && khongNho > totalCount / 2) continue;

            String problem = String.format("%2d - %2d =", a, b);
            problems.add(problem);

            if (isBorrow) {
                coNho++;
            } else {
                khongNho++;
            }
        }

        // mỗi trang 20 phép tính
        int perPage = 20;
        int pageCount = (int) Math.ceil(problems.size() / (double) perPage);

        BaiTapUtils.addTitle(doc, title);

        for (int page = 0; page < pageCount; page++) {
            int from = page * perPage;
            int to = Math.min(from + perPage, problems.size());

            List<String> pageProblems = problems.subList(from, to);
            BaiTapUtils.addVerticalSubtractTable(doc, pageProblems);

            if (page < pageCount - 1) {
                doc.createParagraph().createRun().addBreak(BreakType.PAGE);
            }
        }
    }
}
