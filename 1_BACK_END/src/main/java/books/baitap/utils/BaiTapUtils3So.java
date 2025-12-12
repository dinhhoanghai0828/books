package books.baitap.utils;

import org.apache.poi.xwpf.usermodel.*;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTPageMar;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTSectPr;

import java.math.BigInteger;
import java.util.List;

public class BaiTapUtils3So {

    // Hàm set lề cho toàn bộ document
    public static void setDocumentMargins(XWPFDocument doc, int left, int right, int top, int bottom) {
        CTSectPr sectPr = doc.getDocument().getBody().isSetSectPr()
                ? doc.getDocument().getBody().getSectPr()
                : doc.getDocument().getBody().addNewSectPr();
        CTPageMar pageMar = sectPr.isSetPgMar() ? sectPr.getPgMar() : sectPr.addNewPgMar();

        pageMar.setLeft(BigInteger.valueOf(left));   // đơn vị: twentieths of a point (1/1440 inch)
        pageMar.setRight(BigInteger.valueOf(right));
        pageMar.setTop(BigInteger.valueOf(top));
        pageMar.setBottom(BigInteger.valueOf(bottom));
    }

    public static void addTitle(XWPFDocument doc, String title) {
        // Set margin toàn bộ file: 1 inch = 1440 twentieths of a point
        setDocumentMargins(doc, 800, 800, 1440, 1440);

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
                    para.setSpacingBeforeLines(100);
                    para.setSpacingAfterLines(100);
                    XWPFRun run = para.createRun();
                    run.setBold(true);
                    run.setFontFamily("Courier New");
                    run.setFontSize(18);
                    run.setText(problems.get(index));
                }
            }
        }
    }
}
