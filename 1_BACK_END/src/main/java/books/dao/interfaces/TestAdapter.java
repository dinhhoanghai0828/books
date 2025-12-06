package books.dao.interfaces;

import books.entity.Content;

import java.util.List;

public interface TestAdapter {
    List<Content> getTest(String volumeSlug, String limit) throws Exception;
}
