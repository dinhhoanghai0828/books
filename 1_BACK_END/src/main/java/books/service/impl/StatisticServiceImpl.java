package books.service.impl;

import books.dao.interfaces.StatisticAdapter;
import books.dto.GoldInvestmentDTO;
import books.entity.GoldInvestment;
import books.service.interfaces.StatisticService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StatisticServiceImpl implements StatisticService {
    private StatisticAdapter statisticAdapter;
    private ModelMapper modelMapper;

    @Autowired
    public StatisticServiceImpl(StatisticAdapter statisticAdapter, ModelMapper modelMapper) {
        this.statisticAdapter = statisticAdapter;
        this.modelMapper = modelMapper;
    }

    @Override
    public List<GoldInvestmentDTO> getGoldInvestment() throws Exception {
        List<GoldInvestment> goldInvestments = statisticAdapter.getGoldInvestment();
        List<GoldInvestmentDTO> goldInvestmentDTOS = goldInvestments.stream().map(goldInvestment -> modelMapper.map(goldInvestment, GoldInvestmentDTO.class)).collect(Collectors.toList());
        return goldInvestmentDTOS;
    }
}
