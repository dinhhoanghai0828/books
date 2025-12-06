package books.component;

import java.sql.SQLException;


public class RunSQLWordInsertService {


    public static void main(String[] args) throws SQLException {
        // Test component functionality
        try {
            RunSQLComponent component = new RunSQLComponent();
            //  Them lai bang du lieu word
            component.insertWord();
            System.out.println("INSERT WORDS SUCCESS");
        } catch (Exception e) {
            throw e;
        }

    }
}
