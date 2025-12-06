package books.dao.interfaces;

import books.entity.GoldInvestment;

import java.util.List;

public interface StatisticAdapter {
    List<GoldInvestment> getGoldInvestment() throws Exception;
}
