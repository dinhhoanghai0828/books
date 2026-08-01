import { Volume } from '@/interfaces/volume';
import { CheckOutlined, EditOutlined, DownloadOutlined, BookOutlined } from '@ant-design/icons';
import { Button, Col, Empty, Form, Input, Modal, Row, Select, Typography, notification } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { updateVolume, runVolumesExport, markAsRead, markAsUnread, downloadVolumeWord } from '@/utils/apiService';

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
  const [markReadLoading, setMarkReadLoading] = useState<string | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

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

  const handleMarkAsRead = async (volume: Volume, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setMarkReadLoading(volume.slug);
      await markAsRead(volume.slug);
      notifApi.success({
        message: 'Danh dau thanh cong',
        description: 'Tap da duoc danh dau la da doc xong.',
        placement: 'topRight',
        duration: 3,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' },
      });
      onVolumeUpdate?.();
    } catch (error: any) {
      notifApi.error({
        message: 'Danh dau that bai',
        description: error.message || 'Da xay ra loi, vui long thu lai.',
        placement: 'topRight',
        duration: 4,
        style: { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' },
      });
    } finally {
      setMarkReadLoading(null);
    }
  };

  const handleMarkAsUnread = async (volume: Volume, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setMarkReadLoading(volume.slug);
      await markAsUnread(volume.slug);
      notifApi.success({
        message: 'Danh dau thanh cong',
        description: 'Tap da duoc danh dau la chua doc.',
        placement: 'topRight',
        duration: 3,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' },
      });
      onVolumeUpdate?.();
    } catch (error: any) {
      notifApi.error({
        message: 'Danh dau that bai',
        description: error.message || 'Da xay ra loi, vui long thu lai.',
        placement: 'topRight',
        duration: 4,
        style: { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' },
      });
    } finally {
      setMarkReadLoading(null);
    }
  };

  const handleDownloadWord = async () => {
    try {
      setDownloadLoading(true);
      // Download all volumes for this book as a single Word file
      const slug = Array.isArray(bookSlug) ? bookSlug[0] : bookSlug;
      await downloadVolumeWord(slug || '');
      notifApi.success({
        message: 'Download thanh cong',
        description: 'File Word da duoc tai xuong.',
        placement: 'topRight',
        duration: 3,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' },
      });
    } catch (error: any) {
      notifApi.warning({
        message: 'Download that bai',
        description: 'Chuc nang nay can backend ho tro. Vui long kiem tra API.',
        placement: 'topRight',
        duration: 4,
        style: { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' },
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <Content className="volumeClass">
      {notifContextHolder}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleVolumesExport}
          loading={exportLoading}
          style={{ backgroundColor: '#6366f1', borderColor: '#6366f1', color: '#fff' }}
        >
          Cập nhật Volume
        </Button>
        <Button
          type="default"
          icon={<DownloadOutlined />}
          onClick={handleDownloadWord}
          loading={downloadLoading}
        >
          Download Word
        </Button>
      </div>
      {volumes && volumes.length > 0 ? (
        <Row gutter={[16, 16]}>
          {volumes.map((volume) => (
            <Col span={6} xs={24} sm={24} md={6} lg={6} key={volume.uuid} className="colClass">
              <div
                className="frameClass"
                style={{
                  backgroundColor: volume.isRead === 1 ? '#e6f7ff' : '#ffffff',
                  border: volume.isRead === 1 ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  opacity: volume.isRead === 1 ? 0.9 : 1
                }}
              >
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
                      {volume.isRead === 1 ? (
                        <Button
                          type="link"
                          icon={<BookOutlined />}
                          onClick={(e) => handleMarkAsUnread(volume, e)}
                          loading={markReadLoading === volume.slug}
                          style={{ padding: 0, color: '#1890ff' }}
                          title="Danh dau chua doc"
                        />
                      ) : (
                        <Button
                          type="link"
                          icon={<BookOutlined />}
                          onClick={(e) => handleMarkAsRead(volume, e)}
                          loading={markReadLoading === volume.slug}
                          style={{ padding: 0 }}
                          title="Danh dau da doc xong"
                        />
                      )}
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
