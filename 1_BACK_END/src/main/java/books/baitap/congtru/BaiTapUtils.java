package books.baitap.congtru;

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
                    para.setSpacingBeforeLines(110);
                    para.setSpacingAfterLines(110);
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
}