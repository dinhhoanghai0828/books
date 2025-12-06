package books.dao.interfaces;

import books.entity.Chart;
import books.entity.Word;

import java.util.List;

public interface ChartAdapter {
    List<Chart> getCharts(String month, String year) throws Exception;
}
