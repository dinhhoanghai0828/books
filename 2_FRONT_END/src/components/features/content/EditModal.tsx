import { ContentType } from '@/interfaces/content';
import { Button, Form, Input, Modal, Space } from 'antd';

// ============================================================
// EDIT MODAL COMPONENT
// Modal chinh sua noi dung cau (tieng Anh, tieng Viet, thoi gian)
// ============================================================

interface EditModalProps {
  open: boolean;
  editingItem: ContentType | null;
  form: any;
  loading: boolean;
  onCancel: () => void;
  onUpdate: () => void;
}

const EditModal = ({
  open,
  editingItem,
  form,
  loading,
  onCancel,
  onUpdate,
}: EditModalProps) => {
  return (
    <Modal
      title="Chinh sua noi dung"
      open={open}
      onCancel={onCancel}
      footer={
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button onClick={onCancel}>Huy</Button>
            <Button type="primary" loading={loading} onClick={onUpdate}>
              Cap nhat
            </Button>
          </Space>
        </div>
      }
    >
      {editingItem && (
        <Form form={form} layout="vertical">
          <Form.Item label="ID">
            <Input value={editingItem.id} disabled />
          </Form.Item>
          <Form.Item
            label="Nghia tieng Anh"
            name="eng"
            rules={[{ required: true, message: 'Vui long nhap nghia tieng Anh' }]}
          >
            <Input.TextArea rows={4} maxLength={1000} showCount />
          </Form.Item>
          <Form.Item
            label="Nghia tieng Viet"
            name="vi"
            rules={[{ required: true, message: 'Vui long nhap nghia tieng Viet' }]}
          >
            <Input.TextArea rows={4} maxLength={1000} showCount />
          </Form.Item>
          <Form.Item
            label="Start Time"
            name="startTime"
            rules={[{ pattern: /^\d{2}:\d{2}:\d{2}\.\d{3}$/, message: 'Dinh dang: 00:00:00.000' }]}
          >
            <Input placeholder="00:00:00.000" />
          </Form.Item>
          <Form.Item
            label="End Time"
            name="endTime"
            rules={[{ pattern: /^\d{2}:\d{2}:\d{2}\.\d{3}$/, message: 'Dinh dang: 00:00:00.000' }]}
          >
            <Input placeholder="00:00:00.000" />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default EditModal;
