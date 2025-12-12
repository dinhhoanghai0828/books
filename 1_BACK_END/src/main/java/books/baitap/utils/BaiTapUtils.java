package books.baitap.utils;

import org.apache.poi.xwpf.usermodel.*;

import java.math.BigInteger;
import java.util.List;

public class BaiTapUtils {

    public static void addTitle(XWPFDocument doc, String title) {
        XWPFParagraph titlePara = doc.createParagraph();
        titlePara.setAlignment(ParagraphAlignment.CENTER);
        titlePara.setSpacingAfterLines(40);

        XWPFRun run = titlePara.createRun();
        run.setText(title);
        run.setBold(true);
        run.setFontFamily("Times New Roman");
        run.setFontSize(20);
        run.addBreak();
    }

    public static void addProblemsTable(XWPFDocument doc, List<String> problems) {
        int rows = (int) Math.ceil(problems.size() / 2.0);
        XWPFTable table = doc.createTable(rows, 2);
        table.removeBorders();
        table.setWidth("100%");
        table.setTableAlignment(TableRowAlign.CENTER);
        table.setWidth("100%");

        for (int i = 0; i < rows; i++) {
            XWPFTableRow row = table.getRow(i);
            for (int j = 0; j < 2; j++) {
                XWPFTableCell cell = row.getCell(j);
                cell.getCTTc().addNewTcPr().addNewTcW().setW(BigInteger.valueOf(5000));
            }
        }

        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < 2; j++) {
                int index = i + j * rows;
                if (index < problems.size()) {
                    XWPFTableCell cell = table.getRow(i).getCell(j);
                    XWPFParagraph para = cell.getParagraphs().get(0);
                    para.setSpacingBeforeLines(90);
                    para.setSpacingAfterLines(90);
                    XWPFRun run = para.createRun();
                    run.setBold(true);
//                    run.setFontFamily("Times New Roman");
                    run.setFontFamily("Courier New");
                    run.setFontSize(18);
                    run.setText(problems.get(index));
                }
            }
        }
    }

    // ✅ Phiên bản mới: in phép cộng 4 cột, cách đều, không bị chia trang
    public static void addVerticalAdditionTable(XWPFDocument doc, List<String> problems) {
        int total = problems.size();
        int columns = 4;
        int rowsPerPage = 5; // số dòng tối đa mỗi trang
        int totalRows = (int) Math.ceil(total / (double) columns);

        for (int pageStartRow = 0; pageStartRow < totalRows; pageStartRow += rowsPerPage) {
            int pageEndRow = Math.min(pageStartRow + rowsPerPage, totalRows);
            int pageRowCount = pageEndRow - pageStartRow;

            XWPFTable table = doc.createTable(pageRowCount, columns);
            table.removeBorders();
            table.setWidth("100%");
            table.setTableAlignment(TableRowAlign.CENTER);

            BigInteger colWidth = BigInteger.valueOf(2500);
            for (int i = 0; i < pageRowCount; i++) {
                XWPFTableRow row = table.getRow(i);
                for (int j = 0; j < columns; j++) {
                    row.getCell(j).getCTTc().addNewTcPr().addNewTcW().setW(colWidth);
                }
            }

            for (int i = 0; i < pageRowCount * columns; i++) {
                int problemIndex = pageStartRow * columns + i;
                if (problemIndex >= total) break;

                int rowIndex = i / columns;
                int colIndex = i % columns;
                String problem = problems.get(problemIndex);
                String[] parts = problem.replace("=", "").split("\\+");
                String a = parts[0].trim();
                String b = parts[1].trim();

                XWPFTableCell cell = table.getRow(rowIndex).getCell(colIndex);
                cell.removeParagraph(0);

                // --- Dòng 1: số trên ---
                XWPFParagraph para1 = cell.addParagraph();
                para1.setAlignment(ParagraphAlignment.CENTER);
                para1.setSpacingBeforeLines(30);
                XWPFRun run1 = para1.createRun();
                run1.setFontFamily("Courier New");
                run1.setFontSize(18);
                run1.setText(String.format("%4s", a));

                // --- Dòng 2: số dưới ---
                XWPFParagraph para2 = cell.addParagraph();
                para2.setAlignment(ParagraphAlignment.CENTER);
                para2.setSpacingAfter(0);       // ✅ bỏ khoảng cách theo đơn vị point
                para2.setSpacingAfterLines(0);  // ✅ bỏ khoảng cách theo dòng (dự phòng)

                XWPFRun run2 = para2.createRun();
                run2.setFontFamily("Courier New");
                run2.setFontSize(18);
                run2.setText(String.format("+%3s", b));

                // --- Dòng 3: gạch ngang ---
                XWPFParagraph para3 = cell.addParagraph();
                para3.setAlignment(ParagraphAlignment.CENTER);
                para3.setSpacingBetween(0.2);  // ✅ bỏ khoảng cách theo dòng (dự phòng)
                para3.setSpacingAfterLines(400); // ✅ chỉ tạo khoảng trống dưới dấu gạch
                XWPFRun run3 = para3.createRun();
                run3.setFontFamily("Courier New");
                run3.setFontSize(18);
                run3.setText("_____");
            }

            if (pageEndRow < totalRows) {
                XWPFParagraph pageBreak = doc.createParagraph();
                pageBreak.setPageBreak(true);
            }
        }
    }

    public static void addVerticalSubtractTable(XWPFDocument doc, List<String> problems) {
        int total = problems.size();
        int columns = 4;
        int rowsPerPage = 5; // số dòng tối đa mỗi trang
        int totalRows = (int) Math.ceil(total / (double) columns);

        for (int pageStartRow = 0; pageStartRow < totalRows; pageStartRow += rowsPerPage) {
            int pageEndRow = Math.min(pageStartRow + rowsPerPage, totalRows);
            int pageRowCount = pageEndRow - pageStartRow;

            XWPFTable table = doc.createTable(pageRowCount, columns);
            table.removeBorders();
            table.setWidth("100%");
            table.setTableAlignment(TableRowAlign.CENTER);

            BigInteger colWidth = BigInteger.valueOf(2500);
            for (int i = 0; i < pageRowCount; i++) {
                XWPFTableRow row = table.getRow(i);
                for (int j = 0; j < columns; j++) {
                    row.getCell(j).getCTTc().addNewTcPr().addNewTcW().setW(colWidth);
                }
            }

            for (int i = 0; i < pageRowCount * columns; i++) {
                int problemIndex = pageStartRow * columns + i;
                if (problemIndex >= total) break;

                int rowIndex = i / columns;
                int colIndex = i % columns;
                String problem = problems.get(problemIndex);
                String[] parts = problem.replace("=", "").split("\\-");
                String a = parts[0].trim();
                String b = parts[1].trim();

                XWPFTableCell cell = table.getRow(rowIndex).getCell(colIndex);
                cell.removeParagraph(0);

                // --- Dòng 1: số trên ---
                XWPFParagraph para1 = cell.addParagraph();
                para1.setAlignment(ParagraphAlignment.CENTER);
                para1.setSpacingBeforeLines(30);
                XWPFRun run1 = para1.createRun();
                run1.setFontFamily("Courier New");
                run1.setFontSize(18);
                run1.setText(String.format("%4s", a));

                // --- Dòng 2: số dưới ---
                XWPFParagraph para2 = cell.addParagraph();
                para2.setAlignment(ParagraphAlignment.CENTER);
                para2.setSpacingAfter(0);       // ✅ bỏ khoảng cách theo đơn vị point
                para2.setSpacingAfterLines(0);  // ✅ bỏ khoảng cách theo dòng (dự phòng)

                XWPFRun run2 = para2.createRun();
                run2.setFontFamily("Courier New");
                run2.setFontSize(18);
                run2.setText(String.format("-%3s", b));

                // --- Dòng 3: gạch ngang ---
                XWPFParagraph para3 = cell.addParagraph();
                para3.setAlignment(ParagraphAlignment.CENTER);
                para3.setSpacingBetween(0.2);  // ✅ bỏ khoảng cách theo dòng (dự phòng)
                para3.setSpacingAfterLines(400); // ✅ chỉ tạo khoảng trống dưới dấu gạch
                XWPFRun run3 = para3.createRun();
                run3.setFontFamily("Courier New");
                run3.setFontSize(18);
                run3.setText("_____");
            }

            if (pageEndRow < totalRows) {
                XWPFParagraph pageBreak = doc.createParagraph();
                pageBreak.setPageBreak(true);
            }
        }
    }

}