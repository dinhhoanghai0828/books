package books.component;

import java.io.IOException;
import java.sql.SQLException;


public class RunSQLChartService {
    public static void main(String[] args) throws SQLException, IOException {
        // Test component functionality
        try {
            RunSQLComponent component = new RunSQLComponent();
            component.insertChart();
            System.out.println("INSERT CHART SUCCESS");
        } catch (Exception e) {
            throw e;
        }
    }
}
