package books.controller;

import books.dto.ChartDTO;
import books.dto.GoldInvestmentDTO;
import books.response.ChartResponse;
import books.response.GoldInvestmentResponse;
import books.service.interfaces.ChartService;
import books.service.interfaces.StatisticService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.query.Param;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin("*")
@RequestMapping("/statistic")
public class StatisticController {
    private StatisticService statisticService;

    @Autowired
    public StatisticController(StatisticService statisticService) {
        this.statisticService = statisticService;
    }

    @GetMapping("/get-gold-investment")
    public ResponseEntity<?> getChart() {
        try {
            List<GoldInvestmentDTO> goldInvestmentDTOS = statisticService.getGoldInvestment();
            GoldInvestmentResponse response = new GoldInvestmentResponse();
            response.setGoldInvestmentDTOS(goldInvestmentDTOS);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }
}
