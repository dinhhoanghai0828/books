package books.service.impl;

import books.dao.interfaces.UserAdapter;
import books.entity.CustomUserDetails;
import books.entity.User;
import books.service.interfaces.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {

    private UserAdapter userAdapter;

    @Autowired
    public UserServiceImpl(UserAdapter userAdapter) {
        this.userAdapter = userAdapter;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        // Kiểm tra xem user có tồn tại trong database không?
        try {
            User user = userAdapter.getUserByUserName(username);
            if (user == null) {
                throw new UsernameNotFoundException(username);
            }
            return new CustomUserDetails(user);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public UserDetails getUserById(String id) throws Exception {
        User user = userAdapter.getUserById(id);
        if (user == null) {
            throw new UsernameNotFoundException("FAILED");
        }
        return new CustomUserDetails(user);
    }


}