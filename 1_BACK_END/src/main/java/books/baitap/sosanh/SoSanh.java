package books.baitap.sosanh;

import org.apache.poi.xwpf.usermodel.*;

import java.io.FileOutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class SoSanh {
    private static final Random RANDOM = new Random();

    public static void main(String[] args) throws Exception {
        List<String> problems = generateProblems(200);
        createWordFile(problems, "BaiTapToanLop1.docx");
        System.out.println("Đã tạo file Word thành công!");
    }

    private static List<String> generateProblems(int total) {
        List<String> list = new ArrayList<>();

        for (int i = 0; i < total; i++) {
            int type = RANDOM.nextInt(5);

            int a = rand();
            int b = rand();
            int c = rand();

            switch (type) {
                case 0:
                    list.add(a + " + … < " + b + " + " + c);
                    break;
                case 1:
                    list.add(a + " + … > " + b + " + " + c);
                    break;
                case 2:
                    list.add(a + " + " + b + " = " + c + " + …");
                    break;
                case 3:
                    list.add(a + " + " + b + " > " + c + " + …");
                    break;
                case 4:
                    list.add(a + " + " + b + " < " + c + " + …");
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

                // tăng chiều cao dòng (khoảng cách dọc)
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

                col++;
            }
            document.write(out);
        }
    }
}
