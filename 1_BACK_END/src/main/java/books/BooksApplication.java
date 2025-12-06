package books;

import books.dao.interfaces.UserAdapter;
import books.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class BooksApplication implements CommandLineRunner {
	@Autowired
	private BCryptPasswordEncoder bCryptPasswordEncoder;
	public static void main(String[] args) {
		SpringApplication.run(BooksApplication.class, args);
	}

	private UserAdapter userAdapter;
	@Autowired
	public BooksApplication(UserAdapter userAdapter) {
		this.userAdapter = userAdapter;
	}

	@Override
	public void run(String... args) throws Exception {
//		User user = new User();
//		user.setUsername("haidh8");
//		user.setPassword(bCryptPasswordEncoder.encode("haiha92"));
//		userAdapter.save(user);
	}
}
