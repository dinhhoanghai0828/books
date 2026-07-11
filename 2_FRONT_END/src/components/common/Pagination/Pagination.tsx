import { Col, Pagination, Row } from 'antd';

interface PaginationComponentProps {
  currentPage: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
}

// Hien thi thanh phan trang can giua, ho tro thay doi so luong item moi trang
const PaginationComponent = ({
  currentPage,
  pageSize,
  total,
  onPageChange,
}: PaginationComponentProps) => {
  return (
    <div className="pagination-container">
      <Row justify="center" gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={20}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            onChange={onPageChange}
          />
        </Col>
      </Row>
    </div>
  );
};

export default PaginationComponent;
