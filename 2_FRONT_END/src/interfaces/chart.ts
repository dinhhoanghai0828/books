// ============================================================
// CHART INTERFACE
// Interface cho doi tuong Bieu do gia vang
// ============================================================

export interface Chart {
  id: string;                      // ID duy nhat cua ban ghi
  worldPrice: string;              // Gia vang the gioi (USD/oz)
  worldPriceVND: string;           // Gia vang the gioi quy doi sang VND
  domesticPurchasePrice: string;   // Gia mua vang trong nuoc
  domesticSalePrice: string;       // Gia ban vang trong nuoc
  domesticRingPurchasePrice: string; // Gia mua nhuyen vang trong nuoc
  domesticRingSalePrice: string;  // Gia ban nhuyen vang trong nuoc
  dollarPrice: string;             // Ty gia USD/VND
  transport: string;               // Chi phi van chuyen
  insurance: string;               // Chi phi bao hiem
  createdAt: string;               // Thoi gian tao
  updatedAt: string;               // Thoi gian cap nhat
  createBy: string;                // Nguoi tao
  updatedBy: string;               // Nguoi cap nhat
  profitGoldBar: string;           // Loi nhuan tu thanh vang
  profitGoldRing: string;          // Loi nhuan tu nhuyen vang
  totalProfit: string;             // Tong loi nhuan
  totalInvestment: string;         // Tong von dau tu
  totalInvestmentDiff: string;     // Chenh lech von dau tu
}
