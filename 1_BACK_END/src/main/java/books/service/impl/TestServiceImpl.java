package books.service.impl;

import books.dao.interfaces.TestAdapter;
import books.dto.ContentDTO;
import books.entity.Content;
import books.service.interfaces.TestService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TestServiceImpl implements TestService {
    private TestAdapter testAdapter;
    private ModelMapper modelMapper;

    @Autowired
    public TestServiceImpl(TestAdapter testAdapter, ModelMapper modelMapper) {
        this.testAdapter = testAdapter;
        this.modelMapper = modelMapper;
    }

    @Override
    public List<ContentDTO> getTest(String volumeSlug, String limit) throws Exception {
        List<Content> contents = testAdapter.getTest(volumeSlug, limit);
        List<ContentDTO> contentDTOS = contents.stream()
                .map(content -> modelMapper.map(content, ContentDTO.class))
                .collect(Collectors.toList());
        return contentDTOS;
    }
}
