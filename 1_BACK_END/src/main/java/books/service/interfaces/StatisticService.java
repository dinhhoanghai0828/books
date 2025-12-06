package books.service.interfaces;

import books.dto.GoldInvestmentDTO;
import books.entity.GoldInvestment;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface StatisticService {
    List<GoldInvestmentDTO> getGoldInvestment() throws Exception;
}
