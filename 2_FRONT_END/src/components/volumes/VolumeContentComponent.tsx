import { Volume } from '@/interfaces/volume';
import { CheckOutlined, EditOutlined, DownloadOutlined } from '@ant-design/icons';
import { Button, Col, Empty, Form, Input, Modal, Row, Select, Typography, notification } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { updateVolume, runVolumesExport } from '@/utils/apiService';

interface VolumeContentComponentProps {
  volumes: Volume[];
  loading: boolean;
  onVolumeUpdate?: () => void;
}

// Hien thi danh sach cac tap duoi dang luoi 2 cot, moi tap la 1 link den trang noi dung
const VolumeContentComponent = ({ volumes, onVolumeUpdate }: VolumeContentComponentProps) => {
  const params = useParams();
  const { categorySlug, subcategorySlug, bookSlug } = params;

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingVolume, setEditingVolume] = useState<Volume | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm] = Form.useForm();
  const [notifApi, notifContextHolder] = notification.useNotification();
  const [exportLoading, setExportLoading] = useState(false);

  const handleOpenEdit = (volume: Volume, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingVolume(volume);
    editForm.setFieldsValue({
      id: volume.id,
      eng: volume.eng,
      vi: volume.vi,
      startTime: volume.startTime,
      endTime: volume.endTime,
      checked: volume.checked,
    });
    setEditModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditModalOpen(false);
    setEditingVolume(null);
    editForm.resetFields();
  };

  const handleUpdate = async () => {
    if (!editingVolume) return;
    try {
      const values = await editForm.validateFields();
      setEditLoading(true);
      await updateVolume(values.id, values.eng, values.vi, values.startTime, values.endTime, values.checked);
      notifApi.success({
        message: 'Cap nhat thanh cong',
        description: 'Thong tin tap da duoc luu lai.',
        placement: 'topRight',
        duration: 3,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' },
      });
      handleCancelEdit();
      onVolumeUpdate?.();
    } catch (error: any) {
      if (error?.errorFields) return;
      notifApi.error({
        message: 'Cap nhat that bai',
        description: error.message || 'Da xay ra loi, vui long thu lai.',
        placement: 'topRight',
        duration: 4,
        style: { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' },
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleVolumesExport = async () => {
    try {
      setExportLoading(true);
      const message = await runVolumesExport();
      notifApi.success({
        message: 'Xuat SQL thanh cong',
        description: message,
        placement: 'topRight',
        duration: 3,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' },
      });
    } catch (error: any) {
      notifApi.error({
        message: 'Xuat SQL that bai',
        description: error.message || 'Da xay ra loi, vui long thu lai.',
        placement: 'topRight',
        duration: 4,
        style: { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' },
      });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <Content className="volumeClass">
      {notifContextHolder}
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleVolumesExport}
          loading={exportLoading}
          style={{ backgroundColor: '#6366f1', borderColor: '#6366f1', color: '#fff' }}
        >
          Cập nhật Volume
        </Button>
      </div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {volume.checked === 'YES' && (
                        <CheckOutlined style={{ color: 'green' }} />
                      )}
                      <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={(e) => handleOpenEdit(volume, e)}
                        style={{ padding: 0 }}
                      />
                    </div>
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

      <Modal
        title="Chinh sua thong tin tap"
        open={editModalOpen}
        onCancel={handleCancelEdit}
        footer={
          <div style={{ textAlign: 'center' }}>
            <Button onClick={handleCancelEdit}>Huy</Button>
            <Button type="primary" loading={editLoading} onClick={handleUpdate}>
              Cap nhat
            </Button>
          </div>
        }
      >
        {editingVolume && (
          <Form form={editForm} layout="vertical">
            <Form.Item label="ID" name="id">
              <Input disabled />
            </Form.Item>
            <Form.Item
              label="Ten tieng Anh"
              name="eng"
              rules={[{ required: true, message: 'Vui long nhap ten tieng Anh' }]}
            >
              <Input.TextArea rows={3} maxLength={500} showCount />
            </Form.Item>
            <Form.Item
              label="Ten tieng Viet"
              name="vi"
              rules={[{ required: true, message: 'Vui long nhap ten tieng Viet' }]}
            >
              <Input.TextArea rows={3} maxLength={500} showCount />
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
            <Form.Item
              label="Trang thai"
              name="checked"
              rules={[{ required: true, message: 'Vui long chon trang thai' }]}
            >
              <Select placeholder="Chọn trạng thái">
                <Select.Option value="YES">YES</Select.Option>
                <Select.Option value="NO">NO</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </Content>
  );
};

export default VolumeContentComponent;
