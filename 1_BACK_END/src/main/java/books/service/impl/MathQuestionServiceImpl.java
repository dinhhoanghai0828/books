package books.service.impl;

import books.dao.interfaces.MathQuestionAdapter;
import books.dto.MathAnswerDTO;
import books.dto.MathQuestionDTO;
import books.entity.MathQuestion;
import books.service.interfaces.MathQuestionService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MathQuestionServiceImpl implements MathQuestionService {
    private MathQuestionAdapter mathQuestionAdapter;
    private ModelMapper modelMapper;

    @Autowired
    public MathQuestionServiceImpl(MathQuestionAdapter mathQuestionAdapter, ModelMapper modelMapper) {
        this.mathQuestionAdapter = mathQuestionAdapter;
        this.modelMapper = modelMapper;
    }

    @Override
    public List<MathQuestionDTO> getQuestionsByCategoryCode(String categoryCode) throws Exception {
        List<MathQuestion> questions = mathQuestionAdapter.getQuestionsByCategoryCode(categoryCode);
        return questions.stream()
                .map(question -> {
                    MathQuestionDTO dto = modelMapper.map(question, MathQuestionDTO.class);
                    // Map answers separately
                    if (question.getAnswers() != null) {
                        List<MathAnswerDTO> answerDTOs = question.getAnswers().stream()
                                .map(answer -> modelMapper.map(answer, MathAnswerDTO.class))
                                .collect(Collectors.toList());
                        dto.setAnswers(answerDTOs);
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }
}
