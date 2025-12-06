package books.response;

import books.dto.ChartDTO;
import books.dto.VolumeDTO;

import java.util.List;

public class ChartResponse {
    private List<ChartDTO> charts;

    public List<ChartDTO> getCharts() {
        return charts;
    }

    public void setCharts(List<ChartDTO> charts) {
        this.charts = charts;
    }
}
