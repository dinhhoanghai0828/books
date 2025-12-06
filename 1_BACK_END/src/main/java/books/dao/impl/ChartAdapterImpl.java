package books.dao.impl;

import books.dao.interfaces.ChartAdapter;
import books.entity.Chart;
import books.utils.DBUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class ChartAdapterImpl implements ChartAdapter {
    private static final Logger logger = LoggerFactory.getLogger(ChartAdapterImpl.class);
    private static final String SQL_GET_CHARTS = "SELECT * from CHARTS WHERE 1=1 ";

    @Override
    public List<Chart> getCharts(String startDate, String endDate) throws Exception {
        String thisMethod = "ChartAdapterImpl.getCharts";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        ResultSet investmentRs = null;
        List<Chart> charts = new ArrayList<>();
        // Truy vấn dữ liệu đầu tư trước
        Map<String, List<double[]>> investmentDataMap = new HashMap<>();
        String investmentQuery = "SELECT GOLD_TYPE, GOLD_PRICE, GOLD_QUANTITY FROM GOLD_INVESTMENTS";
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = con.prepareStatement(investmentQuery);
            investmentRs = pstmt.executeQuery();
            while (investmentRs.next()) {
                String goldType = investmentRs.getString("GOLD_TYPE");
                double goldPrice = investmentRs.getDouble("GOLD_PRICE");
                double goldQuantity = investmentRs.getDouble("GOLD_QUANTITY");
                investmentDataMap.computeIfAbsent(goldType, k -> new ArrayList<>())
                        .add(new double[]{goldPrice, goldQuantity});
            }
        } catch (Exception ex) {
            logger.error(ex.getMessage());
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, investmentRs);
        }
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            StringBuffer sql = new StringBuffer(SQL_GET_CHARTS);
            if (StringUtils.isNotBlank(startDate)) {
                sql.append(" AND CREATED_AT > ? ");
            }
            if (StringUtils.isNotBlank(endDate)) {
                sql.append(" AND CREATED_AT < ?");
            }
            sql.append(" ORDER BY CREATED_AT ASC");

            pstmt = DBUtils.prepareStatement(con, sql.toString());
            int index = 1;
            if (StringUtils.isNotBlank(startDate)) {
                startDate = startDate.trim() + " 00:00:00";
                pstmt.setString(index++, startDate);
            }
            if (StringUtils.isNotBlank(endDate)) {
                endDate = endDate.trim() + " 23:59:59";
                pstmt.setString(index++, endDate);
            }
            rs = DBUtils.executeQuery(pstmt, sql.toString());
            while (rs.next()) {
                Chart chart = new Chart();
                chart.setId(rs.getString("ID"));

                double worldGoldPriceVND = rs.getDouble("WORLD_PRICE");
                double usdOz = 1.20565299632;
                //  Co thue, phi
//                worldGoldPriceVND = (worldGoldPriceVND + worldGoldPriceVND / 100 + rs.getDouble("TRANSPORT") + rs.getDouble("INSURANCE")) * rs.getDouble("DOLLAR_PRICE") * usdOz;
                //  Khong thue phi
                worldGoldPriceVND = (worldGoldPriceVND + rs.getDouble("TRANSPORT") + rs.getDouble("INSURANCE")) * rs.getDouble("DOLLAR_PRICE") * usdOz;
                chart.setWorldPrice(String.format("%.3f", rs.getDouble("WORLD_PRICE")));
                chart.setWorldPriceVND(String.format("%.3f", worldGoldPriceVND));
                chart.setDomesticPurchasePrice(rs.getString("DOMESTIC_PURCHASE_PRICE"));
                chart.setDomesticSalePrice(rs.getString("DOMESTIC_SALE_PRICE"));
                chart.setDomesticRingPurchasePrice(rs.getString("DOMESTIC_RING_PURCHASE_PRICE"));
                chart.setDomesticRingSalePrice(rs.getString("DOMESTIC_RING_SALE_PRICE"));
                chart.setDollarPrice(rs.getString("DOLLAR_PRICE"));
                chart.setTransport(rs.getString("TRANSPORT"));
                chart.setInsurance(rs.getString("INSURANCE"));
                chart.setCreatedAt(rs.getString("CREATED_AT"));
                chart.setCreateBy(rs.getString("CREATED_BY"));
                chart.setUpdatedBy(rs.getString("UPDATED_BY"));

                // Tính toán lợi nhuận
                double profitGoldBar = 0;
                double profitGoldRing = 0;
                double totalInvestment = 0;
                double totalGoldBarInvestment = 0;
                double totalGoldRingInvestment = 0;

                if (investmentDataMap.containsKey("Miếng")) {
                    double salePrice = rs.getDouble("DOMESTIC_SALE_PRICE");
                    for (double[] data : investmentDataMap.get("Miếng")) {
                        profitGoldBar += (salePrice - data[0]) * data[1];
                        totalGoldBarInvestment += data[0] * data[1];
                        totalInvestment += data[0] * data[1];
                    }
                }

                if (investmentDataMap.containsKey("Nhẫn")) {
                    double ringSalePrice = rs.getDouble("DOMESTIC_RING_SALE_PRICE");
                    for (double[] data : investmentDataMap.get("Nhẫn")) {
                        profitGoldRing += (ringSalePrice - data[0]) * data[1];
                        totalGoldRingInvestment += data[0] * data[1];
                        totalInvestment += data[0] * data[1];
                    }
                }
                double profitPercentageBar = (totalGoldBarInvestment > 0) ? (profitGoldBar / totalGoldBarInvestment) * 100 : 0;
                double profitPercentageRing = (totalGoldRingInvestment > 0) ? (profitGoldRing / totalGoldRingInvestment) * 100 : 0;
                double totalProfit = profitGoldBar + profitGoldRing;
                double totalProfitPercentage = (totalInvestment > 0) ? (totalProfit / totalInvestment) * 100 : 0;
                chart.setProfitGoldBar(String.format("%.2f - %.2f%%", profitGoldBar, profitPercentageBar));
                chart.setProfitGoldRing(String.format("%.2f - %.2f%%", profitGoldRing, profitPercentageRing));
                chart.setTotalProfit(String.format("%.2f - %.2f%%", totalProfit, totalProfitPercentage));
                chart.setTotalInvestment(String.format("%.2f - %.2f", totalInvestment + totalProfit, totalInvestment));
                chart.setTotalInvestmentDiff(String.format("%.2f", totalInvestment + totalProfit));
                charts.add(chart);
            }
        } catch (Exception ex) {
            logger.error(ex.getMessage());
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }
        return charts;
    }
}
