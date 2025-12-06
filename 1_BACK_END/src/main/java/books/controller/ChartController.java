package books.controller;

import books.dto.ChartDTO;
import books.response.ChartResponse;
import books.service.interfaces.ChartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.query.Param;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin("*")
@RequestMapping("/chart")
public class ChartController {
    private ChartService chartService;

    @Autowired
    public ChartController(ChartService chartService) {
        this.chartService = chartService;
    }

    @GetMapping("/get-chart")
    public ResponseEntity<?> getChart(@Param("startDate") String startDate, @Param("endDate") String endDate) {
        try {
            List<ChartDTO> chartDTOS = chartService.getCharts(startDate, endDate);
            ChartResponse response = new ChartResponse();
            response.setCharts(chartDTOS);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }
}
