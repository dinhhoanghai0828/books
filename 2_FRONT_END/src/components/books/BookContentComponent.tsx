import { useEffect, useState } from 'react';
import Link from 'next/link'; // Import Link from Next.js
import { Book } from '@/interfaces/book';
import { Card, Row, Col, Empty } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useParams } from 'next/navigation';

interface BookContentComponentProps {
  books: Book[];
  loading: boolean;
}

const BookContentComponent = ({ books }: BookContentComponentProps) => {
  const params = useParams();
  const { categorySlug, subcategorySlug } = params;

  return (
    <Content className="bookClass">
      <>
        {books && books.length > 0 ? (
          <Row gutter={[16, 16]} className="bookRowClass">
            {books.map((item) => (
              <Col key={item.id} xs={12} sm={12} md={8} lg={6} xl={4}>
                <Link
                  href={`/${categorySlug}/${subcategorySlug}/${item.slug}`}
                  passHref
                >
                  <Card
                    cover={
                      <img
                        alt={item.eng}
                        src={`/images/${item.img}`} // Sử dụng đường dẫn tĩnh từ thư mục public
                        style={{ width: '100%', height: 'auto' }}
                      />
                    }
                    hoverable
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                    }}
                  >
                    <Card.Meta title={item.vi} description={item.author} />
                  </Card>
                </Link>
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

export default BookContentComponent;
