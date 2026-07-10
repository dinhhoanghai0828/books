import { Volume } from '@/interfaces/volume';
import { CheckOutlined } from '@ant-design/icons';
import { Col, Empty, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface VolumeContentComponentProps {
  volumes: Volume[];
  loading: boolean;
}

// Hien thi danh sach cac tap duoi dang luoi 2 cot, moi tap la 1 link den trang noi dung
const VolumeContentComponent = ({ volumes }: VolumeContentComponentProps) => {
  const params = useParams();
  const { categorySlug, subcategorySlug, bookSlug } = params;

  return (
    <Content className="volumeClass">
      {volumes && volumes.length > 0 ? (
        <Row gutter={[16, 16]}>
          {volumes.map((volume) => (
            <Col span={8} xs={24} sm={24} md={12} lg={12} key={volume.uuid} className="colClass">
              <div className="frameClass">
                <Link
                  href={`/${categorySlug}/${subcategorySlug}/${bookSlug}/${volume.slug}`}
                  className="volume-link"
                >
                  {/* Dong so tap va icon da hoc */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography.Title level={5} style={{ marginBottom: 0 }}>
                      Tap {volume.number}
                    </Typography.Title>
                    {volume.checked === 'YES' && (
                      <CheckOutlined style={{ color: 'green' }} />
                    )}
                  </div>

                  {/* Ten tap tieng Anh va tieng Viet */}
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
        <Empty description="Khong co du lieu" className="emptyClass" />
      )}
    </Content>
  );
};

export default VolumeContentComponent;
