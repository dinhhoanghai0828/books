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
        List<MathCategoryDTO> categoryDTOList = categories.stream()
                .map(category -> modelMapper.map(category, MathCategoryDTO.class))
                .collect(Collectors.toList());
        // Build full path for each category
        buildFullPaths(categoryDTOList, null);
        // Debug log
        System.out.println("Math Categories with full paths:");
        for (MathCategoryDTO cat : categoryDTOList) {
            System.out.println(cat.getCategoryName() + " -> fullPath: " + cat.getFullPath());
        }
        return categoryDTOList;
    }

    private void buildFullPaths(List<MathCategoryDTO> categories, String parentPath) {
        for (MathCategoryDTO category : categories) {
            String currentPath = parentPath != null ? parentPath + "/" + category.getCategoryCode() : category.getCategoryCode();
            category.setFullPath(currentPath);
            if (category.getChildren() != null && !category.getChildren().isEmpty()) {
                buildFullPaths(category.getChildren(), currentPath);
            }
        }
    }
}
