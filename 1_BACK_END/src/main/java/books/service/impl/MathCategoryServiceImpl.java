package books.service.impl;

import books.dao.interfaces.MathCategoryAdapter;
import books.dto.MathCategoryDTO;
import books.entity.MathCategory;
import books.service.interfaces.MathCategoryService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MathCategoryServiceImpl implements MathCategoryService {
    private MathCategoryAdapter mathCategoryAdapter;
    private ModelMapper modelMapper;

    @Autowired
    public MathCategoryServiceImpl(MathCategoryAdapter mathCategoryAdapter, ModelMapper modelMapper) {
        this.mathCategoryAdapter = mathCategoryAdapter;
        this.modelMapper = modelMapper;
    }

    @Override
    public List<MathCategoryDTO> getMathCategories() throws Exception {
        List<MathCategory> categories = mathCategoryAdapter.getMathCategories();
        return categories.stream()
                .map(category -> modelMapper.map(category, MathCategoryDTO.class))
                .collect(Collectors.toList());
    }
}
