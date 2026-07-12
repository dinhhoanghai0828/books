import { ContentType } from '@/interfaces/content';
import {
  CheckOutlined,
  EditOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  RetweetOutlined,
  RollbackOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';

const { Text } = Typography;

// ============================================================
// CONTENT CARD COMPONENT
// Hien thi 1 card noi dung (cau tieng Anh + tieng Viet + cac nut dieu khien)
// ============================================================

interface ContentCardProps {
  item: ContentType;
  isPlaying: boolean;
  isLooping: boolean;
  highlightedEnKeywords: string[];
  highlightedViKeywords: string[];
  searchValueEn: string;
  searchValueVi: string;
  onToggleAudio: (itemId: string, audioPath: string, startTime: string, endTime: string) => void;
  onToggleLoop: (itemId: string) => void;
  onOpenVideo: (videoPath: string, startTime: string, endTime: string) => void;
  onOpenEdit: (item: ContentType) => void;
}

// Highlight cac tu khop voi keywords trong doan van ban
const highlightText = (
  text: string,
  keywords: string[] | string
): React.ReactNode => {
  const keywordList = Array.isArray(keywords) ? keywords : [keywords];
  if (!keywordList.length || (keywordList.length === 1 && !keywordList[0])) {
    return text;
  }
  const regex = new RegExp(`(${keywordList.join('|')})`, 'gi');
  return text.split(regex).map((part, index) =>
    regex.test(part)
      ? <mark key={index} style={{ backgroundColor: 'yellow' }}>{part}</mark>
      : part
  );
};

const ContentCard = ({
  item,
  isPlaying,
  isLooping,
  highlightedEnKeywords,
  highlightedViKeywords,
  searchValueEn,
  searchValueVi,
  onToggleAudio,
  onToggleLoop,
  onOpenVideo,
  onOpenEdit,
}: ContentCardProps) => {
  return (
    <div className="frameClass">
      {/* Dong tieng Anh + nut play + nut loop + nut chinh sua */}
      <div className="audioClass">
        <Text strong className="engClass">
          {highlightText(
            item.eng,
            highlightedEnKeywords.length > 0 ? highlightedEnKeywords : searchValueEn
          )}
        </Text>
        <Space>
          {item.checked === 'YES' && (
            <CheckOutlined style={{ color: 'green', fontSize: 22 }} />
          )}
          {/* Nut Play / Pause */}
          <Button
            type="link"
            icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
            onClick={() => onToggleAudio(item.id, item.audio, item.startTime, item.endTime)}
          />
          {/* Nut bat/tat lap lai, chi hoat dong khi item dang phat */}
          <Button
            type="link"
            icon={isLooping ? <RetweetOutlined /> : <RollbackOutlined />}
            disabled={!isPlaying}
            onClick={() => onToggleLoop(item.id)}
          />
          {/* Nut xem video (chi hien khi item co video) */}
          {item.video && (
            <Button
              type="link"
              icon={<VideoCameraOutlined />}
              onClick={() => onOpenVideo(item.video!, item.startTime, item.endTime)}
            />
          )}
          {/* Nut mo modal chinh sua */}
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onOpenEdit(item)}
          />
        </Space>
      </div>

      {/* Dong tieng Viet */}
      <Text className="viClass paddingBottom">
        {highlightText(
          item.vi,
          highlightedViKeywords.length > 0 ? highlightedViKeywords : searchValueVi
        )}
      </Text>

      {/* Ten sach */}
      <div className="bookEngName">{item.bookEngName}</div>
    </div>
  );
};

export default ContentCard;
