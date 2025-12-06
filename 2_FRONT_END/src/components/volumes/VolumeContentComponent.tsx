import { Volume } from '@/interfaces/volume';
import Link from 'next/link';
import { Col, Empty, List, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useParams } from 'next/navigation';
import { useMediaQuery } from 'react-responsive';
import { CheckOutlined } from '@ant-design/icons'; // Import the CheckOutlined icon

interface VolumeContentComponentProps {
  volumes: Volume[];
  loading: boolean;
}

const VolumeContentComponent = ({
  volumes,
  loading,
}: VolumeContentComponentProps) => {
  const params = useParams();
  const { categorySlug, subcategorySlug, bookSlug } = params;

  // Xác định kích thước màn hình, nếu là màn hình nhỏ hơn 768px thì column = 1, ngược lại column = 2
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  const columnCount = isMobile ? 1 : 2; // Số cột tùy vào kích thước màn hình

  return (
    <Content className="volumeClass">
      <>
        {volumes && volumes.length > 0 ? (
          <Row gutter={[16, 16]}>
            {volumes.map((volume) => (
              <Col
                span={8}
                xs={24}
                sm={24}
                md={12}
                lg={12}
                key={volume.uuid}
                className="colClass"
              >
                <div className="frameClass">
                  <Link
                    href={`/${categorySlug}/${subcategorySlug}/${bookSlug}/${volume.slug}`}
                    className="volume-link"
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      {/* Volume number */}
                      <Typography.Title level={5} style={{ marginBottom: 0 }}>
                        Tập {volume.number}
                      </Typography.Title>

                      {/* Display the CheckOutlined icon if checked is "YES" */}
                      {volume.checked === 'YES' && (
                        <CheckOutlined style={{ color: 'green' }} />
                      )}
                    </div>
                    {/* Hiển thị eng trên một dòng và vi trên dòng tiếp theo */}
                    <div>
                      <Typography.Text strong className="engClass">
                        {volume.eng}
                      </Typography.Text>
                    </div>
                    <div>
                      <Typography.Text>{volume.vi}</Typography.Text>
                    </div>
                  </Link>
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="Không có dữ liệu" className="emptyClass" />
        )}
      </>
    </Content>
  );
};

export default VolumeContentComponent;
