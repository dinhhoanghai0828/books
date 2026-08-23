'use client';
import { ContentType } from '@/interfaces/content';
import { getTests, getMeaningWords } from '@/utils/apiService';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  LinkOutlined,
  TranslationOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { Button, Modal, Spin, Typography, message, Select, Switch } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import debounce from 'lodash.debounce';
import '../../styles/global.css';

const { Text } = Typography;

const TOOLTIP_STYLE: React.CSSProperties = {
  position: 'fixed',
  backgroundColor: '#1d1d2e',
  color: 'white',
  padding: '10px 14px',
  borderRadius: 10,
  boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
  zIndex: 10000,
  maxWidth: 360,
  wordWrap: 'break-word',
  fontSize: 14,
  lineHeight: '1.85',
  pointerEvents: 'auto',
  borderLeft: '4px solid #108ee9',
};

const TOOLTIP_BODY_STYLE: React.CSSProperties = {
  maxHeight: '60vh',
  overflowY: 'auto',
  overflowX: 'hidden',
  pointerEvents: 'auto',
};

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
  const [matchedLinePaths, setMatchedLinePaths] = useState<Array<{ enId: string; viId: string; path: string; color: string }>>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // State for word meaning tooltip
  const [meaningEnKeywords, setMeaningEnKeywords] = useState<string[]>([]);
  const [meaningViKeywords, setMeaningViKeywords] = useState<string[]>([]);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [autoRead, setAutoRead] = useState(true);
  const meaningEnRef = useRef<string[]>([]);
  const meaningViRef = useRef<string[]>([]);
  meaningEnRef.current = meaningEnKeywords;
  meaningViRef.current = meaningViKeywords;

  // Load available voices for TTS
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        // Select default English voice
        const enVoice = voices.find(v => v.lang.startsWith('en'));
        if (enVoice) {
          setSelectedVoice(enVoice.name);
        }
      };
      
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Text-to-speech function
  const speakText = useCallback((text: string) => {
    if (!text || text.trim().length === 0) {
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const cleanedText = text
        .replace(/\s+/g, ' ')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim();

      try {
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utterance.rate = 1.0;
        utterance.lang = /^[a-zA-Z ]+$/.test(cleanedText) ? 'en-US' : 'vi-VN';

        if (selectedVoice) {
          const voice = availableVoices.find(v => v.name === selectedVoice);
          if (voice) {
            utterance.voice = voice;
          }
        }

        utterance.onerror = (event) => {
          console.error('TTS Error:', event.error);
        };

        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('TTS Exception:', error);
      }
    }
  }, [selectedVoice, availableVoices]);

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
    
    // Nếu đã chọn VI, thực hiện match ngay
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
    
    // Nếu đã chọn EN, thực hiện match ngay
    if (selectedEn) {
      handleMatch(selectedEn, id);
    }
  };

  const handleMatch = (enId: string, viId: string) => {
    const matchNumber = matchedPairs.length + 1;
    setMatchedPairs((prev) => [...prev, { enId, viId, matchNumber }]);
    // Clear selections to allow continuous matching
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

  const handlePlayAudio = (audioUrl: string, startTime: number, endTime: number) => {
    if (!audioUrl) {
      message.warning('Không có file audio cho câu này');
      return;
    }

    // Format audio URL to include /media/ prefix (same as Sort Sentences page)
    let formattedAudioUrl = audioUrl;
    if (!audioUrl.startsWith('/media/')) {
      formattedAudioUrl = `/media/${audioUrl}`;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    try {
      const audio = new Audio(formattedAudioUrl);
      audioRef.current = audio;
      
      // Validate and set start time
      const validStartTime = Number(startTime) || 0;
      const validEndTime = Number(endTime) || 0;
      
      const handleTimeUpdate = () => {
        const currentTime = audio.currentTime * 1000;
        if (isFinite(validEndTime) && validEndTime > 0 && currentTime >= validEndTime) {
          audio.pause();
          audio.removeEventListener('timeupdate', handleTimeUpdate);
        }
      };
      
      const handleError = (e: Event) => {
        console.error('Audio error:', e);
        message.error('Không thể phát audio. File có thể không tồn tại hoặc định dạng không được hỗ trợ.');
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
      };
      
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('error', handleError);
      
      // Set start time before playing
      if (isFinite(validStartTime) && validStartTime > 0) {
        audio.currentTime = validStartTime / 1000;
      }
      
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        message.error('Không thể phát audio. Vui lòng thử lại sau.');
      });
    } catch (err) {
      console.error('Error creating audio:', err);
      message.error('Lỗi khi khởi tạo audio.');
    }
  };

  // ============================================================
  // WORD MEANING HANDLER
  // ============================================================

  const handleGetMeaning = useMemo(
    () =>
      debounce(async () => {
        try {
          const selection = window.getSelection();
          const searchValue = selection?.toString().trim();
          if (!searchValue) {
            setMeaningEnKeywords([]);
            setMeaningViKeywords([]);
            setSelectedText('');
            return;
          }

          setSelectedText(searchValue);

          const alreadyShown =
            searchValue === meaningEnRef.current.join(' ') ||
            searchValue === meaningViRef.current.join(' ');
          if (alreadyShown) return;

          const isEng = /^[a-zA-Z ]+$/.test(searchValue);
          const res = isEng
            ? await getMeaningWords(searchValue, null)
            : await getMeaningWords(null, searchValue);

          if (res.length > 0) {
            setMeaningEnKeywords(res.map((w) => w.eng));
            setMeaningViKeywords(res.map((w) => w.vi));
          } else {
            setMeaningEnKeywords([]);
            setMeaningViKeywords([]);
          }

          if (selection?.rangeCount) {
            const rect = selection.getRangeAt(0).getBoundingClientRect();
            setTooltipPosition({
              x: Math.min(rect.left, window.innerWidth - 380),
              y: rect.bottom + 8,
            });
          }

          // Auto-read if enabled
          if (autoRead) {
            speakText(searchValue);
          }
        } catch (e) {
          console.error(e);
        }
      }, 300),
    [autoRead, selectedVoice, speakText]
  );

  useEffect(() => {
    document.addEventListener('selectionchange', handleGetMeaning);
    return () => {
      document.removeEventListener('selectionchange', handleGetMeaning);
      handleGetMeaning.cancel();
    };
  }, [handleGetMeaning]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const tooltip = document.querySelector('[style*="position: fixed"][style*="z-index: 10000"]');

      const dropdowns = document.querySelectorAll('.ant-select-dropdown');
      const isInDropdown = Array.from(dropdowns).some(dropdown => dropdown.contains(target));

      if (tooltip?.contains(target) || isInDropdown) {
        return;
      }

      if (window.getSelection()?.toString().trim() === '') {
        setMeaningEnKeywords([]);
        setMeaningViKeywords([]);
        setSelectedText('');
      }
    };

    const handleSelectionChange = () => {
      const dropdowns = document.querySelectorAll('.ant-select-dropdown');
      const isDropdownOpen = Array.from(dropdowns).some(dropdown => {
        const htmlDropdown = dropdown as HTMLElement;
        return htmlDropdown.style.display !== 'none' && htmlDropdown.style.visibility !== 'hidden';
      });

      if (isDropdownOpen) {
        return;
      }

      if (window.getSelection()?.toString().trim() === '') {
        setMeaningEnKeywords([]);
        setMeaningViKeywords([]);
        setSelectedText('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // Render tooltip for word meaning
  const renderTooltip = useCallback((): React.ReactNode => {
    if (!selectedText) return null;
    const sel = window.getSelection()?.toString().trim() || '';
    const isEng = /^[a-zA-Z ]+$/.test(sel);
    return createPortal(
      <div style={{ ...TOOLTIP_STYLE, left: tooltipPosition.x, top: tooltipPosition.y }}>
        <div style={TOOLTIP_BODY_STYLE}>
          <div style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ marginBottom: 8 }}>
              <Select
                value={selectedVoice}
                onChange={setSelectedVoice}
                style={{ width: '100%' }}
                placeholder="Chon giọng đọc"
                size="small"
                getPopupContainer={(triggerNode) => triggerNode.parentElement as HTMLElement}
                dropdownStyle={{ zIndex: 10001 }}
                options={availableVoices.map(voice => ({
                  value: voice.name,
                  label: `${voice.name} (${voice.lang})`
                }))}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Button
                type="link"
                icon={<SoundOutlined />}
                onClick={() => speakText(selectedText)}
                style={{ color: '#7dd3fc', padding: 0, height: 'auto' }}
              >
                Đọc từ đã chọn
              </Button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>Tự động đọc</span>
                <Switch
                  size="small"
                  checked={autoRead}
                  onChange={setAutoRead}
                />
              </div>
            </div>
          </div>
          {meaningEnKeywords.length > 0 && meaningViKeywords.length > 0 && (
            <>
              {isEng ? (
                <>
                  <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 4, letterSpacing: 1 }}>
                    EN → VI
                  </div>
                  {meaningEnKeywords.map((word, i) => (
                    <div key={i}>
                      <strong style={{ color: '#7dd3fc' }}>{word}</strong>
                      <span style={{ opacity: 0.8 }}> : </span>
                      {meaningViKeywords[i]}
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 4, letterSpacing: 1 }}>
                    VI → EN
                  </div>
                  {meaningViKeywords.map((word, i) => (
                    <div key={i}>
                      <strong style={{ color: '#7dd3fc' }}>{word}</strong>
                      <span style={{ opacity: 0.8 }}> : </span>
                      {meaningEnKeywords[i]}
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>,
      document.body
    );
  }, [selectedText, selectedVoice, availableVoices, autoRead, meaningEnKeywords, meaningViKeywords, tooltipPosition, speakText]);

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

  // Calculate connection line paths for matched pairs
  useEffect(() => {
    if (matchedPairs.length === 0) {
      setMatchedLinePaths([]);
      return;
    }

    const calculateMatchedPaths = () => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const headerOffset = 135;
      const xOffset = 30;

      const lines = matchedPairs.map((pair) => {
        const enEl = enRefs.current[pair.enId];
        const viEl = viRefs.current[pair.viId];
        
        if (!enEl || !viEl) return null;
        
        const enRect = enEl.getBoundingClientRect();
        const viRect = viEl.getBoundingClientRect();
        
        const enX = enRect.right - containerRect.left - xOffset;
        const enY = enRect.top + enRect.height / 2 - containerRect.top - headerOffset;
        const viX = viRect.left - containerRect.left - xOffset;
        const viY = viRect.top + viRect.height / 2 - containerRect.top - headerOffset;
        
        const isCorrect = checkedResults[pair.enId];
        const color = isCorrect === true ? '#52c41a' : isCorrect === false ? '#ff4d4f' : '#1890ff';
        
        const midX = (enX + viX) / 2;
        const path = `M ${enX} ${enY} C ${midX} ${enY}, ${midX} ${viY}, ${viX} ${viY}`;
        
        return { enId: pair.enId, viId: pair.viId, path, color };
      }).filter((line): line is { enId: string; viId: string; path: string; color: string } => line !== null);

      setMatchedLinePaths(lines);
    };

    const timeout1 = setTimeout(calculateMatchedPaths, 0);
    const timeout2 = setTimeout(calculateMatchedPaths, 50);
    const timeout3 = setTimeout(calculateMatchedPaths, 100);
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [matchedPairs, checkedResults, shuffledEn, shuffledVi]);

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
            {/* Matched pairs lines */}
            {matchedLinePaths.map((line) => (
              <path
                key={`${line.enId}-${line.viId}`}
                d={line.path}
                stroke={line.color}
                strokeWidth="4"
                fill="none"
              />
            ))}
            {/* Currently selected line */}
            {selectedLinePath && (
              <path
                d={selectedLinePath}
                stroke="#fa8c16"
                strokeWidth="4"
                fill="none"
              />
            )}
          </svg>
          
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
                    <Text 
                      style={{ fontSize: 15, flex: 1, userSelect: 'text' }}
                    >{item.eng}</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {item.audio && (
                        <SoundOutlined
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayAudio(item.audio, Number(item.startTime || 0), Number(item.endTime || 0));
                          }}
                          style={{ 
                            cursor: 'pointer', 
                            color: '#1890ff',
                            fontSize: 16,
                          }}
                        />
                      )}
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
                    <Text 
                      style={{ fontSize: 15, flex: 1, userSelect: 'text' }}
                      onMouseUp={(e) => { e.stopPropagation(); }}
                      onTouchEnd={(e) => { e.stopPropagation(); }}
                    >{item.vi}</Text>
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

      {/* Tooltip for word meaning */}
      {renderTooltip()}
    </div>
  );
};

const MatchSentencesPageWrapper = () => (
  <Suspense fallback={<Spin size="large" />}>
    <MatchSentencesPage />
  </Suspense>
);

export default MatchSentencesPageWrapper;
