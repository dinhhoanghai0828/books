import { Button, Form, Input, Modal, Space, notification } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { insertWord } from '@/utils/apiService';

// ============================================================
// INSERT WORD MODAL COMPONENT
// Modal them tu moi vao tu dien
// ============================================================

interface InsertWordModalProps {
  open: boolean;
  loading: boolean;
  form: any;
  onCancel: () => void;
  onInsert: () => void;
}

const InsertWordModal = ({
  open,
  loading,
  form,
  onCancel,
  onInsert,
}: InsertWordModalProps) => {
  return (
    <Modal
      title="Them tu moi"
      open={open}
      onCancel={onCancel}
      footer={
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button onClick={onCancel}>Huy</Button>
            <Button type="primary" loading={loading} onClick={onInsert}>
              Them moi
            </Button>
          </Space>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Tu tieng Anh"
          name="eng"
          rules={[{ required: true, message: 'Vui long nhap tu tieng Anh' }]}
        >
          <Input placeholder="Nhap tu tieng Anh..." />
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
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Form.Item
                      key={field.key}
                      name={[field.name, 'vi']}
                      noStyle
                      rules={
                        index === 0
                          ? [{ required: true, message: 'Vui long nhap nghia' }]
                          : []
                      }
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
  );
};

export default InsertWordModal;
