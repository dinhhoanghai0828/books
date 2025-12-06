package books.response;

import books.dto.BookDTO;

import java.util.List;

public class BookResponse {
    private List<BookDTO> books;

    public List<BookDTO> getBooks() {
        return books;
    }

    public void setBooks(List<BookDTO> books) {
        this.books = books;
    }
}
