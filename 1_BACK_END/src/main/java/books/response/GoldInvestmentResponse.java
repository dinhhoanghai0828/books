package books.response;

import books.dto.GoldInvestmentDTO;

import java.util.List;

public class GoldInvestmentResponse {
    private List<GoldInvestmentDTO> goldInvestmentDTOS;

    public List<GoldInvestmentDTO> getGoldInvestmentDTOS() {
        return goldInvestmentDTOS;
    }

    public void setGoldInvestmentDTOS(List<GoldInvestmentDTO> goldInvestmentDTOS) {
        this.goldInvestmentDTOS = goldInvestmentDTOS;
    }
}
