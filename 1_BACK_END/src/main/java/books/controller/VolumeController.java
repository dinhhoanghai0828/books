package books.controller;

import books.dto.VolumeDTO;
import books.response.VolumeDetailResponse;
import books.response.VolumeResponse;
import books.service.interfaces.VolumeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
