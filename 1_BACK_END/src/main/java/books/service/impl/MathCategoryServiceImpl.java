package books.service.impl;

import books.dao.interfaces.MathCategoryAdapter;
import books.dto.MathCategoryDTO;
import books.entity.MathCategory;
import books.service.interfaces.MathCategoryService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
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
        List<MathCategoryDTO> dtoList = toDTO(categories);
        injectTongHop(dtoList);
        return dtoList;
    }

    @Override
    public List<MathCategoryDTO> getMathCategoriesByFullPath(String fullPath) throws Exception {
        List<MathCategory> categories = mathCategoryAdapter.getMathCategoriesByFullPath(fullPath);
        List<MathCategoryDTO> dtoList = toDTO(categories);
        injectTongHop(dtoList);
        return dtoList;
    }

    private List<MathCategoryDTO> toDTO(List<MathCategory> categories) {
        return categories.stream()
                .map(c -> modelMapper.map(c, MathCategoryDTO.class))
                .collect(Collectors.toList());
    }

    /**
     * Với mỗi category cha (parentCode = null), thêm 1 child "Bài tập tổng hợp"
     * có categoryCode = categoryCode của cha → frontend gọi /math/questions/{categoryCode}
     * sẽ lấy ngẫu nhiên câu hỏi từ tất cả con.
     */
    private void injectTongHop(List<MathCategoryDTO> categories) {
        for (MathCategoryDTO parent : categories) {
            if (parent.getParentCode() == null || parent.getParentCode().isEmpty()) {
                // Chỉ inject khi có children thực sự
                if (parent.getChildren() != null && !parent.getChildren().isEmpty()) {
                    MathCategoryDTO tongHop = new MathCategoryDTO();
                    tongHop.setCategoryCode(parent.getCategoryCode()); // dùng code cha để query tổng hợp
                    tongHop.setCategoryName("Bài tập tổng hợp");
                    tongHop.setCategoryDesc("Luyện tập ngẫu nhiên tất cả dạng bài trong " + parent.getCategoryName());
                    tongHop.setParentCode(parent.getCategoryCode());
                    tongHop.setStatus(parent.getStatus());
                    tongHop.setFullPath(parent.getFullPath());
                    tongHop.setChildren(new ArrayList<>());

                    // Thêm vào cuối danh sách children
                    List<MathCategoryDTO> newChildren = new ArrayList<>(parent.getChildren());
                    newChildren.add(tongHop);
                    parent.setChildren(newChildren);
                }
            }
        }
    }
}
