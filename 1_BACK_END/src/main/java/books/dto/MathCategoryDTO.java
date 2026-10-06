package books.dto;

import java.util.List;

public class MathCategoryDTO {
    private String categoryCode;
    private String categoryName;
    private String categoryDesc;
    private String parentCode;
    private String status;
    private String fullPath;
    private List<MathCategoryDTO> children;

    public String getCategoryCode() { return categoryCode; }
    public void setCategoryCode(String categoryCode) { this.categoryCode = categoryCode; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getCategoryDesc() { return categoryDesc; }
    public void setCategoryDesc(String categoryDesc) { this.categoryDesc = categoryDesc; }

    public String getParentCode() { return parentCode; }
    public void setParentCode(String parentCode) { this.parentCode = parentCode; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getFullPath() { return fullPath; }
    public void setFullPath(String fullPath) { this.fullPath = fullPath; }

    public List<MathCategoryDTO> getChildren() { return children; }
    public void setChildren(List<MathCategoryDTO> children) { this.children = children; }
}
