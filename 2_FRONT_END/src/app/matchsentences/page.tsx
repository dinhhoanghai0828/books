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
import { Suspense, useEffect, useState } from 'react';
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
    
    setSelectedEn(id);
    
    // Nếu đã chọn VI, thực hiện match
    if (selectedVi) {
      handleMatch(id, selectedVi);
    }
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
    
    setSelectedVi(id);
    
    // Nếu đã chọn EN, thực hiện match
    if (selectedEn) {
      handleMatch(selectedEn, id);
    }
  };

  const handleMatch = (enId: string, viId: string) => {
    const matchNumber = matchedPairs.length + 1;
    setMatchedPairs((prev) => [...prev, { enId, viId, matchNumber }]);
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

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="test-container" style={{ marginTop: 50, marginBottom: 70 }}>
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
        <div style={{ display: 'flex', gap: 60, marginTop: 30 }}>
          {/* Cột tiếng Anh */}
          <div style={{ flex: 1 }}>
            <Text strong style={{ fontSize: 18, marginBottom: 20, display: 'block', color: '#1890ff' }}>
              <span style={{ marginRight: 8 }}>🇬🇧</span>Tiếng Anh
            </Text>
            {shuffledEn.map((item) => {
              const isMatched = matchedPairs.some(p => p.enId === item.id);
              const match = matchedPairs.find(p => p.enId === item.id);
              const isCorrect = match ? checkedResults[match.enId] : undefined;
              const isSelected = selectedEn === item.id;
              
              return (
                <div
                  key={item.id}
                  onClick={() => handleEnClick(item.id)}
                  style={{
                    padding: 16,
                    marginBottom: 12,
                    border: `2px solid ${
                      isSelected ? '#1890ff' : 
                      isMatched ? (isCorrect === true ? '#52c41a' : isCorrect === false ? '#ff4d4f' : '#d9d9d9') : '#e8e8e8'
                    }`,
                    borderRadius: 12,
                    cursor: isChecked || isMatched ? 'default' : 'pointer',
                    backgroundColor: isSelected ? '#e6f7ff' : 
                      isMatched ? (isCorrect === true ? '#f6ffed' : isCorrect === false ? '#fff2f0' : '#fafafa') : '#fff',
                    boxShadow: isSelected ? '0 4px 12px rgba(24, 144, 255, 0.3)' : 
                      isMatched ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease',
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
          <div style={{ flex: 1 }}>
            <Text strong style={{ fontSize: 18, marginBottom: 20, display: 'block', color: '#52c41a' }}>
              <TranslationOutlined style={{ marginRight: 8 }} />Tiếng Việt
            </Text>
            {shuffledVi.map((item) => {
              const isMatched = matchedPairs.some(p => p.viId === item.id);
              const match = matchedPairs.find(p => p.viId === item.id);
              const isCorrect = match ? checkedResults[match.enId] : undefined;
              const isSelected = selectedVi === item.id;
              
              return (
                <div
                  key={item.id}
                  onClick={() => handleViClick(item.id)}
                  style={{
                    padding: 16,
                    marginBottom: 12,
                    border: `2px solid ${
                      isSelected ? '#52c41a' : 
                      isMatched ? (isCorrect === true ? '#52c41a' : isCorrect === false ? '#ff4d4f' : '#d9d9d9') : '#e8e8e8'
                    }`,
                    borderRadius: 12,
                    cursor: isChecked || isMatched ? 'default' : 'pointer',
                    backgroundColor: isSelected ? '#f6ffed' : 
                      isMatched ? (isCorrect === true ? '#f6ffed' : isCorrect === false ? '#fff2f0' : '#fafafa') : '#fff',
                    boxShadow: isSelected ? '0 4px 12px rgba(82, 196, 26, 0.3)' : 
                      isMatched ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease',
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
