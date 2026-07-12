'use client';
import { insertWord, runWordGeneral } from '@/helpers/apiService';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Col, Form, Input, Modal, Row, Space } from 'antd';
import { useState } from 'react';
import React from 'react';

// ============================================================
// WORDS SEARCH COMPONENT
// Component tim kiem va them tu moi voi cac chuc nang:
// - Tim kiem theo tieng Anh hoac tieng Viet
// - Them tu moi voi nhieu nghia (Form.List)
// - Tong hop du lieu tu (word-general)
// ============================================================

interface WordsSearchProps {
  onSearch: (eng: string, vi: string) => void;
  onWordAdded: () => void;
}

const WordsSearch = React.memo(({ onSearch, onWordAdded }: WordsSearchProps) => {
  const { notification } = App.useApp();

  const [searchEng, setSearchEng] = useState('');
  const [searchVi, setSearchVi] = useState('');
  const [loadingTonghop, setLoadingTonghop] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addForm] = Form.useForm();

  // ============================================================
  // SEARCH HANDLERS
  // ============================================================

  const handleSearch = () => onSearch(searchEng.trim(), searchVi.trim());

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // ============================================================
  // TONG HOP HANDLER
  // Goi word-general, hien notification khi xong
  // ============================================================

  const handleTonghop = async () => {
    setLoadingTonghop(true);
    try {
      const msg = await runWordGeneral();
      notification.success({
        message: msg,
        description: 'Du lieu tu da duoc tong hop.',
        placement: 'topRight',
        duration: 4,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' },
      });
    } catch (error: any) {
      notification.error({
        message: 'Tong hop that bai',
        description: error.message || 'Da xay ra loi, vui long thu lai.',
        placement: 'topRight',
        duration: 4,
        style: { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' },
      });
    } finally {
      setLoadingTonghop(false);
    }
  };

  // ============================================================
  // ADD WORD HANDLERS
  // Them tu moi voi nhieu nghia (Form.List)
  // ============================================================

  const handleOpenAdd = () => {
    addForm.resetFields();
    setAddOpen(true);
  };

  const handleCancelAdd = () => {
    setAddOpen(false);
    addForm.resetFields();
  };

  const handleAdd = async () => {
    try {
      const values = await addForm.validateFields();
      const viList: string[] = values.viList
        .map((it: { vi: string }) => it.vi?.trim())
        .filter(Boolean);
      if (!viList.length) {
        addForm.setFields([{ name: ['viList', 0, 'vi'], errors: ['Vui long nhap it nhat 1 nghia'] }]);
        return;
      }
      setAddLoading(true);
      await insertWord(values.eng.trim(), viList);
      notification.success({
        message: 'Them tu thanh cong',
        placement: 'topRight',
        duration: 3,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' },
      });
      handleCancelAdd();
      onWordAdded();
    } catch (error: any) {
      if (error?.errorFields) return;
      notification.error({
        message: 'Them tu that bai',
        description: error.message,
        placement: 'topRight',
        duration: 4,
        style: { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' },
      });
    } finally {
      setAddLoading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      {/* Thanh search co dinh */}
      <div
        style={{
          position: 'fixed',
          top: 60,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          zIndex: 1000,
          padding: '10px 35px',
          height: 80,
          boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
        }}
      >
        <Row gutter={[16, 16]} align="middle">

          <Col xs={24} sm={6} md={6} lg={6}>
            <Input
              value={searchEng}
              onChange={(e) => setSearchEng(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tim tieng Anh"
              allowClear
              onClear={() => { setSearchEng(''); onSearch('', searchVi); }}
              size="large"
            />
          </Col>

          <Col xs={24} sm={6} md={6} lg={6}>
            <Input
              value={searchVi}
              onChange={(e) => setSearchVi(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tim tieng Viet"
              allowClear
              onClear={() => { setSearchVi(''); onSearch(searchEng, ''); }}
              size="large"
            />
          </Col>

          <Col xs={8} sm={2} md={2} lg={2}>
            <Button type="primary" size="large" onClick={handleSearch} block>
              Tim
            </Button>
          </Col>

          {/* Nut Them tu moi */}
          <Col xs={8} sm={3} md={3} lg={3}>
            <Button
              size="large"
              icon={<PlusOutlined />}
              onClick={handleOpenAdd}
              style={{ backgroundColor: '#6366f1', borderColor: '#6366f1', color: '#fff' }}
              block
            >
              Them tu moi
            </Button>
          </Col>

          {/* Nut Tong hop */}
          <Col xs={8} sm={3} md={3} lg={3}>
            <Button
              size="large"
              loading={loadingTonghop}
              onClick={handleTonghop}
              style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16', color: '#fff' }}
              block
            >
              Tong hop
            </Button>
          </Col>

        </Row>
      </div>

      {/* Modal them tu moi — Form.List cho nhieu nghia */}
      <Modal
        title="Them tu moi"
        open={addOpen}
        onCancel={handleCancelAdd}
        footer={
          <div style={{ textAlign: 'center' }}>
            <Space>
              <Button onClick={handleCancelAdd}>Huy</Button>
              <Button
                type="primary"
                loading={addLoading}
                onClick={handleAdd}
                style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
              >
                Them moi
              </Button>
            </Space>
          </div>
        }
      >
        <Form form={addForm} layout="vertical">
          <Form.Item
            label="Tu tieng Anh"
            name="eng"
            rules={[{ required: true, message: 'Vui long nhap tu tieng Anh' }]}
          >
            <Input placeholder="Nhap tu tieng Anh..." size="large" />
          </Form.Item>

          <Form.List name="viList" initialValue={[{ vi: '' }]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Form.Item
                    key={field.key}
                    label={index === 0 ? 'Nghia tieng Viet' : ''}
                    required={index === 0}
                  >
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Form.Item
                        name={[field.name, 'vi']}
                        noStyle
                        rules={index === 0 ? [{ required: true, message: 'Vui long nhap nghia' }] : []}
                      >
                        <Input placeholder={`Nghia ${index + 1}...`} style={{ flex: 1 }} />
                      </Form.Item>
                      {fields.length > 1 && (
                        <MinusCircleOutlined
                          onClick={() => remove(field.name)}
                          style={{ color: '#ff4d4f', fontSize: 18, cursor: 'pointer' }}
                        />
                      )}
                    </div>
                  </Form.Item>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add({ vi: '' })}
                    icon={<PlusOutlined />}
                    block
                  >
                    Them nghia
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </>
  );
});

WordsSearch.displayName = 'WordsSearch';

export default WordsSearch;
