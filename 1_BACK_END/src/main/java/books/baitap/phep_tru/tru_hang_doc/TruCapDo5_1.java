package books.baitap.phep_tru.tru_hang_doc;

import books.baitap.utils.BaiTapUtils;
import org.apache.poi.xwpf.usermodel.BreakType;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class TruCapDo5_1 {
    public static void main(String[] args) throws IOException {
        XWPFDocument document = new XWPFDocument();
        FileOutputStream out = new FileOutputStream("TruCapDo5_HangDoc.docx");

        generateSubtractionExercises(document,
                "Bài tập: Trừ 2 số (số thứ 1 từ 20–30, số thứ 2 từ 1–9), có nhớ theo cột dọc",
                240);

        document.write(out);
        out.close();
        document.close();
        System.out.println("✅ Đã tạo xong file Word: TruCapDo5_HangDoc.docx");
    }

    private static void generateSubtractionExercises(XWPFDocument doc, String title, int totalCount) {
        List<String> problems = new ArrayList<>();
        Random rand = new Random();

        while (problems.size() < totalCount) {
            int a = rand.nextInt(11) + 20; // số thứ 1: 20 → 30
            int b = rand.nextInt(9) + 1;   // số thứ 2: 1 → 9

            // chỉ lấy phép trừ có nhớ (hàng đơn vị của a < b)
            if ((a % 10) >= (b % 10)) continue;

            String problem = String.format("%2s - %2s =", a, b);
            problems.add(problem);
        }

        // mỗi trang có 20 phép trừ
        int perPage = 20;
        int pageCount = (int) Math.ceil(problems.size() / (double) perPage);

        BaiTapUtils.addTitle(doc, title);
        for (int page = 0; page < pageCount; page++) {
            int from = page * perPage;
            int to = Math.min(from + perPage, problems.size());
            List<String> pageProblems = problems.subList(from, to);

            // bảng phép trừ cột dọc
            BaiTapUtils.addVerticalSubtractTable(doc, pageProblems);

            if (page < pageCount - 1) {
                doc.createParagraph().createRun().addBreak(BreakType.PAGE);
            }
        }
    }
}
