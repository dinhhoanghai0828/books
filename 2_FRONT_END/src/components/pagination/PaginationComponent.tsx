import { Col, Pagination, Row } from 'antd';

interface PaginationComponentProps {
  currentPage: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
}

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
            showSizeChanger={true} // Hiển thị size changer trên mọi chế độ
            onChange={(page, size) => onPageChange(page, size)}
          />
        </Col>
      </Row>
    </div>
  );
};

export default PaginationComponent;
