import { Modal } from 'antd';

// ============================================================
// VIDEO MODAL COMPONENT
// Modal xem video voi khoang thoi gian cu the
// ============================================================

interface VideoModalProps {
  open: boolean;
  videoSrc: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  videoStartTime: number;
  videoEndTime: number;
  onClose: () => void;
  onLoaded: () => void;
  onTimeUpdate: () => void;
}

const VideoModal = ({
  open,
  videoSrc,
  videoRef,
  videoStartTime,
  videoEndTime,
  onClose,
  onLoaded,
  onTimeUpdate,
}: VideoModalProps) => {
  return (
    <Modal
      title="Xem video"
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      destroyOnClose
    >
      <video
        ref={videoRef}
        src={videoSrc}
        controls
        onLoadedMetadata={onLoaded}
        onTimeUpdate={onTimeUpdate}
        style={{ width: '100%', borderRadius: 8 }}
      />
    </Modal>
  );
};

export default VideoModal;
