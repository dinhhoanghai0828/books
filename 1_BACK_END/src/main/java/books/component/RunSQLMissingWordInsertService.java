package books.component;

import java.sql.SQLException;


public class RunSQLMissingWordInsertService {


    public static void main(String[] args) throws SQLException {
        // Test component functionality
        try {
            RunSQLComponent component = new RunSQLComponent();
            //  Them lai bang du lieu word
            component.insertMissingWord();
            System.out.println("INSERT MISSING WORDS SUCCESS");
        } catch (Exception e) {
            throw e;
        }

    }
}
