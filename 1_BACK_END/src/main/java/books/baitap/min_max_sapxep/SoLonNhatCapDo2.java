package books.baitap.min_max_sapxep;

import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;

import java.io.FileOutputStream;
import java.io.IOException;
import java.util.*;

public class SoLonNhatCapDo2 {
    public static void main(String[] args) throws IOException {
        XWPFDocument document = new XWPFDocument();
        FileOutputStream out = new FileOutputStream("SoLonNhat_CapDo2.docx");

        addExercise(document, "Bài tập: Tìm số lớn nhất - Cấp độ 2", 3, 50, 1000);

        document.write(out);
        out.close();
        document.close();
        System.out.println("✅ Đã tạo file SoLonNhat_CapDo2.docx");
    }

    private static void addExercise(XWPFDocument doc, String title, int doDai, int count, int seed) {
        XWPFParagraph titlePara = doc.createParagraph();
        XWPFRun run = titlePara.createRun();
        run.setText(title);
        run.setBold(true);
        run.setFontFamily("Times New Roman");
        run.setFontSize(18);
        run.addBreak();

        addNumberList(doc, count, doDai, seed);
    }

    private static void addNumberList(XWPFDocument doc, int count, int length, int seed) {
        Random rand = new Random(seed);
        Set<String> generated = new LinkedHashSet<>();
        List<Integer> pool = new ArrayList<>();
        for (int i = 0; i <= 10; i++) pool.add(i);

        while (generated.size() < count) {
            Collections.shuffle(pool, rand);
            List<Integer> digits = pool.subList(0, length);
            String line = String.join("    -    ", digits.stream()
                    .map(Object::toString)
                    .toArray(String[]::new));
            generated.add(line);
        }

        for (String line : generated) {
            XWPFParagraph para = doc.createParagraph();
            para.setSpacingBeforeLines(90);
            para.setSpacingAfterLines(90);
            XWPFRun run = para.createRun();
            run.setFontFamily("Times New Roman");
            run.setFontSize(18);
            run.setText(line);
        }
    }
}
