package books.baitap;

import org.apache.poi.xwpf.usermodel.Borders;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;

import java.io.FileOutputStream;
import java.io.IOException;
import java.util.*;

public class ExportExerciseToWord {
    public static void main(String[] args) throws IOException {
        XWPFDocument document = new XWPFDocument();
        FileOutputStream out = new FileOutputStream("BaiTapSoLonBeNhat.docx");

        addExercise(document, "Bài tập: Tìm số lớn nhất", 0);
        addExercise(document, "Bài tập: Tìm số bé nhất", 10000);

        document.write(out);
        out.close();
        document.close();
        System.out.println("✅ Đã tạo xong file Word: BaiTapSoLonBeNhat.docx");
    }

    private static void addExercise(XWPFDocument doc, String title, int seedOffset) {
        XWPFParagraph titlePara = doc.createParagraph();
        titlePara.setSpacingAfterLines(40);
        XWPFRun run = titlePara.createRun();
        run.setText(title);
        run.setBold(true);
        run.setFontFamily("Times New Roman");
        run.setFontSize(18);
        run.addBreak();

        addNumberList(doc, 50, 2, seedOffset);
        addHorizontalLine(doc);

        addNumberList(doc, 50, 3, seedOffset + 1000);
        addHorizontalLine(doc);

        addNumberList(doc, 20, 4, seedOffset + 2000);
        addHorizontalLine(doc);

        addNumberList(doc, 20, 5, seedOffset + 3000);
        addHorizontalLine(doc);

        addNumberList(doc, 20, 6, seedOffset + 4000);
        addHorizontalLine(doc);
    }

    private static void addHorizontalLine(XWPFDocument doc) {
        XWPFParagraph para = doc.createParagraph();
        para.setBorderBottom(Borders.SINGLE);
        para.setSpacingAfter(200);
        XWPFRun run = para.createRun();
        run.setText("");  // để hiện border
    }

    private static void addNumberList(XWPFDocument doc, int count, int length, int seed) {
        Random rand = new Random(seed);
        Set<String> generated = new LinkedHashSet<>();
        List<Integer> pool = new ArrayList<>();
        for (int i = 0; i <= 10; i++) pool.add(i);

        while (generated.size() < count) {
            Collections.shuffle(pool, rand);
            List<Integer> digits = pool.subList(0, length);
            String line = String.join("    -    ", digits.stream().map(Object::toString).toArray(String[]::new));
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
