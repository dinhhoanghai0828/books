package books.component;

public class CanculateTK {

    public static void main(String[] args) {
        double initialAmount = 2_750_000_000.0;
        double monthlyDeposit = 35_000_000;
        double annualInterestRate = 3.6;
        double monthlyInterestRate = annualInterestRate / 12 / 100;

        int years = 10;
        int months = years * 12;
        double totalAmount = initialAmount;
        java.time.LocalDate today = java.time.LocalDate.now();
        int currentYear = today.getYear();
        int currentMonth = today.getMonthValue();
        System.out.printf("Năm %d, Tháng %2d: Số dư ban đầu: %.2f VND", currentYear, currentMonth, totalAmount);
        System.out.printf("\n");
        for (int i = 1; i <= months; i++) {
            double interest = totalAmount * monthlyInterestRate; // Lãi suất tháng
            totalAmount += interest + monthlyDeposit; // Cộng lãi suất và gửi thêm tiền

            int year = currentYear + (currentMonth + i - 2) / 12;
            int month = (currentMonth + i - 2) % 12 + 1;
            System.out.printf("Năm %d, Tháng %2d: Lãi: %.2f VND, Tổng: %.2f VND\n", year, month, interest, totalAmount);
        }


        // Tính toán khi gửi theo năm, lãi suất 5.5%
        double annualInterestRateFixed = 5.5 / 100; // 5.5%/năm
        double totalAnnual = initialAmount;

        for (int i = 0; i < years; i++) {
            totalAnnual += totalAnnual * annualInterestRateFixed;
            totalAnnual += monthlyDeposit * 12; // Gửi thêm tiền mỗi năm
            System.out.printf("Năm %d: Tổng tiền: %.2f VND\n", currentYear + i + 1, totalAnnual);
        }

        System.out.printf("\nTổng số tiền sau %d năm (gửi hàng tháng): %.2f VND",years, totalAmount);
        System.out.printf("\nTổng số tiền sau %d năm (gửi 12 tháng/lần): %.2f VND\n",years, totalAnnual);

        // So sánh hai cách gửi
        double difference = totalAnnual - totalAmount;
        if (difference > 0) {
            System.out.printf("Gửi theo năm có lợi hơn %.2f VND.\n", difference);
        } else {
            System.out.printf("Gửi hàng tháng có lợi hơn %.2f VND.\n", -difference);
        }
    }
}
