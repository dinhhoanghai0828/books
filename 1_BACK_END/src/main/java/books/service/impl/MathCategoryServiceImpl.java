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
    private final MathCategoryAdapter mathCategoryAdapter;
    private final ModelMapper modelMapper;

    @Autowired
    public MathCategoryServiceImpl(MathCategoryAdapter mathCategoryAdapter, ModelMapper modelMapper) {
        this.mathCategoryAdapter = mathCategoryAdapter;
        this.modelMapper = modelMapper;
    }

    @Override
    public List<MathCategoryDTO> getMathCategories() throws Exception {
        List<MathCategory> categories = mathCategoryAdapter.getMathCategories();
        return toDTO(categories);
    }

    @Override
    public List<MathCategoryDTO> getMathCategoriesByFullPath(String fullPath) throws Exception {
        List<MathCategory> categories = mathCategoryAdapter.getMathCategoriesByFullPath(fullPath);
        return toDTO(categories);
    }

    private List<MathCategoryDTO> toDTO(List<MathCategory> categories) {
        return categories.stream()
                .map(c -> modelMapper.map(c, MathCategoryDTO.class))
                .collect(Collectors.toList());
    }
}
