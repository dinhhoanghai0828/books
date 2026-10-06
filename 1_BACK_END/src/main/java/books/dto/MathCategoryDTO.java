package books.dto;

import java.util.List;

public class MathCategoryDTO {
    private Integer id;
    private String categoryCode;
    private String categoryName;
    private Integer parentId;
    private String status;
    private List<MathCategoryDTO> children;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getCategoryCode() {
        return categoryCode;
    }

    public void setCategoryCode(String categoryCode) {
        this.categoryCode = categoryCode;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public Integer getParentId() {
        return parentId;
    }

    public void setParentId(Integer parentId) {
        this.parentId = parentId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<MathCategoryDTO> getChildren() {
        return children;
    }

    public void setChildren(List<MathCategoryDTO> children) {
        this.children = children;
    }
}
