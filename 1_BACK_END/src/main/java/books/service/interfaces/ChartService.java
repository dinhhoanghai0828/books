package books.service.interfaces;

import books.dto.ChartDTO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface ChartService {
    List<ChartDTO> getCharts(String startDate, String endDate, String worldPriceMin, String worldPriceMax, String shopNPurchasePriceMin, String shopNPurchasePriceMax, String shopMPurchasePriceMin, String shopMPurchasePriceMax) throws Exception;
}
