package books.controller;

import books.dto.ContentDTO;
import books.dto.VolumeDTO;
import books.response.VolumeDetailResponse;
import books.response.VolumeResponse;
import books.service.interfaces.VolumeService;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@CrossOrigin("*")
@RequestMapping("/volumes")
public class VolumeController {
    private VolumeService volumeService;

    @Autowired
    public VolumeController(VolumeService volumeService) {
        this.volumeService = volumeService;
    }

    @GetMapping("/list")
    public ResponseEntity<?> getVolumes() {
        try {
            List<VolumeDTO> volumeDTOS = volumeService.getVolumes();
            VolumeResponse response = new VolumeResponse();
            response.setVolumes(volumeDTOS);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{slug}")
    public ResponseEntity<?> getVolumes(@PathVariable("slug") String slug) {
        try {
            VolumeDTO volumeDTO = volumeService.getVolumeDetailBySlug(slug);
            VolumeDetailResponse response = new VolumeDetailResponse();
            response.setVolume(volumeDTO);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/update")
    public ResponseEntity<?> updateVolume(@RequestBody VolumeDTO volumeDTO) {
        try {
            boolean success = volumeService.updateVolume(volumeDTO);
            if (success) {
                return new ResponseEntity<>(HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/mark-as-read/{slug}")
    public ResponseEntity<?> markAsRead(@PathVariable("slug") String slug) {
        try {
            boolean success = volumeService.markAsRead(slug);
            if (success) {
                return new ResponseEntity<>(HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/mark-as-unread/{slug}")
    public ResponseEntity<?> markAsUnread(@PathVariable("slug") String slug) {
        try {
            boolean success = volumeService.markAsUnread(slug);
            if (success) {
                return new ResponseEntity<>(HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    // ============================================================
    // HELPER — tạo XWPFDocument đẹp từ danh sách volumes
    // ============================================================

    /**
     * Tạo style chung: font, size, spacing cho 1 run tiếng Anh.
     */
    private XWPFRun createEngRun(XWPFParagraph para, String text) {
        XWPFRun run = para.createRun();
        run.setFontFamily("Book Antiqua");
        run.setFontSize(18);
        run.setColor("1A1A2E");
        run.setText(text);
        return run;
    }

    /**
     * Tạo style chung: font, size, color cho 1 run tiếng Việt.
     */
    private XWPFRun createViRun(XWPFParagraph para, String text) {
        XWPFRun run = para.createRun();
        run.setFontFamily("Times New Roman");
        run.setFontSize(17);
        run.setColor("4A4A6A");
        run.setItalic(true);
        run.setText(text);
        return run;
    }

    /**
     * Thêm tiêu đề bài học vào document.
     */
    private void addLessonTitle(XWPFDocument doc, String title) {
        XWPFParagraph para = doc.createParagraph();
        para.setAlignment(ParagraphAlignment.CENTER);
        para.setSpacingAfter(240);
        para.setSpacingBefore(120);
        XWPFRun run = para.createRun();
        run.setBold(true);
        run.setFontFamily("Book Antiqua");
        run.setFontSize(22);
        run.setColor("1D3461");
        run.setText(title);
        run.addBreak();

        // Đường kẻ ngang sau tiêu đề
        XWPFParagraph line = doc.createParagraph();
        line.setSpacingAfter(240);
        line.setBorderBottom(Borders.SINGLE);
    }

    /**
     * Thêm cặp câu EN + VI vào document theo dạng 2 dòng liên tiếp.
     */
    private void addContentPair(XWPFDocument doc, String eng, String vi) {
        // Câu tiếng Anh
        XWPFParagraph engPara = doc.createParagraph();
        engPara.setAlignment(ParagraphAlignment.BOTH);
        engPara.setSpacingBetween(1.35, LineSpacingRule.AUTO);
        engPara.setSpacingAfter(0);
        engPara.setIndentationLeft(360); // 0.25 inch indent
        createEngRun(engPara, eng);

        // Câu tiếng Việt
        XWPFParagraph viPara = doc.createParagraph();
        viPara.setAlignment(ParagraphAlignment.BOTH);
        viPara.setSpacingBetween(1.2, LineSpacingRule.AUTO);
        viPara.setSpacingAfter(140); // khoảng cách giữa các cặp
        viPara.setIndentationLeft(360);
        createViRun(viPara, vi);
    }

    /**
     * Xây dựng XWPFDocument từ danh sách volumes.
     * englishOnly = true: chỉ xuất tiếng Anh (dạng đoạn văn liên tục), không có VI.
     * englishOnly = false: xuất cả EN + VI theo từng cặp câu.
     */
    private XWPFDocument buildVolumeDocument(List<VolumeDTO> volumes, boolean englishOnly) throws Exception {
        XWPFDocument doc = new XWPFDocument();

        for (int i = 0; i < volumes.size(); i++) {
            VolumeDTO volume = volumes.get(i);
            List<ContentDTO> contents = volume.getContents();
            if (contents == null || contents.isEmpty()) continue;

            String lessonTitle = (volumes.size() > 1)
                    ? "Lesson " + (i + 1) + ": " + volume.getEng()
                    : volume.getEng();

            addLessonTitle(doc, lessonTitle);

            if (volume.getVi() != null && !volume.getVi().isEmpty() && !englishOnly) {
                // Phụ đề tiếng Việt của tập
                XWPFParagraph subPara = doc.createParagraph();
                subPara.setAlignment(ParagraphAlignment.CENTER);
                subPara.setSpacingAfter(320);
                XWPFRun subRun = subPara.createRun();
                subRun.setFontFamily("Times New Roman");
                subRun.setFontSize(16);
                subRun.setItalic(true);
                subRun.setColor("666688");
                subRun.setText(volume.getVi());
            }

            if (englishOnly) {
                // Chế độ chỉ EN: gộp tất cả câu thành 1 đoạn văn liên tục
                StringBuilder sb = new StringBuilder();
                for (ContentDTO c : contents) {
                    String eng = c.getEng().trim();
                    if (sb.length() > 0) sb.append(" ");
                    sb.append(eng);
                    if (!eng.endsWith(".") && !eng.endsWith("!") && !eng.endsWith("?")) {
                        sb.append(".");
                    }
                }
                XWPFParagraph engPara = doc.createParagraph();
                engPara.setAlignment(ParagraphAlignment.BOTH);
                engPara.setSpacingBetween(1.5, LineSpacingRule.AUTO);
                engPara.setIndentationLeft(360);
                createEngRun(engPara, sb.toString());
            } else {
                // Chế độ đầy đủ: từng cặp câu EN + VI
                for (ContentDTO c : contents) {
                    String eng = c.getEng().trim();
                    String vi = c.getVi() != null ? c.getVi().trim() : "";
                    addContentPair(doc, eng, vi);
                }
            }

            // Page break giữa các tập (trừ tập cuối)
            if (i < volumes.size() - 1) {
                XWPFParagraph pb = doc.createParagraph();
                XWPFRun pbRun = pb.createRun();
                pbRun.addBreak(BreakType.PAGE);
            }
        }

        return doc;
    }

    // ============================================================
    // DOWNLOAD WORD — 1 tập đơn
    // ============================================================

    @GetMapping("/download-word/{slug}")
    public ResponseEntity<byte[]> downloadWord(@PathVariable("slug") String slug) {
        try {
            List<ContentDTO> contents = volumeService.getContentsByVolumeSlug(slug);
            VolumeDTO volume = volumeService.getVolumeDetailBySlug(slug);
            volume.setContents(contents);

            XWPFDocument document = buildVolumeDocument(Collections.singletonList(volume), false);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            document.write(outputStream);
            document.close();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment",
                    java.net.URLEncoder.encode(volume.getEng(), "UTF-8") + ".docx");

            return new ResponseEntity<>(outputStream.toByteArray(), headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    // ============================================================
    // DOWNLOAD WORD — toàn bộ cuốn sách
    // ============================================================

    @GetMapping("/download-book-word/{bookSlug}")
    public ResponseEntity<byte[]> downloadBookWord(@PathVariable("bookSlug") String bookSlug) {
        try {
            List<VolumeDTO> volumes = volumeService.getVolumesByBookSlug(bookSlug);
            List<VolumeDTO> volumesWithContent = volumes.stream()
                    .filter(v -> v.getContents() != null && !v.getContents().isEmpty())
                    .collect(Collectors.toList());

            XWPFDocument document = buildVolumeDocument(volumesWithContent, false);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            document.write(outputStream);
            document.close();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", bookSlug + ".docx");

            return new ResponseEntity<>(outputStream.toByteArray(), headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/download-selected-volumes-word/{bookSlug}")
    public ResponseEntity<byte[]> downloadSelectedVolumesWord(
            @PathVariable("bookSlug") String bookSlug,
            @RequestBody Map<String, List<String>> request) {
        try {
            List<String> volumeSlugs = request.get("volumeSlugs");
            if (volumeSlugs == null || volumeSlugs.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }
            List<VolumeDTO> allVolumes = volumeService.getVolumesByBookSlug(bookSlug);
            List<VolumeDTO> selectedVolumes = allVolumes.stream()
                    .filter(v -> volumeSlugs.contains(v.getSlug()))
                    .filter(v -> v.getContents() != null && !v.getContents().isEmpty())
                    .collect(Collectors.toList());

            XWPFDocument document = buildVolumeDocument(selectedVolumes, false);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            document.write(outputStream);
            document.close();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", bookSlug + "-selected.docx");
            return new ResponseEntity<>(outputStream.toByteArray(), headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/download-volume-word/{volumeSlug}")
    public ResponseEntity<byte[]> downloadVolumeWord(@PathVariable("volumeSlug") String volumeSlug) {
        try {
            VolumeDTO volume = volumeService.getVolumeBySlug(volumeSlug);
            if (volume == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            List<ContentDTO> contents = volume.getContents();
            if (contents == null || contents.isEmpty()) return new ResponseEntity<>(HttpStatus.BAD_REQUEST);

            XWPFDocument document = buildVolumeDocument(Collections.singletonList(volume), false);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            document.write(outputStream);
            document.close();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment",
                    java.net.URLEncoder.encode(volume.getEng(), "UTF-8") + ".docx");
            return new ResponseEntity<>(outputStream.toByteArray(), headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/download-selected-volumes-word-english/{bookSlug}")
    public ResponseEntity<byte[]> downloadSelectedVolumesWordEnglish(
            @PathVariable("bookSlug") String bookSlug,
            @RequestBody Map<String, List<String>> request) {
        try {
            List<String> volumeSlugs = request.get("volumeSlugs");
            if (volumeSlugs == null || volumeSlugs.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }

            List<VolumeDTO> allVolumes = volumeService.getVolumesByBookSlug(bookSlug);
            List<VolumeDTO> selectedVolumes = allVolumes.stream()
                    .filter(v -> volumeSlugs.contains(v.getSlug()))
                    .filter(v -> v.getContents() != null && !v.getContents().isEmpty())
                    .collect(Collectors.toList());

            XWPFDocument document = buildVolumeDocument(selectedVolumes, true);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            document.write(outputStream);
            document.close();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", bookSlug + "-english-only.docx");

            return new ResponseEntity<>(outputStream.toByteArray(), headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/download-book-pdf/{bookSlug}")
    public ResponseEntity<byte[]> downloadBookPdf(@PathVariable("bookSlug") String bookSlug) {
        try {
            List<VolumeDTO> volumes = volumeService.getVolumesByBookSlug(bookSlug);
            
            PDDocument document = new PDDocument();
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            
            float margin = 50;
            float pageWidth = page.getMediaBox().getWidth() - 2 * margin;
            float yPosition = page.getMediaBox().getHeight() - margin;
            float lineHeight = 27; // 1.5 line spacing with 18pt font
            
            // Load a Unicode font that supports Vietnamese
            PDType0Font font = null;
            boolean useCustomFont = false;
            try {
                // Try Times New Roman first (serif font similar to Book Antiqua)
                font = PDType0Font.load(document, new java.io.File("C:\\Windows\\Fonts\\times.ttf"));
                useCustomFont = true;
            } catch (Exception e) {
                try {
                    // Try Arial as fallback (good Vietnamese support)
                    font = PDType0Font.load(document, new java.io.File("C:\\Windows\\Fonts\\arial.ttf"));
                    useCustomFont = true;
                } catch (Exception ex) {
                    try {
                        // Try to load from resources
                        InputStream fontStream = getClass().getResourceAsStream("/fonts/Arial.ttf");
                        if (fontStream != null) {
                            font = PDType0Font.load(document, fontStream);
                            useCustomFont = true;
                        }
                    } catch (Exception ex2) {
                        // If all fails, use standard font (won't support Vietnamese)
                        useCustomFont = false;
                    }
                }
            }
            
            PDPageContentStream contentStream = new PDPageContentStream(document, page);
            if (useCustomFont) {
                contentStream.setFont(font, 18);
            } else {
                contentStream.setFont(PDType1Font.HELVETICA, 18);
            }
            contentStream.beginText();
            contentStream.newLineAtOffset(margin, yPosition);
            
            // Add content from all volumes
            int lessonNumber = 1;
            for (VolumeDTO volume : volumes) {
                List<ContentDTO> contents = volume.getContents();
                
                // Skip volumes with no content
                if (contents == null || contents.isEmpty()) {
                    continue;
                }
                
                // Add volume title with Lesson numbering
                String title = "Lesson " + lessonNumber + ": " + volume.getEng();
                
                // Check if we need a new page for title
                if (yPosition < margin + 60) {
                    contentStream.endText();
                    contentStream.close();
                    page = new PDPage(PDRectangle.A4);
                    document.addPage(page);
                    contentStream = new PDPageContentStream(document, page);
                    if (useCustomFont) {
                        contentStream.setFont(font, 18);
                    } else {
                        contentStream.setFont(PDType1Font.HELVETICA, 18);
                    }
                    contentStream.beginText();
                    contentStream.newLineAtOffset(margin, page.getMediaBox().getHeight() - margin);
                    yPosition = page.getMediaBox().getHeight() - margin;
                }
                
                // Draw title (bold and larger - 25pt to match Word, centered)
                if (useCustomFont) {
                    contentStream.setFont(font, 25);
                } else {
                    contentStream.setFont(PDType1Font.HELVETICA_BOLD, 25);
                }
                
                // Center the title
                float titleWidth;
                if (useCustomFont) {
                    titleWidth = font.getStringWidth(title) / 1000 * 25;
                } else {
                    titleWidth = PDType1Font.HELVETICA_BOLD.getStringWidth(title) / 1000 * 25;
                }
                float titleX = (page.getMediaBox().getWidth() - titleWidth) / 2;
                
                // Move to centered position
                contentStream.newLineAtOffset(titleX - margin, 0);
                contentStream.showText(title);
                contentStream.newLineAtOffset(-(titleX - margin), 0); // Reset x position
                
                yPosition -= 60; // 15pt spacing after title (300 in Word = 15pt)
                contentStream.newLineAtOffset(0, -60);
                if (useCustomFont) {
                    contentStream.setFont(font, 18);
                } else {
                    contentStream.setFont(PDType1Font.HELVETICA, 18);
                }
                
                // Build English and Vietnamese paragraphs
                StringBuilder englishParagraph = new StringBuilder();
                StringBuilder vietnameseParagraph = new StringBuilder();
                
                for (ContentDTO content : contents) {
                    String eng = content.getEng().trim();
                    String vi = content.getVi().trim();
                    
                    if (englishParagraph.length() > 0) {
                        englishParagraph.append(". ");
                    }
                    englishParagraph.append(eng);
                    
                    if (vietnameseParagraph.length() > 0) {
                        vietnameseParagraph.append(" ");
                    }
                    vietnameseParagraph.append(vi);
                    
                    if (!vi.endsWith("!") && !vi.endsWith("?") && !vi.endsWith("...")) {
                        vietnameseParagraph.append(".");
                    }
                }
                
                // Add English paragraph
                String engText = englishParagraph.toString();
                String[] engWords = engText.split(" ");
                String currentLine = "";
                
                for (String word : engWords) {
                    if (currentLine.isEmpty()) {
                        currentLine = word;
                    } else {
                        float lineWidth;
                        if (useCustomFont) {
                            lineWidth = font.getStringWidth(currentLine + " " + word) / 1000 * 18;
                        } else {
                            lineWidth = PDType1Font.HELVETICA.getStringWidth(currentLine + " " + word) / 1000 * 18;
                        }
                        if (lineWidth > pageWidth) {
                            if (yPosition < margin + lineHeight) {
                                contentStream.endText();
                                contentStream.close();
                                page = new PDPage(PDRectangle.A4);
                                document.addPage(page);
                                contentStream = new PDPageContentStream(document, page);
                                if (useCustomFont) {
                                    contentStream.setFont(font, 18);
                                } else {
                                    contentStream.setFont(PDType1Font.HELVETICA, 18);
                                }
                                contentStream.beginText();
                                contentStream.newLineAtOffset(margin, page.getMediaBox().getHeight() - margin);
                                yPosition = page.getMediaBox().getHeight() - margin;
                            }
                            contentStream.showText(currentLine);
                            yPosition -= lineHeight;
                            contentStream.newLineAtOffset(0, -lineHeight);
                            currentLine = word;
                        } else {
                            currentLine += " " + word;
                        }
                    }
                }
                if (!currentLine.isEmpty()) {
                    if (yPosition < margin + lineHeight) {
                        contentStream.endText();
                        contentStream.close();
                        page = new PDPage(PDRectangle.A4);
                        document.addPage(page);
                        contentStream = new PDPageContentStream(document, page);
                        if (useCustomFont) {
                            contentStream.setFont(font, 18);
                        } else {
                            contentStream.setFont(PDType1Font.HELVETICA, 18);
                        }
                        contentStream.beginText();
                        contentStream.newLineAtOffset(margin, page.getMediaBox().getHeight() - margin);
                        yPosition = page.getMediaBox().getHeight() - margin;
                    }
                    contentStream.showText(currentLine);
                    yPosition -= lineHeight;
                    contentStream.newLineAtOffset(0, -lineHeight);
                }
                
                // Add spacing between English and Vietnamese (50pt to match Word)
                yPosition -= 50;
                contentStream.newLineAtOffset(0, -50);
                
                // Add Vietnamese paragraph
                String viText = vietnameseParagraph.toString();
                String[] viWords = viText.split(" ");
                currentLine = "";
                
                for (String word : viWords) {
                    if (currentLine.isEmpty()) {
                        currentLine = word;
                    } else {
                        float lineWidth;
                        if (useCustomFont) {
                            lineWidth = font.getStringWidth(currentLine + " " + word) / 1000 * 18;
                        } else {
                            lineWidth = PDType1Font.HELVETICA.getStringWidth(currentLine + " " + word) / 1000 * 18;
                        }
                        if (lineWidth > pageWidth) {
                            if (yPosition < margin + lineHeight) {
                                contentStream.endText();
                                contentStream.close();
                                page = new PDPage(PDRectangle.A4);
                                document.addPage(page);
                                contentStream = new PDPageContentStream(document, page);
                                if (useCustomFont) {
                                    contentStream.setFont(font, 18);
                                } else {
                                    contentStream.setFont(PDType1Font.HELVETICA, 18);
                                }
                                contentStream.beginText();
                                contentStream.newLineAtOffset(margin, page.getMediaBox().getHeight() - margin);
                                yPosition = page.getMediaBox().getHeight() - margin;
                            }
                            contentStream.showText(currentLine);
                            yPosition -= lineHeight;
                            contentStream.newLineAtOffset(0, -lineHeight);
                            currentLine = word;
                        } else {
                            currentLine += " " + word;
                        }
                    }
                }
                if (!currentLine.isEmpty()) {
                    if (yPosition < margin + lineHeight) {
                        contentStream.endText();
                        contentStream.close();
                        page = new PDPage(PDRectangle.A4);
                        document.addPage(page);
                        contentStream = new PDPageContentStream(document, page);
                        if (useCustomFont) {
                            contentStream.setFont(font, 18);
                        } else {
                            contentStream.setFont(PDType1Font.HELVETICA, 18);
                        }
                        contentStream.beginText();
                        contentStream.newLineAtOffset(margin, page.getMediaBox().getHeight() - margin);
                        yPosition = page.getMediaBox().getHeight() - margin;
                    }
                    contentStream.showText(currentLine);
                    yPosition -= lineHeight;
                    contentStream.newLineAtOffset(0, -lineHeight);
                }
                
                // Add spacing between volumes (50pt to match Word)
                yPosition -= 50;
                contentStream.newLineAtOffset(0, -50);
                
                // Force page break after each volume (only if not the last volume with content)
                if (lessonNumber <= volumes.size()) {
                    contentStream.endText();
                    contentStream.close();
                    page = new PDPage(PDRectangle.A4);
                    document.addPage(page);
                    contentStream = new PDPageContentStream(document, page);
                    if (useCustomFont) {
                        contentStream.setFont(font, 18);
                    } else {
                        contentStream.setFont(PDType1Font.HELVETICA, 18);
                    }
                    contentStream.beginText();
                    contentStream.newLineAtOffset(margin, page.getMediaBox().getHeight() - margin);
                    yPosition = page.getMediaBox().getHeight() - margin;
                }
                
                lessonNumber++;
            }
            
            contentStream.endText();
            contentStream.close();
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            document.save(outputStream);
            document.close();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", bookSlug + ".pdf");
            
            return new ResponseEntity<>(outputStream.toByteArray(), headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }
}
