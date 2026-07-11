package books.service.impl;

import books.dao.interfaces.WordAdapter;
import books.dto.WordDTO;
import books.entity.Word;
import books.service.interfaces.WordService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
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

    @Override
    public int insertWords(String eng, List<String> viList) throws Exception {
        return wordAdapter.insertWords(eng, viList);
    }

    @Override
    public Map<String, Object> getWords(String eng, String vi, String page, String size) throws Exception {
        Map<String, Object> result = wordAdapter.getWords(eng, vi, page, size);
        List<Word> words = (List<Word>) result.get("WORDS");
        List<WordDTO> wordDTOs = words.stream()
                .map(w -> modelMapper.map(w, WordDTO.class))
                .collect(Collectors.toList());
        result.put("WORDS", wordDTOs);
        return result;
    }

    @Override
    public boolean updateWord(Long id, String eng, String vi) throws Exception {
        return wordAdapter.updateWord(id, eng, vi);
    }

    @Override
    public boolean deleteWord(Long id) throws Exception {
        return wordAdapter.deleteWord(id);
    }
}
