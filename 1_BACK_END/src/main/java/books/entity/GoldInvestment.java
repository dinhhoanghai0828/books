package books.entity;

import java.util.Date;

public class GoldInvestment {
    private String id;
    private String initialCapital;
    private String goldPrice;
    private String sellPrice;
    private String goldQuantity;
    private String goldType;
    private String profit;
    private String profitPercentage;
    private Date purchaseDate;
    private Date sellDate;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getInitialCapital() {
        return initialCapital;
    }

    public void setInitialCapital(String initialCapital) {
        this.initialCapital = initialCapital;
    }

    public String getGoldPrice() {
        return goldPrice;
    }

    public void setGoldPrice(String goldPrice) {
        this.goldPrice = goldPrice;
    }

    public String getSellPrice() {
        return sellPrice;
    }

    public void setSellPrice(String sellPrice) {
        this.sellPrice = sellPrice;
    }

    public String getGoldQuantity() {
        return goldQuantity;
    }

    public void setGoldQuantity(String goldQuantity) {
        this.goldQuantity = goldQuantity;
    }

    public String getGoldType() {
        return goldType;
    }

    public void setGoldType(String goldType) {
        this.goldType = goldType;
    }

    public String getProfit() {
        return profit;
    }

    public void setProfit(String profit) {
        this.profit = profit;
    }

    public String getProfitPercentage() {
        return profitPercentage;
    }

    public void setProfitPercentage(String profitPercentage) {
        this.profitPercentage = profitPercentage;
    }

    public Date getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(Date purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public Date getSellDate() {
        return sellDate;
    }

    public void setSellDate(Date sellDate) {
        this.sellDate = sellDate;
    }
}
