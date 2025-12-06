package books.dao.impl;

import books.dao.interfaces.StatisticAdapter;
import books.entity.GoldInvestment;
import books.utils.DBUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

@Repository
public class StatisticAdapterImpl implements StatisticAdapter {
    private static final Logger logger = LoggerFactory.getLogger(StatisticAdapterImpl.class);
    private static final String SQL_GET_GOLD_INVESTMENT = "SELECT * FROM GOLD_INVESTMENTS";

    @Override
    public List<GoldInvestment> getGoldInvestment() throws Exception {
        String thisMethod = "GoldInvestmentAdapterImpl.getInvestments";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        List<GoldInvestment> investments = new ArrayList<>();

        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            StringBuilder sql = new StringBuilder(SQL_GET_GOLD_INVESTMENT);
            pstmt = DBUtils.prepareStatement(con, sql.toString());
            rs = DBUtils.executeQuery(pstmt, sql.toString());
            while (rs.next()) {
                GoldInvestment investment = new GoldInvestment();
                investment.setId(rs.getString("ID"));
                double initialCapital = rs.getDouble("INITIAL_CAPITAL");
                double goldPrice = rs.getDouble("GOLD_PRICE");
                double sellPrice = rs.getDouble("SELL_PRICE");
                int goldQuantity = rs.getInt("GOLD_QUANTITY");
                double totalBuy = goldPrice * goldQuantity;
                double totalSell = sellPrice * goldQuantity;
                double profit = totalSell - totalBuy;
                double profitPercentage = (profit / totalBuy) * 100;
                investment.setInitialCapital(String.format("%.3f", initialCapital));
                investment.setGoldPrice(String.format("%.3f", goldPrice));
                investment.setSellPrice(String.format("%.3f", sellPrice));
                investment.setProfit(String.format("%.3f", profit));
                investment.setProfitPercentage(String.format("%.2f%%", profitPercentage));
                investment.setGoldQuantity(String.valueOf(goldQuantity));
                investment.setGoldType(rs.getString("GOLD_TYPE"));
                investment.setPurchaseDate(rs.getDate("PURCHASE_DATE"));
                investment.setSellDate(rs.getDate("SELL_DATE"));
                investments.add(investment);
            }
        } catch (Exception ex) {
            logger.error(ex.getMessage());
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }
        return investments;

    }

}
