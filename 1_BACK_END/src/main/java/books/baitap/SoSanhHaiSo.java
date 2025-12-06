package books.baitap;

import org.apache.poi.xwpf.usermodel.*;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.*;

import java.io.FileOutputStream;
import java.io.IOException;
import java.math.BigInteger;
import java.util.Random;

public class SoSanhHaiSo {
    public static void main(String[] args) throws IOException {
        XWPFDocument document = new XWPFDocument();
        FileOutputStream out = new FileOutputStream("SoSanhHaiSo.docx");

        addTitle(document, "Bài tập: So sánh hai số (tick vào ô đúng)");

        addComparisonTable(document, 200);

        document.write(out);
        out.close();
        document.close();

        System.out.println("✅ Đã tạo xong file Word: SoSanhHaiSo_InsideBorder.docx");
    }

    private static void addTitle(XWPFDocument doc, String title) {
        XWPFParagraph para = doc.createParagraph();
        para.setAlignment(ParagraphAlignment.LEFT);
        XWPFRun run = para.createRun();
        run.setBold(true);
        run.setFontFamily("Times New Roman");
        run.setFontSize(18);
        run.setText(title);
        run.addBreak();
    }

    private static void addComparisonTable(XWPFDocument doc, int totalQuestions) {
        Random rand = new Random();
        int rows = totalQuestions / 2;

        XWPFTable table = doc.createTable(rows, 2);
        setTableBorders(table, true, false); // inside = true, outside = false
        table.setWidth("100%");

        for (int i = 0; i < rows; i++) {
            int a1 = rand.nextInt(11); // 0-10
            int b1 = rand.nextInt(11);
            int a2 = rand.nextInt(11);
            int b2 = rand.nextInt(11);

            formatCell(table.getRow(i).getCell(0), a1, b1, 5000);
            formatCell(table.getRow(i).getCell(1), a2, b2, 5000);
        }
    }

    private static void formatCell(XWPFTableCell cell, int a, int b, int widthTwips) {
        CTTc ctTc = cell.getCTTc();
        CTTcPr tcPr = ctTc.isSetTcPr() ? ctTc.getTcPr() : ctTc.addNewTcPr();
        CTTblWidth cellWidth = tcPr.isSetTcW() ? tcPr.getTcW() : tcPr.addNewTcW();
        cellWidth.setType(STTblWidth.DXA);
        cellWidth.setW(BigInteger.valueOf(widthTwips));

        cell.setVerticalAlignment(XWPFTableCell.XWPFVertAlign.CENTER);

        XWPFParagraph para = cell.getParagraphs().get(0);
        para.setAlignment(ParagraphAlignment.CENTER);
        para.setSpacingBeforeLines(80);
        para.setSpacingAfterLines(80);

        String font = "Times New Roman";

        // Số bên trái
        XWPFRun run1 = para.createRun();
        run1.setFontFamily(font);
        run1.setFontSize(21);
        run1.setText(String.format("%2d", a) + "   ");

        // Checkbox – riêng font size và hạ thấp vị trí
        XWPFRun runBox = para.createRun();
        runBox.setFontFamily(font);
        runBox.setFontSize(30);
        runBox.setText("☐");
        runBox.setTextPosition(-4); // ✅ đẩy checkbox xuống gần bằng baseline số

        // Số bên phải
        XWPFRun run2 = para.createRun();
        run2.setFontFamily(font);
        run2.setFontSize(21);
        run2.setText("   " + String.format("%2d", b));
    }


    private static void setTableBorders(XWPFTable table, boolean inside, boolean outside) {
        CTTblPr tblPr = table.getCTTbl().getTblPr();
        if (tblPr == null) tblPr = table.getCTTbl().addNewTblPr();
        CTTblBorders borders = tblPr.isSetTblBorders() ? tblPr.getTblBorders() : tblPr.addNewTblBorders();

        if (inside) {
            borders.addNewInsideH().setVal(STBorder.SINGLE);
            borders.addNewInsideV().setVal(STBorder.SINGLE);
        } else {
            borders.addNewInsideH().setVal(STBorder.NONE);
            borders.addNewInsideV().setVal(STBorder.NONE);
        }

        if (outside) {
            borders.addNewTop().setVal(STBorder.SINGLE);
            borders.addNewBottom().setVal(STBorder.SINGLE);
            borders.addNewLeft().setVal(STBorder.SINGLE);
            borders.addNewRight().setVal(STBorder.SINGLE);
        } else {
            borders.addNewTop().setVal(STBorder.NONE);
            borders.addNewBottom().setVal(STBorder.NONE);
            borders.addNewLeft().setVal(STBorder.NONE);
            borders.addNewRight().setVal(STBorder.NONE);
        }
    }
}
