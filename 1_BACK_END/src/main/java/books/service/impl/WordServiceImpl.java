package books.service.impl;

import books.dao.interfaces.WordAdapter;
import books.dto.WordDTO;
import books.entity.Word;
import books.service.interfaces.WordService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WordServiceImpl implements WordService {
    private WordAdapter wordAdapter;
    private ModelMapper modelMapper;

    @Autowired
    public WordServiceImpl(WordAdapter wordAdapter, ModelMapper modelMapper) {
        this.wordAdapter = wordAdapter;
        this.modelMapper = modelMapper;
    }

    @Override
    public List<WordDTO> getSuggestionsFromEngWords(String eng) throws Exception {
        List<Word> words =  wordAdapter.getEngWords(eng);
        List<WordDTO> wordDTOS = words.stream()
                .map(content -> modelMapper.map(content, WordDTO.class))
                .collect(Collectors.toList());
        return wordDTOS;
    }

    @Override
    public List<WordDTO> getSuggestionsFromViWords(String vi) throws Exception {
        List<Word> words =  wordAdapter.getViWords(vi);
        List<WordDTO> wordDTOS = words.stream()
                .map(content -> modelMapper.map(content, WordDTO.class))
                .collect(Collectors.toList());
        return wordDTOS;
    }

    @Override
    public List<WordDTO> getHighlight(String eng, String vi) throws Exception {
        List<Word> words =  wordAdapter.getHighlight(eng, vi);
        List<WordDTO> wordDTOS = words.stream()
                .map(content -> modelMapper.map(content, WordDTO.class))
                .collect(Collectors.toList());
        return wordDTOS;
    }

    @Override
    public List<WordDTO> getMeaning(String eng, String vi) throws Exception {
        List<Word> words =  wordAdapter.getMeaning(eng, vi);
        List<WordDTO> wordDTOS = words.stream()
                .map(content -> modelMapper.map(content, WordDTO.class))
                .collect(Collectors.toList());
        return wordDTOS;
    }

}
