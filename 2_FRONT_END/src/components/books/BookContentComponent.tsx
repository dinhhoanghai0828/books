import { Book } from '@/interfaces/book';
import { Card, Col, Empty, Row } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BookContentComponentProps {
  books: Book[];
  loading: boolean;
}

// Hien thi danh sach sach duoi dang luoi card, moi card la 1 link den trang danh sach tap
const BookContentComponent = ({ books }: BookContentComponentProps) => {
  const pathname = usePathname();
  const basePath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  return (
    <Content className="bookClass">
      {books && books.length > 0 ? (
        <Row gutter={[16, 16]} className="bookRowClass">
          {books.map((item) => (
            <Col key={item.id} xs={12} sm={12} md={8} lg={6} xl={4}>
              <Link href={`${basePath}/${item.slug}`} passHref>
                <Card
                  cover={
                    <div style={{
                      width: '100%',
                      aspectRatio: '2 / 3',
                      overflow: 'hidden',
                      background: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <img
                        alt={item.eng}
                        src={`/images/${item.img}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          display: 'block',
                        }}
                      />
                    </div>
                  }
                  hoverable
                  style={{ borderRadius: 12, overflow: 'hidden' }}
                >
                  <Card.Meta title={item.vi} description={item.author} />
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description="Khong co du lieu" className="emptyClass" />
      )}
    </Content>
  );
};

export default BookContentComponent;
