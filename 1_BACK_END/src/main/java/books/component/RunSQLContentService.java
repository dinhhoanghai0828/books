package books.component;

import java.io.IOException;
import java.sql.SQLException;

public class RunSQLContentService {
    public static void main(String[] args) throws SQLException, IOException {
        // Test component functionality
        try {
            RunSQLComponent component = new RunSQLComponent(); // Create component instance
            component.insertContent();
            System.out.println("INSERT CONTENT SUCCESS");
        } catch (Exception e) {
            throw e;
        }
    }
}
