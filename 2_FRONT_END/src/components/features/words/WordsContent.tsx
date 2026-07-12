'use client';
import { WordItem } from '@/interfaces/word';
import { updateWord } from '@/utils/apiService';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useState } from 'react';
import apiClient from '@/utils/apiClient';
import React from 'react';

const { Text } = Typography;

// ============================================================
// WORDS LIST COMPONENT
// Hien thi danh sach tu voi cac chuc nang:
// - Highlight tu khop voi tu khoa tim kiem
// - Chinh sua tu
// - Xoa tu
// ============================================================

interface WordsListProps {
  words: WordItem[];
  onRefresh: () => void;
  searchEng: string;
  searchVi: string;
}

// Highlight tu khop voi tu khoa tim kiem
const highlight = (text: string, keyword: string): React.ReactNode => {
  if (!keyword) return text;
  const regex = new RegExp(`(${keyword})`, 'gi');
  return text.split(regex).map((part, i) =>
    regex.test(part)
      ? <mark key={i} style={{ backgroundColor: 'yellow', padding: 0 }}>{part}</mark>
      : part
  );
};

const WordsList = React.memo(({
  words,
  onRefresh,
  searchEng,
  searchVi,
}: WordsListProps) => {
  const { notification } = App.useApp();

  // State modal chinh sua
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<WordItem | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm] = Form.useForm();

  // ============================================================
  // EDIT HANDLERS
  // ============================================================

  const handleOpenEdit = (item: WordItem) => {
    setEditItem(item);
    editForm.setFieldsValue({ eng: item.eng, vi: item.vi });
    setEditOpen(true);
  };

  const handleCancelEdit = () => {
    setEditOpen(false);
    setEditItem(null);
    editForm.resetFields();
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    try {
      const values = await editForm.validateFields();
      setEditLoading(true);
      await updateWord(editItem.id, values.eng, values.vi);
      notification.success({
        message: 'Cap nhat thanh cong',
        placement: 'topRight',
        duration: 3,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' },
      });
      handleCancelEdit();
      onRefresh();
    } catch (error: any) {
      if (error?.errorFields) return;
      notification.error({
        message: 'Cap nhat that bai',
        description: error.message,
        placement: 'topRight',
        duration: 4,
        style: { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' },
      });
    } finally {
      setEditLoading(false);
    }
  };

  // ============================================================
  // DELETE HANDLER
  // ============================================================

  const handleDelete = async (item: WordItem) => {
    try {
      await apiClient.delete(`/word/delete/${item.id}`);
      notification.success({
        message: `Da xoa "${item.eng}"`,
        placement: 'topRight',
        duration: 3,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' },
      });
      onRefresh();
    } catch (error: any) {
      notification.error({
        message: 'Xoa that bai',
        description: error.message,
        placement: 'topRight',
        duration: 4,
        style: { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' },
      });
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div style={{ padding: '150px 35px 80px 35px' }}>

      {words.length > 0 ? (
        <Row gutter={[16, 16]}>
          {words.map((item) => (
            <Col key={item.id} xs={24} sm={24} md={12} lg={12}>
              <div className="frameClass" style={{ position: 'relative', paddingBottom: 16 }}>

                {/* Dong tieng Anh + nut sua/xoa */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text strong style={{ fontSize: 16, flex: 1 }}>
                    {highlight(item.eng, searchEng)}
                  </Text>
                  <Space>
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => handleOpenEdit(item)}
                    />
                    <Popconfirm
                      title={`Xoa tu "${item.eng}"?`}
                      description="Hanh dong nay khong the hoan tac."
                      onConfirm={() => handleDelete(item)}
                      okText="Xoa"
                      cancelText="Huy"
                      okButtonProps={{ danger: true }}
                    >
                      <Button type="link" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                </div>

                {/* Dong tieng Viet */}
                <Text style={{ display: 'block', marginTop: 6, color: '#555', fontSize: 15 }}>
                  {highlight(item.vi, searchVi)}
                </Text>

                {/* ID tag */}
                <Tag color="default" style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 11 }}>
                  #{item.id}
                </Tag>
              </div>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description="Khong co du lieu" style={{ marginTop: 80 }} />
      )}

      {/* Modal chinh sua */}
      <Modal
        title="Chinh sua tu"
        open={editOpen}
        onCancel={handleCancelEdit}
        footer={
          <div style={{ textAlign: 'center' }}>
            <Space>
              <Button onClick={handleCancelEdit}>Huy</Button>
              <Button type="primary" loading={editLoading} onClick={handleUpdate}>
                Cap nhat
              </Button>
            </Space>
          </div>
        }
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="ID">
            <Input value={editItem?.id ?? ''} disabled />
          </Form.Item>
          <Form.Item
            label="Tieng Anh"
            name="eng"
            rules={[{ required: true, message: 'Vui long nhap tieng Anh' }]}
          >
            <Input size="large" />
          </Form.Item>
          <Form.Item
            label="Tieng Viet"
            name="vi"
            rules={[{ required: true, message: 'Vui long nhap tieng Viet' }]}
          >
            <Input size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});

WordsList.displayName = 'WordsList';

export default WordsList;
