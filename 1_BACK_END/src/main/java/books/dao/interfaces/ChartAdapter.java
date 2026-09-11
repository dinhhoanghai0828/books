package books.dao.interfaces;

import books.entity.Chart;
import books.entity.Word;

import java.util.List;

public interface ChartAdapter {
    List<Chart> getCharts(String startDate, String endDate, String worldPrice, String shopNPurchasePrice, String shopMPurchasePrice) throws Exception;
}
