package books.controller;

import books.dto.ContentDTO;
import books.dto.VolumeDTO;
import books.response.VolumeDetailResponse;
import books.response.VolumeResponse;
import books.service.interfaces.VolumeService;
import org.apache.poi.xwpf.usermodel.*;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.math.BigInteger;
import java.util.List;

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

    @GetMapping("/download-word/{slug}")
    public ResponseEntity<byte[]> downloadWord(@PathVariable("slug") String slug) {
        try {
            List<ContentDTO> contents = volumeService.getContentsByVolumeSlug(slug);
            VolumeDTO volume = volumeService.getVolumeDetailBySlug(slug);
            
            XWPFDocument document = new XWPFDocument();
            
            // Add title
            XWPFParagraph titleParagraph = document.createParagraph();
            titleParagraph.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun titleRun = titleParagraph.createRun();
            titleRun.setBold(true);
            titleRun.setFontFamily("Times New Roman");
            titleRun.setFontSize(25);
            titleRun.setText(volume.getEng());
            titleRun.addBreak(BreakType.PAGE);
            
            // Add content
            for (ContentDTO content : contents) {
                XWPFParagraph contentParagraph = document.createParagraph();
                contentParagraph.setAlignment(ParagraphAlignment.LEFT);
                XWPFRun contentRun = contentParagraph.createRun();
                contentRun.setFontFamily("Times New Roman");
                contentRun.setFontSize(20);
                contentRun.setText(content.getEng());
                
                XWPFParagraph viParagraph = document.createParagraph();
                viParagraph.setAlignment(ParagraphAlignment.LEFT);
                XWPFRun viRun = viParagraph.createRun();
                viRun.setFontFamily("Times New Roman");
                viRun.setFontSize(20);
                viRun.setText(content.getVi());
                viRun.addBreak();
                
                // Check if content is long (more than 200 characters) to decide page break
                if (content.getEng().length() > 200 || content.getVi().length() > 200) {
                    contentRun.addBreak(BreakType.PAGE);
                }
            }
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            document.write(outputStream);
            document.close();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", volume.getEng() + ".docx");
            
            return new ResponseEntity<>(outputStream.toByteArray(), headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/download-book-word/{bookSlug}")
    public ResponseEntity<byte[]> downloadBookWord(@PathVariable("bookSlug") String bookSlug) {
        try {
            List<VolumeDTO> volumes = volumeService.getVolumesByBookSlug(bookSlug);
            
            XWPFDocument document = new XWPFDocument();
            
            // Add book title
            XWPFParagraph titleParagraph = document.createParagraph();
            titleParagraph.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun titleRun = titleParagraph.createRun();
            titleRun.setBold(true);
            titleRun.setFontFamily("Times New Roman");
            titleRun.setFontSize(25);
            titleRun.setText("Book: " + bookSlug);
            titleRun.addBreak(BreakType.PAGE);
            
            // Add content from all volumes
            for (VolumeDTO volume : volumes) {
                // Add volume title
                XWPFParagraph volumeTitleParagraph = document.createParagraph();
                volumeTitleParagraph.setAlignment(ParagraphAlignment.CENTER);
                XWPFRun volumeTitleRun = volumeTitleParagraph.createRun();
                volumeTitleRun.setBold(true);
                volumeTitleRun.setFontFamily("Times New Roman");
                volumeTitleRun.setFontSize(22);
                volumeTitleRun.setText(volume.getEng());
                volumeTitleRun.addBreak();
                
                // Use contents from VolumeDTO instead of calling service
                List<ContentDTO> contents = volume.getContents();
                
                if (contents != null && !contents.isEmpty()) {
                    for (ContentDTO content : contents) {
                        XWPFParagraph contentParagraph = document.createParagraph();
                        contentParagraph.setAlignment(ParagraphAlignment.LEFT);
                        XWPFRun contentRun = contentParagraph.createRun();
                        contentRun.setFontFamily("Times New Roman");
                        contentRun.setFontSize(20);
                        contentRun.setText(content.getEng());
                        
                        XWPFParagraph viParagraph = document.createParagraph();
                        viParagraph.setAlignment(ParagraphAlignment.LEFT);
                        XWPFRun viRun = viParagraph.createRun();
                        viRun.setFontFamily("Times New Roman");
                        viRun.setFontSize(20);
                        viRun.setText(content.getVi());
                        viRun.addBreak();
                        
                        // Check if content is long (more than 200 characters) to decide page break
                        if (content.getEng().length() > 200 || content.getVi().length() > 200) {
                            contentRun.addBreak(BreakType.PAGE);
                        }
                    }
                } else {
                    XWPFParagraph emptyParagraph = document.createParagraph();
                    emptyParagraph.setAlignment(ParagraphAlignment.LEFT);
                    XWPFRun emptyRun = emptyParagraph.createRun();
                    emptyRun.setFontFamily("Times New Roman");
                    emptyRun.setFontSize(16);
                    emptyRun.setItalic(true);
                    emptyRun.setText("(No content available for this volume)");
                    emptyRun.addBreak();
                }
                
                // Page break between volumes
                volumeTitleRun.addBreak(BreakType.PAGE);
            }
            
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
}
