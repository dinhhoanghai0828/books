package books.component;

import java.sql.SQLException;


public class RunSQLWordGeneralService {
    public static void main(String[] args) throws SQLException {
        // Test component functionality
        try {
            RunSQLComponent component = new RunSQLComponent();
            //  Tao lai bang Word voi du lieu moi
            component.createWordTableTemp();
            //  Tong hop
            component.generalWord();
            System.out.println("GENERAL WORDS SUCCESS");
        } catch (Exception e) {
            throw e;
        }

    }
}
