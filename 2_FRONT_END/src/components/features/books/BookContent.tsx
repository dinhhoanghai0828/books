import { Book } from '@/interfaces/book';
import { Card, Col, Empty, Row } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React from 'react';

// ============================================================
// BOOK LIST COMPONENT
// Hien thi danh sach sach duoi dang luoi card
// Moi card la 1 link den trang danh sach tap cua sach do
// ============================================================

interface BookListProps {
  books: Book[];
  loading: boolean;
}

const BookList = React.memo(({ books }: BookListProps) => {
  const params = useParams();
  const { categorySlug, subcategorySlug } = params;

  return (
    <Content className="bookClass">
      {books && books.length > 0 ? (
        <Row gutter={[16, 16]} className="bookRowClass">
          {books.map((item) => (
            <Col key={item.id} xs={12} sm={12} md={8} lg={6} xl={4}>
              <Link href={`/${categorySlug}/${subcategorySlug}/${item.slug}`} passHref>
                <Card
                  cover={
                    <img
                      alt={item.eng}
                      src={`/images/${item.img}`}
                      style={{ width: '100%', height: 'auto' }}
                    />
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
});

BookList.displayName = 'BookList';

export default BookList;
