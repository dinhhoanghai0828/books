package books.service.impl;

import books.dao.interfaces.ChartAdapter;
import books.dto.ChartDTO;
import books.entity.Chart;
import books.service.interfaces.ChartService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChartServiceImpl implements ChartService {
    private ChartAdapter chartAdapter;
    private ModelMapper modelMapper;

    @Autowired
    public ChartServiceImpl(ChartAdapter chartAdapter, ModelMapper modelMapper) {
        this.chartAdapter = chartAdapter;
        this.modelMapper = modelMapper;
    }

    @Override
    public List<ChartDTO> getCharts(String startDate, String endDate) throws Exception {
        List<Chart> charts = chartAdapter.getCharts(startDate, endDate);
        List<ChartDTO> chartDTOS = charts.stream().map(chart -> modelMapper.map(chart, ChartDTO.class)).collect(Collectors.toList());
        return chartDTOS;
    }
}
