package books.dao.interfaces;

import books.entity.User;

public interface UserAdapter {
    User getUserByUserName(String username) throws Exception;

    User getUserById(String id) throws Exception;

    void save(User user) throws Exception;
}
