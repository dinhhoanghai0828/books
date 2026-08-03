package books.service.impl;

import books.dao.interfaces.ContentAdapter;
import books.dao.interfaces.WordAdapter;
import books.dto.ContentDTO;
import books.entity.Content;
import books.service.interfaces.ContentService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ContentServiceImpl implements ContentService {
    private ContentAdapter contentAdapter;
    private WordAdapter wordAdapter;
    private ModelMapper modelMapper;

    @Autowired
    public ContentServiceImpl(ContentAdapter contentAdapter, WordAdapter wordAdapter, ModelMapper modelMapper) {
        this.contentAdapter = contentAdapter;
        this.wordAdapter = wordAdapter;
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

    @Override
    public boolean updateContent(Long id, String eng, String vi, String startTime, String endTime) throws Exception {
        return contentAdapter.updateContent(id, eng, vi, startTime, endTime);
    }

    @Override
    public Map<String, List<String>> getMissingWords(List<ContentDTO> contents) throws Exception {
        Map<String, List<String>> result = new HashMap<>();
        
        // Collect all unique words from all contents
        Set<String> allWords = new HashSet<>();
        for (ContentDTO content : contents) {
            if (content.getEng() != null) {
                String[] words = content.getEng().split("\\s+");
                for (String word : words) {
                    String cleanWord = word.replaceAll("[.,?!\"';]", "").toLowerCase();
                    if (!cleanWord.isEmpty()) {
                        allWords.add(cleanWord);
                    }
                }
            }
        }
        
        // Check which words exist in dictionary (words table)
        Set<String> wordsInDictionary = new HashSet<>();
        for (String word : allWords) {
            try {
                List<books.entity.Word> foundWords = wordAdapter.getEngWords(word);
                if (!foundWords.isEmpty()) {
                    wordsInDictionary.add(word.toLowerCase());
                }
            } catch (Exception e) {
                // If check fails, assume word is not in dictionary
                continue;
            }
        }
        
        // Check which words exist in MISSING_WORDS table (words to skip highlighting)
        Set<String> wordsInMissingWordsTable = new HashSet<>();
        for (String word : allWords) {
            try {
                boolean inMissingWords = wordAdapter.isInMissingWords(word);
                if (inMissingWords) {
                    wordsInMissingWordsTable.add(word.toLowerCase());
                }
            } catch (Exception e) {
                continue;
            }
        }
        
        // For each content, find words NOT in dictionary AND NOT in MISSING_WORDS table
        for (ContentDTO content : contents) {
            List<String> missingWords = new ArrayList<>();
            if (content.getEng() != null) {
                String[] words = content.getEng().split("\\s+");
                for (String word : words) {
                    String cleanWord = word.replaceAll("[.,?!\"';]", "").toLowerCase();
                    // Highlight if: NOT in dictionary AND NOT in MISSING_WORDS table
                    if (!cleanWord.isEmpty() && !wordsInDictionary.contains(cleanWord) && !wordsInMissingWordsTable.contains(cleanWord)) {
                        missingWords.add(cleanWord);
                    }
                }
            }
            result.put(String.valueOf(content.getId()), missingWords);
        }
        
        return result;
    }
}
