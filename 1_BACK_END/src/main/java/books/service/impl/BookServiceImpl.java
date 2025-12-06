package books.service.impl;

import books.dao.impl.BookAdapterImpl;
import books.dao.interfaces.BookAdapter;
import books.dao.interfaces.CategoryAdapter;
import books.dto.BookDTO;
import books.dto.VolumeDTO;
import books.entity.Book;
import books.entity.Volume;
import books.service.interfaces.BookService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class BookServiceImpl implements BookService {
    private BookAdapter bookAdapter;
    private ModelMapper modelMapper;
    @Autowired
    public BookServiceImpl(BookAdapter bookAdapter, ModelMapper modelMapper) {
        this.bookAdapter = bookAdapter;
        this.modelMapper = modelMapper;
    }
    @Override
    public Map<String, Object> getVolumeByBookSlug(String slug, String page, String size) throws Exception {
        Map<String, Object> result = bookAdapter.getVolumeByBookSlug(slug, page, size);
        List<Volume> volumes = (List<Volume>) result.get("VOLUMES");
        List<VolumeDTO> volumeDTOS = volumes.stream()
                .map(volume -> modelMapper.map(volume, VolumeDTO.class))
                .collect(Collectors.toList());
        result.put("VOLUMES", volumeDTOS);
        return result;
    }
}
