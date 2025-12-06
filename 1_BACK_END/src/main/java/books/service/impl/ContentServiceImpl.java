package books.service.impl;

import books.dao.interfaces.ContentAdapter;
import books.dto.ContentDTO;
import books.entity.Content;
import books.service.interfaces.ContentService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ContentServiceImpl implements ContentService {
    private ContentAdapter contentAdapter;
    private ModelMapper modelMapper;

    @Autowired
    public ContentServiceImpl(ContentAdapter contentAdapter, ModelMapper modelMapper) {
        this.contentAdapter = contentAdapter;
        this.modelMapper = modelMapper;
    }

    @Override
    public List<ContentDTO> getContentByVolumeSlug(String volumeSlug) throws Exception {
        List<Content> contents = contentAdapter.getContentByVolumeSlug(volumeSlug);
        List<ContentDTO> contentDTOS = contents.stream()
                .map(content -> modelMapper.map(content, ContentDTO.class))
                .collect(Collectors.toList());

        return contentDTOS;
    }

    @Override
    public Map<String, Object> getContents(String eng, String vi, String page, String size) throws Exception {
        Map<String, Object> result = contentAdapter.getContents(eng, vi, page, size);
        List<Content> contents = (List<Content>) result.get("CONTENTS");
        List<ContentDTO> contentDTOS = contents.stream()
                .map(content -> modelMapper.map(content, ContentDTO.class))
                .collect(Collectors.toList());

        result.put("CONTENTS", contentDTOS);
        return result;
    }
}
