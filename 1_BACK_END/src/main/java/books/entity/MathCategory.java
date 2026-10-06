package books.entity;

import java.util.List;

public class MathCategory {
    private Integer id;
    private String categoryCode;
    private String categoryName;
    private Integer parentId;
    private String status;
    private List<MathCategory> children;

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

    public List<MathCategory> getChildren() {
        return children;
    }

    public void setChildren(List<MathCategory> children) {
        this.children = children;
    }
}
