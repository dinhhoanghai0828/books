package books.baitap.sosanh;

import org.apache.poi.xwpf.usermodel.*;

import java.io.FileOutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class SoSanh {
    private static final Random RANDOM = new Random();

    public static void main(String[] args) throws Exception {
        List<String> problems = generateProblems(300);
        createWordFile(problems, "SoSanh.docx");
        System.out.println("Đã tạo file Word thành công!");
    }

    private static final String GAP = "   ";

    private static List<String> generateProblems(int total) {
        List<String> list = new ArrayList<>();

        for (int i = 0; i < total; i++) {
            int type = RANDOM.nextInt(5);

            int a = rand();
            int b = rand();
            int c = rand();

            int missing;

            switch (type) {
                // a + x < b + c
                case 0:
                    int right0 = b + c;
                    if (right0 == 0) { i--; continue; }
                    missing = RANDOM.nextInt(right0); // x < right0
                    list.add(a + GAP + "+" + GAP + "…" + GAP + "<" + GAP + b + GAP + "+" + GAP + c);
                    break;

                // a + x > b + c
                case 1:
                    int right1 = b + c;
                    missing = right1 + 1 + RANDOM.nextInt(9);
                    list.add(a + GAP + "+" + GAP + "…" + GAP + ">" + GAP + b + GAP + "+" + GAP + c);
                    break;

                // a + b = c + x
                case 2:
                    int left2 = a + b;
                    if (left2 < c) { i--; continue; }
                    missing = left2 - c;
                    list.add(a + GAP + "+" + GAP + b + GAP + "=" + GAP + c + GAP + "+" + GAP + "…");
                    break;

                // a + b > c + x
                case 3:
                    int left3 = a + b;
                    if (left3 == 0) { i--; continue; }
                    missing = RANDOM.nextInt(left3);
                    list.add(a + GAP + "+" + GAP + b + GAP + ">" + GAP + c + GAP + "+" + GAP + "…");
                    break;

                // a + b < c + x
                case 4:
                    int left4 = a + b;
                    missing = left4 + 1 + RANDOM.nextInt(9);
                    list.add(a + GAP + "+" + GAP + b + GAP + "<" + GAP + c + GAP + "+" + GAP + "…");
                    break;
            }
        }
        return list;
    }

    private static int rand() {
        return RANDOM.nextInt(10); // 0 -> 9
    }

    private static void createWordFile(List<String> problems, String fileName) throws Exception {
        try (XWPFDocument document = new XWPFDocument();
             FileOutputStream out = new FileOutputStream(fileName)) {

            // Title
            XWPFParagraph title = document.createParagraph();
            title.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun titleRun = title.createRun();
            titleRun.setText("BÀI TẬP ĐIỀN SỐ LỚP 1");
            titleRun.setBold(true);
            titleRun.setFontSize(20);
            titleRun.setFontFamily("Times New Roman");

            // Table 2 columns full width
            XWPFTable table = document.createTable(1, 2);
            table.setWidth("100%");

            int col = 0;
            XWPFTableRow row = table.getRow(0);

            for (String problem : problems) {

                if (col == 2) {
                    row = table.createRow();
                    col = 0;
                }

                XWPFTableCell cell = row.getCell(col);

                // tăng chiều cao dòng
                row.setHeight(900);

                XWPFParagraph p = cell.getParagraphs().get(0);
                p.setAlignment(ParagraphAlignment.CENTER);

                // giãn dòng
                p.setSpacingBefore(200);
                p.setSpacingAfter(200);
                p.setSpacingBetween(1.5);

                XWPFRun run = p.createRun();
                run.setText(problem);
                run.setFontSize(18);
                run.setFontFamily("Times New Roman");

                col++;
            }

            document.write(out);
        }
    }
}
