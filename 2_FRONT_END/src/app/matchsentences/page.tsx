'use client';
import { ContentType } from '@/interfaces/content';
import { getTests } from '@/utils/apiService';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  LinkOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { Button, Modal, Spin, Typography, message } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useRef } from 'react';
import '../../styles/global.css';

const { Text } = Typography;

// So cau hoi mac dinh moi lan kiem tra
const DEFAULT_LIMIT = '20';

// Xao tron mang

const shuffleArray = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

// ============================================================
// COMPONENT
// ============================================================

const MatchSentencesPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const volumeSlug = searchParams?.get('volumeSlug') || '';

  const [sentences, setSentences] = useState<ContentType[]>([]);
  const [shuffledEn, setShuffledEn] = useState<ContentType[]>([]);
  const [shuffledVi, setShuffledVi] = useState<ContentType[]>([]);
  const [selectedEn, setSelectedEn] = useState<string | null>(null);
  const [selectedVi, setSelectedVi] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<{ enId: string; viId: string; matchNumber: number }[]>([]);
  const [checkedResults, setCheckedResults] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [openResultModal, setOpenResultModal] = useState(false);
  const [limit] = useState(DEFAULT_LIMIT);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const enRefs = useRef<Record<string, HTMLDivElement>>({});
  const viRefs = useRef<Record<string, HTMLDivElement>>({});
  const [selectedLinePath, setSelectedLinePath] = useState<string>('');

  // ============================================================
  // DATA FETCHING
  // ============================================================

  const fetchData = async (limitValue: string) => {
    setLoading(true);
    try {
      const response = await getTests(volumeSlug, limitValue);
      setSentences(response);
      
      // Tạo bản sao xáo trộn cho EN và VI
      const shuffledEn = shuffleArray(response);
      const shuffledVi = shuffleArray(response);
      
      setShuffledEn(shuffledEn);
      setShuffledVi(shuffledVi);
    } catch (error) {
      console.error('Loi khi lay du lieu kiem tra:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(DEFAULT_LIMIT);
  }, [volumeSlug]);

  // ============================================================
  // MATCHING LOGIC
  // ============================================================

  const handleEnClick = (id: string) => {
    if (isChecked) return;
    
    // Nếu đã match rồi, không cho chọn lại
    if (matchedPairs.some(p => p.enId === id)) return;
    
    // Nếu click lại vào item đã chọn, bỏ chọn
    if (selectedEn === id) {
      setSelectedEn(null);
      return;
    }
    
    // Nếu đã chọn EN khác, thay thế
    setSelectedEn(id);
  };

  const handleViClick = (id: string) => {
    if (isChecked) return;
    
    // Nếu đã match rồi, không cho chọn lại
    if (matchedPairs.some(p => p.viId === id)) return;
    
    // Nếu click lại vào item đã chọn, bỏ chọn
    if (selectedVi === id) {
      setSelectedVi(null);
      return;
    }
    
    // Nếu đã chọn VI khác, thay thế
    setSelectedVi(id);
  };

  const handleMatch = () => {
    if (!selectedEn || !selectedVi) return;
    const matchNumber = matchedPairs.length + 1;
    setMatchedPairs((prev) => [...prev, { enId: selectedEn, viId: selectedVi, matchNumber }]);
    setSelectedEn(null);
    setSelectedVi(null);
  };

  const handleUnmatch = (enId: string) => {
    if (isChecked) return;
    setMatchedPairs((prev) => {
      const removed = prev.filter(p => p.enId !== enId);
      // Re-number remaining matches
      return removed.map((p, idx) => ({ ...p, matchNumber: idx + 1 }));
    });
  };

  // ============================================================
  // CHECK RESULTS
  // ============================================================

  const handleCheckResults = () => {
    setConfirmLoading(true);
    setTimeout(() => {
      setOpenConfirmModal(false);
      setConfirmLoading(false);

      const results = matchedPairs.reduce((acc, pair) => {
        // Kiểm tra xem EN và VI có cùng id không (cùng 1 câu)
        acc[pair.enId] = pair.enId === pair.viId;
        return acc;
      }, {} as Record<string, boolean>);

      setCheckedResults(results);
      setIsChecked(true);
      setScore(Object.values(results).filter(Boolean).length);
      setOpenResultModal(true);
    }, 100);
  };

  const reloadTest = async () => {
    setLoading(true);
    setSentences([]);
    setShuffledEn([]);
    setShuffledVi([]);
    setSelectedEn(null);
    setSelectedVi(null);
    setMatchedPairs([]);
    setCheckedResults({});
    setIsChecked(false);
    setScore(0);
    await fetchData(limit);
  };

  // Get all matched EN and VI IDs
  const matchedEnIds = matchedPairs.map(p => p.enId);
  const matchedViIds = matchedPairs.map(p => p.viId);

  // Calculate connection line path when items are selected
  useEffect(() => {
    if (!selectedEn || !selectedVi) {
      setSelectedLinePath('');
      return;
    }

    const calculatePath = () => {
      const enEl = enRefs.current[selectedEn];
      const viEl = viRefs.current[selectedVi];
      const containerRect = containerRef.current?.getBoundingClientRect();
      
      if (!enEl || !viEl || !containerRect) {
        setSelectedLinePath('');
        return;
      }

      const enRect = enEl.getBoundingClientRect();
      const viRect = viEl.getBoundingClientRect();
      
      // Calculate positions relative to container
      // Subtract header offset (title + back button + margin)
      const headerOffset = 135; // Approximate height of header elements
      const xOffset = 30; // Shift line to the left
      const enX = enRect.right - containerRect.left - xOffset;
      const enY = enRect.top + enRect.height / 2 - containerRect.top - headerOffset;
      const viX = viRect.left - containerRect.left - xOffset;
      const viY = viRect.top + viRect.height / 2 - containerRect.top - headerOffset;
      
      // Draw bezier curve
      const midX = (enX + viX) / 2;
      const path = `M ${enX} ${enY} C ${midX} ${enY}, ${midX} ${viY}, ${viX} ${viY}`;
      
      setSelectedLinePath(path);
    };

    // Use multiple timeouts to ensure DOM is updated
    const timeout1 = setTimeout(calculatePath, 0);
    const timeout2 = setTimeout(calculatePath, 50);
    const timeout3 = setTimeout(calculatePath, 100);
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [selectedEn, selectedVi, shuffledEn, shuffledVi]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="test-container" style={{ marginTop: 50, marginBottom: 70 }} ref={containerRef}>
      <Typography.Title level={3} className="test-title">
        Ghép câu
      </Typography.Title>

      <div className="back-button-container">
        <Button onClick={() => router.back()} className="back-btn">
          ⬅ Quay lại
        </Button>
      </div>

      {loading ? (
        <Spin size="large" />
      ) : (
        <div style={{ display: 'flex', gap: 100, marginTop: 30, position: 'relative' }}>
          {/* SVG overlay for connection line */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            {selectedLinePath && (
              <path
                d={selectedLinePath}
                stroke="#fa8c16"
                strokeWidth="4"
                fill="none"
              />
            )}
          </svg>
          
          {/* Match button when both sides selected */}
          {selectedEn && selectedVi && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
            }}>
              <Button
                type="primary"
                onClick={handleMatch}
                style={{
                  backgroundColor: '#fa8c16',
                  borderColor: '#fa8c16',
                }}
              >
                Ghép
              </Button>
            </div>
          )}
          
          {/* Cột tiếng Anh */}
          <div style={{ flex: 1, overflow: 'visible' }}>
            <Text strong style={{ fontSize: 18, marginBottom: 20, display: 'block', color: '#1890ff' }}>
              <span style={{ marginRight: 8 }}>🇬🇧</span>Tiếng Anh
            </Text>
            {shuffledEn.map((item) => {
              const isMatched = matchedPairs.some(p => p.enId === item.id);
              const match = matchedPairs.find(p => p.enId === item.id);
              const isCorrect = match ? checkedResults[match.enId] : undefined;
              const isSelected = selectedEn === item.id;
              const isUnselected = isChecked && !isMatched;
              const bothSelected = selectedEn && selectedVi;
              
              return (
                <div
                  key={item.id}
                  ref={(el) => { if (el) enRefs.current[item.id] = el; }}
                  onClick={() => handleEnClick(item.id)}
                  style={{
                    padding: 16,
                    marginBottom: 12,
                    border: `2px solid ${
                      isSelected ? '#fa8c16' : 
                      isUnselected ? '#ff4d4f' :
                      isMatched ? (isCorrect === true ? '#52c41a' : isCorrect === false ? '#ff4d4f' : '#d9d9d9') : '#e8e8e8'
                    }`,
                    borderRadius: 12,
                    cursor: isChecked || isMatched ? 'default' : 'pointer',
                    backgroundColor: isSelected ? '#fff7e6' : 
                      isUnselected ? '#fff2f0' :
                      isMatched ? (isCorrect === true ? '#f6ffed' : isCorrect === false ? '#fff2f0' : '#fafafa') : '#fff',
                    boxShadow: isSelected ? '0 4px 12px rgba(250, 140, 22, 0.3)' : 
                      isMatched ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 15, flex: 1 }}>{item.eng}</Text>
                    {isMatched && match && (
                      <div style={{
                        backgroundColor: isCorrect === true ? '#52c41a' : isCorrect === false ? '#ff4d4f' : '#1890ff',
                        color: '#fff',
                        borderRadius: '50%',
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: 14,
                      }}>
                        {match.matchNumber}
                      </div>
                    )}
                  </div>
                  {isMatched && !isChecked && (
                    <Button
                      type="link"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnmatch(item.id);
                      }}
                      style={{ 
                        marginTop: 8, 
                        padding: 0,
                        color: '#ff4d4f',
                        fontSize: 12
                      }}
                    >
                      Hủy ghép
                    </Button>
                  )}
                  {isChecked && isCorrect !== undefined && (
                    <span style={{ float: 'right', fontSize: 18 }}>
                      {isCorrect ? '✅' : '❌'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cột tiếng Việt */}
          <div style={{ flex: 1, overflow: 'visible' }}>
            <Text strong style={{ fontSize: 18, marginBottom: 20, display: 'block', color: '#52c41a' }}>
              <TranslationOutlined style={{ marginRight: 8 }} />Tiếng Việt
            </Text>
            {shuffledVi.map((item) => {
              const isMatched = matchedPairs.some(p => p.viId === item.id);
              const match = matchedPairs.find(p => p.viId === item.id);
              const isCorrect = match ? checkedResults[match.enId] : undefined;
              const isSelected = selectedVi === item.id;
              const isUnselected = isChecked && !isMatched;
              const bothSelected = selectedEn && selectedVi;
              
              return (
                <div
                  key={item.id}
                  ref={(el) => { if (el) viRefs.current[item.id] = el; }}
                  onClick={() => handleViClick(item.id)}
                  style={{
                    padding: 16,
                    marginBottom: 12,
                    border: `2px solid ${
                      isSelected ? '#fa8c16' : 
                      isUnselected ? '#ff4d4f' :
                      isMatched ? (isCorrect === true ? '#52c41a' : isCorrect === false ? '#ff4d4f' : '#d9d9d9') : '#e8e8e8'
                    }`,
                    borderRadius: 12,
                    cursor: isChecked || isMatched ? 'default' : 'pointer',
                    backgroundColor: isSelected ? '#fff7e6' : 
                      isUnselected ? '#fff2f0' :
                      isMatched ? (isCorrect === true ? '#f6ffed' : isCorrect === false ? '#fff2f0' : '#fafafa') : '#fff',
                    boxShadow: isSelected ? '0 4px 12px rgba(250, 140, 22, 0.3)' : 
                      isMatched ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 15, flex: 1 }}>{item.vi}</Text>
                    {isMatched && match && (
                      <div style={{
                        backgroundColor: isCorrect === true ? '#52c41a' : isCorrect === false ? '#ff4d4f' : '#1890ff',
                        color: '#fff',
                        borderRadius: '50%',
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: 14,
                      }}>
                        {match.matchNumber}
                      </div>
                    )}
                  </div>
                  {isChecked && isCorrect !== undefined && (
                    <span style={{ float: 'right', fontSize: 18 }}>
                      {isCorrect ? '✅' : '❌'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="button-container" style={{ marginTop: 40 }}>
        <Button
          type="primary"
          size="large"
          onClick={() => setOpenConfirmModal(true)}
          className="check-btn"
          disabled={isChecked || matchedPairs.length === 0}
          style={{ 
            height: 45, 
            fontSize: 16,
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
          }}
        >
          <LinkOutlined /> Kiểm tra kết quả
        </Button>
        <Button 
          onClick={reloadTest} 
          className="reload-btn"
          size="large"
          style={{ 
            height: 45, 
            fontSize: 16,
            borderRadius: 8
          }}
        >
          <ReloadOutlined /> Làm lại
        </Button>
      </div>

      <Modal
        title="Xác nhận"
        open={openConfirmModal}
        onOk={handleCheckResults}
        confirmLoading={confirmLoading}
        onCancel={() => setOpenConfirmModal(false)}
        centered
        okText="Kiểm tra"
        cancelText="Hủy"
      >
        <p style={{ fontSize: 16 }}>Bạn có chắc chắn muốn kiểm tra kết quả?</p>
      </Modal>

      {isChecked && (
        <Modal
          title={
            <div style={{ textAlign: 'center', fontSize: 28, fontWeight: 'bold' }}>
              Kết quả
            </div>
          }
          open={openResultModal}
          onOk={() => setOpenResultModal(false)}
          onCancel={() => setOpenResultModal(false)}
          width={600}
          centered
          footer={
            <div style={{ textAlign: 'center' }}>
              <Button type="primary" onClick={() => setOpenResultModal(false)} size="large">
                OK
              </Button>
              <Button onClick={() => setOpenResultModal(false)} style={{ marginLeft: 10 }} size="large">
                Hủy
              </Button>
            </div>
          }
        >
          <div style={{ textAlign: 'center', fontSize: 24, padding: '20px 0' }}>
            {score === matchedPairs.length ? (
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 80 }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 80 }} />
            )}
          </div>
          <Text
            className="score"
            style={{
              display: 'block',
              textAlign: 'center',
              marginTop: 20,
              fontSize: 24,
              fontWeight: 'bold',
              color: score === matchedPairs.length ? '#52c41a' : '#ff4d4f'
            }}
          >
            Điểm: {score} / {matchedPairs.length}
          </Text>
        </Modal>
      )}
    </div>
  );
};

const MatchSentencesPageWrapper = () => (
  <Suspense fallback={<Spin size="large" />}>
    <MatchSentencesPage />
  </Suspense>
);

export default MatchSentencesPageWrapper;
