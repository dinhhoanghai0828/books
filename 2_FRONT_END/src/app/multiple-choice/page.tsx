'use client';
import {QuestionType, QuizResultType} from '@/interfaces/question';
import {getQuestionsWithAnswersByVolumeSlug, submitQuiz} from '@/utils/apiService';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    LoadingOutlined,
    PauseOutlined,
    PlayCircleOutlined,
    ReloadOutlined,
    SoundOutlined,
} from '@ant-design/icons';
import {Button, Modal, Radio, Select, Spin, Typography, message} from 'antd';
import {useRouter, useSearchParams} from 'next/navigation';
import {Suspense, useCallback, useEffect, useRef, useState} from 'react';
import '../../styles/global.css';

const {Text} = Typography;

// ============================================================
// UTILITY
// ============================================================

const shuffleArray = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

// ============================================================
// TYPES
// ============================================================

interface WordInfo {
    word: string;
    phonetic?: string;
    meanings: {partOfSpeech: string; definitions: {definition: string; example?: string}[]}[];
    translation?: string;       // tiếng Việt
    translationLoading?: boolean;
}

interface PopupPos {
    x: number;
    y: number;
}

// ============================================================
// WORD POPUP COMPONENT
// ============================================================

interface WordPopupProps {
    info: WordInfo | null;
    loading: boolean;
    pos: PopupPos;
    onClose: () => void;
    onSpeak: (word: string) => void;
    voices: SpeechSynthesisVoice[];
    selectedVoice: string;
    onVoiceChange: (uri: string) => void;
}

const WordPopup = ({info, loading, pos, onClose, onSpeak, voices, selectedVoice, onVoiceChange}: WordPopupProps) => {
    const ref = useRef<HTMLDivElement>(null);

    // Đóng popup khi click ra ngoài
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);

    // Tính vị trí popup để không tràn ra ngoài màn hình
    const [adjustedPos, setAdjustedPos] = useState(pos);
    useEffect(() => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const vpW = window.innerWidth;
        const vpH = window.innerHeight;
        let {x, y} = pos;
        if (x + rect.width > vpW - 12) x = vpW - rect.width - 12;
        if (x < 8) x = 8;
        if (y + rect.height > vpH - 12) y = y - rect.height - 28;
        setAdjustedPos({x, y});
    }, [pos, info, loading]);

    const popupStyle: React.CSSProperties = {
        position: 'fixed',
        left: adjustedPos.x,
        top: adjustedPos.y,
        zIndex: 9999,
        background: '#fff',
        border: '1px solid #d9d9d9',
        borderRadius: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        padding: '16px 18px',
        minWidth: 280,
        maxWidth: 380,
        maxHeight: '70vh',
        overflowY: 'auto',
    };

    return (
        <div ref={ref} style={popupStyle}>
            {loading ? (
                <div style={{textAlign: 'center', padding: '20px 0'}}>
                    <Spin indicator={<LoadingOutlined style={{fontSize: 28}} spin />} />
                    <div style={{marginTop: 8, color: '#888'}}>Đang tra từ...</div>
                </div>
            ) : !info ? (
                <div style={{color: '#888', textAlign: 'center', padding: '12px 0'}}>
                    Không tìm thấy từ này
                </div>
            ) : (
                <>
                    {/* Header: từ + phát âm */}
                    <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6}}>
                        <span style={{fontSize: 22, fontWeight: 700, color: '#1890ff'}}>{info.word}</span>
                        {info.phonetic && (
                            <span style={{fontSize: 14, color: '#888'}}>/{info.phonetic}/</span>
                        )}
                        <Button
                            type="text"
                            icon={<SoundOutlined style={{fontSize: 18, color: '#1890ff'}} />}
                            size="small"
                            onClick={() => onSpeak(info.word)}
                            title="Phát âm"
                            style={{marginLeft: 'auto'}}
                        />
                    </div>

                    {/* Dịch tiếng Việt */}
                    {info.translationLoading ? (
                        <div style={{marginBottom: 8, color: '#52c41a', fontSize: 15}}>
                            <Spin size="small" /> Đang dịch...
                        </div>
                    ) : info.translation ? (
                        <div style={{
                            marginBottom: 10,
                            padding: '6px 10px',
                            background: '#f6ffed',
                            borderRadius: 6,
                            border: '1px solid #b7eb8f',
                            fontSize: 16,
                            color: '#389e0d',
                            fontWeight: 600,
                        }}>
                            🇻🇳 {info.translation}
                        </div>
                    ) : null}

                    {/* Nghĩa tiếng Anh */}
                    {info.meanings.slice(0, 3).map((m, i) => (
                        <div key={i} style={{marginBottom: 8}}>
                            <span style={{
                                fontSize: 12,
                                color: '#fff',
                                background: '#1890ff',
                                borderRadius: 4,
                                padding: '1px 7px',
                                marginBottom: 4,
                                display: 'inline-block',
                            }}>
                                {m.partOfSpeech}
                            </span>
                            {m.definitions.slice(0, 2).map((d, j) => (
                                <div key={j} style={{marginTop: 4, marginLeft: 4}}>
                                    <span style={{fontSize: 14, color: '#333'}}>• {d.definition}</span>
                                    {d.example && (
                                        <div style={{fontSize: 13, color: '#888', fontStyle: 'italic', marginLeft: 10}}>
                                            "{d.example}"
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}

                    {/* Chọn giọng đọc */}
                    {voices.length > 0 && (
                        <div style={{marginTop: 10, borderTop: '1px solid #f0f0f0', paddingTop: 10}}>
                            <div style={{fontSize: 12, color: '#888', marginBottom: 4}}>🎙 Chọn giọng đọc:</div>
                            <Select
                                size="small"
                                value={selectedVoice}
                                onChange={onVoiceChange}
                                style={{width: '100%'}}
                                options={voices.map(v => ({
                                    value: v.voiceURI,
                                    label: `${v.name} (${v.lang})`,
                                }))}
                                popupMatchSelectWidth={false}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// ============================================================
// CLICKABLE WORDS COMPONENT
// ============================================================

interface ClickableWordsProps {
    text: string;
    fontSize?: string | number;
    onWordClick?: (word: string, pos: PopupPos) => void;
    activeWord?: string | null;
}

const ClickableWords = ({text, fontSize = '20px', onWordClick, activeWord}: ClickableWordsProps) => {
    const tokens = text.split(/(\s+)/);

    return (
        <span>
            {tokens.map((token, i) => {
                if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;

                const cleanWord = token.replace(/^[^a-zA-Z0-9''-]+|[^a-zA-Z0-9''-]+$/g, '');
                if (!cleanWord) return <span key={i}>{token}</span>;

                const isActive = activeWord === cleanWord.toLowerCase();

                return (
                    <span
                        key={i}
                        onClick={(e) => {
                            e.stopPropagation();
                            const rect = (e.currentTarget as HTMLSpanElement).getBoundingClientRect();
                            onWordClick?.(cleanWord, {x: rect.left, y: rect.bottom + 6});
                        }}
                        style={{
                            fontSize,
                            cursor: 'pointer',
                            borderRadius: 3,
                            padding: '1px 2px',
                            transition: 'all 0.15s',
                            backgroundColor: isActive ? '#bae7ff' : 'transparent',
                            color: isActive ? '#0050b3' : 'inherit',
                            userSelect: 'none',
                            textDecoration: 'underline',
                            textDecorationStyle: 'dotted',
                            textDecorationColor: '#91d5ff',
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive) {
                                (e.currentTarget as HTMLSpanElement).style.backgroundColor = '#e6f7ff';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive) {
                                (e.currentTarget as HTMLSpanElement).style.backgroundColor = 'transparent';
                            }
                        }}
                    >
                        {token}
                    </span>
                );
            })}
        </span>
    );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const MultipleChoicePage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const volumeSlug = searchParams?.get('volumeSlug') || '';

    const [questions, setQuestions] = useState<QuestionType[]>([]);
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [isChecked, setIsChecked] = useState(false);
    const [quizResult, setQuizResult] = useState<QuizResultType | null>(null);
    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [openResultModal, setOpenResultModal] = useState(false);

    // TTS
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);
    const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<string>('');

    // Word popup
    const [activeWord, setActiveWord] = useState<string | null>(null);
    const [popupPos, setPopupPos] = useState<PopupPos>({x: 0, y: 0});
    const [popupVisible, setPopupVisible] = useState(false);
    const [wordInfo, setWordInfo] = useState<WordInfo | null>(null);
    const [wordLoading, setWordLoading] = useState(false);

    // ============================================================
    // LOAD VOICES
    // ============================================================

    useEffect(() => {
        const loadVoices = () => {
            const all = window.speechSynthesis.getVoices();
            // Ưu tiên giọng tiếng Anh
            const enVoices = all.filter(v => v.lang.startsWith('en'));
            setVoices(enVoices.length > 0 ? enVoices : all);
            if (!selectedVoice && enVoices.length > 0) {
                // Ưu tiên giọng US
                const usVoice = enVoices.find(v => v.lang === 'en-US');
                setSelectedVoice((usVoice ?? enVoices[0]).voiceURI);
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
        return () => { window.speechSynthesis.onvoiceschanged = null; };
    }, []);

    // ============================================================
    // DATA FETCHING
    // ============================================================

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await getQuestionsWithAnswersByVolumeSlug(volumeSlug);
            setQuestions(shuffleArray(response));
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu câu hỏi:', error);
            message.error('Không thể tải dữ liệu câu hỏi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [volumeSlug]);

    // ============================================================
    // ANSWER SELECTION
    // ============================================================

    const handleAnswerChange = (questionCode: string, optionCode: string) => {
        if (isChecked) return;
        setUserAnswers(prev => ({...prev, [questionCode]: optionCode}));
    };

    // ============================================================
    // TEXT-TO-SPEECH
    // ============================================================

    const stopSpeaking = () => {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        setCurrentPlayingId(null);
    };

    const speakText = (text: string, itemId: string) => {
        if (!window.speechSynthesis) { message.error('Trình duyệt không hỗ trợ text-to-speech'); return; }
        if (currentPlayingId === itemId) { stopSpeaking(); return; }
        stopSpeaking();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        if (selectedVoice) {
            const v = window.speechSynthesis.getVoices().find(vv => vv.voiceURI === selectedVoice);
            if (v) utterance.voice = v;
        }
        utterance.onend = () => setCurrentPlayingId(null);
        utterance.onerror = () => setCurrentPlayingId(null);
        currentAudioRef.current = null;
        setCurrentPlayingId(itemId);
        window.speechSynthesis.speak(utterance);
    };

    // Phát âm một từ (dùng trong popup)
    const speakWord = useCallback((word: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        if (selectedVoice) {
            const v = window.speechSynthesis.getVoices().find(vv => vv.voiceURI === selectedVoice);
            if (v) utterance.voice = v;
        }
        window.speechSynthesis.speak(utterance);
    }, [selectedVoice]);

    // ============================================================
    // DICTIONARY LOOKUP
    // ============================================================

    const lookupWord = useCallback(async (word: string, pos: PopupPos) => {
        const cleaned = word.replace(/[^a-zA-Z'-]/g, '').toLowerCase();
        if (!cleaned) return;

        setActiveWord(cleaned);
        setPopupPos(pos);
        setPopupVisible(true);
        setWordLoading(true);
        setWordInfo(null);

        // Phát âm ngay khi click
        speakWord(cleaned);

        try {
            // 1. Free Dictionary API (nghĩa tiếng Anh)
            const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleaned)}`);
            let info: WordInfo | null = null;

            if (dictRes.ok) {
                const data = await dictRes.json();
                const entry = data[0];
                info = {
                    word: entry.word,
                    phonetic: entry.phonetic ?? entry.phonetics?.find((p: {text?: string}) => p.text)?.text,
                    meanings: (entry.meanings ?? []).map((m: {partOfSpeech: string; definitions: {definition: string; example?: string}[]}) => ({
                        partOfSpeech: m.partOfSpeech,
                        definitions: m.definitions.slice(0, 2),
                    })),
                    translationLoading: true,
                };
            } else {
                info = {
                    word: cleaned,
                    meanings: [],
                    translationLoading: true,
                };
            }

            setWordInfo(info);
            setWordLoading(false);

            // 2. Dịch tiếng Việt bằng MyMemory API
            try {
                const transRes = await fetch(
                    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleaned)}&langpair=en|vi`
                );
                if (transRes.ok) {
                    const transData = await transRes.json();
                    const translation = transData?.responseData?.translatedText;
                    if (translation && translation.toLowerCase() !== cleaned.toLowerCase()) {
                        setWordInfo(prev => prev ? {...prev, translation, translationLoading: false} : prev);
                    } else {
                        setWordInfo(prev => prev ? {...prev, translationLoading: false} : prev);
                    }
                } else {
                    setWordInfo(prev => prev ? {...prev, translationLoading: false} : prev);
                }
            } catch {
                setWordInfo(prev => prev ? {...prev, translationLoading: false} : prev);
            }

        } catch {
            setWordLoading(false);
            setWordInfo({word: cleaned, meanings: [], translationLoading: false});
        }
    }, [speakWord]);

    const closePopup = useCallback(() => {
        setPopupVisible(false);
        setActiveWord(null);
        setWordInfo(null);
    }, []);

    // ============================================================
    // SUBMIT QUIZ
    // ============================================================

    const handleSubmitQuiz = async () => {
        setConfirmLoading(true);
        try {
            setOpenConfirmModal(false);
            setConfirmLoading(false);
            await performSubmit();
        } catch (error) {
            console.error('Lỗi trong handleSubmitQuiz:', error);
            setConfirmLoading(false);
            message.error('Có lỗi xảy ra khi nộp bài');
        }
    };

    const performSubmit = async () => {
        try {
            const result = await submitQuiz(userAnswers, questions);
            setQuizResult(result);
            setIsChecked(true);
            setOpenConfirmModal(false);
            setConfirmLoading(false);
            setOpenResultModal(true);
        } catch (error) {
            console.error('Lỗi khi nộp bài:', error);
            setConfirmLoading(false);
            message.error('Có lỗi xảy ra khi tính điểm');
        }
    };

    const reloadQuiz = async () => {
        stopSpeaking();
        closePopup();
        setLoading(true);
        setQuestions([]);
        setUserAnswers({});
        setIsChecked(false);
        setQuizResult(null);
        await fetchData();
    };

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div style={{maxWidth: '2000px', margin: '100px auto 70px', padding: '10px 20px'}}>
            {/* Word Popup */}
            {popupVisible && (
                <WordPopup
                    info={wordInfo}
                    loading={wordLoading}
                    pos={popupPos}
                    onClose={closePopup}
                    onSpeak={speakWord}
                    voices={voices}
                    selectedVoice={selectedVoice}
                    onVoiceChange={setSelectedVoice}
                />
            )}

            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30}}>
                <Typography.Title level={2} style={{margin: 0}}>
                    Lựa chọn đáp án đúng
                </Typography.Title>
                <Button onClick={() => router.back()} icon={<ReloadOutlined/>}>
                    Quay lại
                </Button>
            </div>

            {loading ? (
                <div style={{textAlign: 'center', padding: '50px'}}>
                    <Spin size="large"/>
                </div>
            ) : (
                <div>
                    {questions.map((question, index) => (
                        <div
                            key={question.questionCode}
                            style={{
                                background: 'white',
                                borderRadius: '12px',
                                padding: '28px',
                                marginBottom: '24px',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                                border: '1px solid #e8e8e8',
                            }}
                        >
                            <div style={{marginBottom: 20}}>
                                <div style={{display: 'flex', alignItems: 'flex-start', marginBottom: 12}}>
                                    <Text strong style={{marginRight: 12, minWidth: '50px', fontSize: '20px', color: '#1890ff'}}>
                                        Câu {index + 1}:
                                    </Text>
                                    <div style={{flex: 1}}>
                                        <Text style={{fontSize: '20px', lineHeight: '1.6'}}>
                                            <ClickableWords
                                                text={question.questionText}
                                                fontSize="20px"
                                                onWordClick={lookupWord}
                                                activeWord={activeWord}
                                            />
                                        </Text>
                                        <Button
                                            type="text"
                                            icon={currentPlayingId === `question-${question.questionCode}` ? <PauseOutlined/> : <PlayCircleOutlined/>}
                                            onClick={() => speakText(question.questionText, `question-${question.questionCode}`)}
                                            style={{marginLeft: 12, color: '#1890ff'}}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{marginLeft: 62}}>
                                <Radio.Group
                                    value={userAnswers[question.questionCode]}
                                    onChange={(e) => handleAnswerChange(question.questionCode, e.target.value)}
                                    disabled={isChecked}
                                    style={{width: '100%'}}
                                >
                                    {question.answers.map((answer) => (
                                        <div
                                            key={answer.optionCode}
                                            style={{
                                                marginBottom: 16,
                                                padding: '12px 16px',
                                                borderRadius: '6px',
                                                border: '1px solid #e8e8e8',
                                                transition: 'all 0.3s',
                                                cursor: isChecked ? 'not-allowed' : 'pointer',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isChecked) {
                                                    e.currentTarget.style.borderColor = '#1890ff';
                                                    e.currentTarget.style.backgroundColor = '#f0f7ff';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isChecked) {
                                                    e.currentTarget.style.borderColor = '#e8e8e8';
                                                    e.currentTarget.style.backgroundColor = 'white';
                                                }
                                            }}
                                        >
                                            <Radio value={answer.optionCode} style={{marginRight: 12}}>
                                                <span style={{fontWeight: 'bold', marginRight: 8, color: '#1890ff'}}>
                                                    {answer.optionCode}.
                                                </span>
                                                <span style={{fontSize: '20px'}}>
                                                    <ClickableWords
                                                        text={answer.optionText}
                                                        fontSize="20px"
                                                        onWordClick={lookupWord}
                                                        activeWord={activeWord}
                                                    />
                                                </span>
                                                <Button
                                                    type="text"
                                                    icon={currentPlayingId === `answer-${question.questionCode}-${answer.optionCode}` ? <PauseOutlined/> : <PlayCircleOutlined/>}
                                                    onClick={() => speakText(answer.optionText, `answer-${question.questionCode}-${answer.optionCode}`)}
                                                    style={{marginLeft: 12, color: '#52c41a'}}
                                                    size="small"
                                                />
                                            </Radio>
                                        </div>
                                    ))}
                                </Radio.Group>
                            </div>

                            {/* Kết quả sau khi kiểm tra */}
                            {isChecked && quizResult && (
                                <div style={{
                                    marginLeft: 62,
                                    marginTop: 16,
                                    padding: '12px 16px',
                                    borderRadius: '6px',
                                    background: quizResult.questionResults[index]?.isUnanswered
                                        ? '#fffbe6'
                                        : quizResult.questionResults[index]?.isCorrect
                                            ? '#f6ffed'
                                            : '#fff1f0',
                                    border: `1px solid ${
                                        quizResult.questionResults[index]?.isUnanswered
                                            ? '#ffe58f'
                                            : quizResult.questionResults[index]?.isCorrect
                                                ? '#b7eb8f'
                                                : '#ffccc7'
                                    }`,
                                }}>
                                    {quizResult.questionResults[index]?.isUnanswered ? (
                                        <Text style={{color: '#fa8c16', fontSize: '20px'}}>⚠️ Bạn chưa chọn đáp án</Text>
                                    ) : quizResult.questionResults[index]?.isCorrect ? (
                                        <Text style={{color: '#52c41a', fontSize: '20px', display: 'flex', alignItems: 'center'}}>
                                            <CheckCircleOutlined style={{marginRight: 8}}/> Đúng!
                                        </Text>
                                    ) : (
                                        <Text style={{color: '#ff4d4f', fontSize: '20px', display: 'flex', alignItems: 'center'}}>
                                            <CloseCircleOutlined style={{marginRight: 8}}/> Sai! Đáp án đúng: {quizResult.questionResults[index]?.correctAnswer} - {quizResult.questionResults[index]?.correctAnswerText}
                                        </Text>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Nút nộp bài và làm lại */}
            <div style={{display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '32px'}}>
                <Button
                    type="primary" size="large"
                    onClick={() => setOpenConfirmModal(true)}
                    disabled={isChecked}
                    style={{minWidth: '120px', height: '44px', fontSize: '20px'}}
                >
                    Nộp bài
                </Button>
                <Button
                    size="large" onClick={reloadQuiz} icon={<ReloadOutlined/>}
                    style={{minWidth: '120px', height: '44px', fontSize: '20px'}}
                >
                    Làm lại
                </Button>
            </div>

            {/* Modal xác nhận nộp bài */}
            <Modal
                title="Xác nhận"
                open={openConfirmModal}
                onOk={handleSubmitQuiz}
                confirmLoading={confirmLoading}
                onCancel={() => setOpenConfirmModal(false)}
                centered
                okText="Đồng ý"
                cancelText="Hủy"
            >
                {(() => {
                    const unanswered = questions.filter(q => !userAnswers[q.questionCode]);
                    if (unanswered.length > 0) {
                        const nums = unanswered.map(q => questions.indexOf(q) + 1).join(', ');
                        return (
                            <div>
                                <p>Bạn chưa chọn đáp án cho câu hỏi số: <strong>{nums}</strong></p>
                                <p>Bạn có chắc chắn muốn nộp bài không?</p>
                            </div>
                        );
                    }
                    return <p>Bạn có chắc chắn muốn nộp bài không?</p>;
                })()}
            </Modal>

            {/* Modal kết quả */}
            <Modal
                title={<div style={{textAlign: 'center', fontSize: 28, fontWeight: 'bold'}}>Kết quả</div>}
                open={openResultModal && isChecked && quizResult !== null}
                onOk={() => setOpenResultModal(false)}
                onCancel={() => setOpenResultModal(false)}
                width={700}
                centered
                footer={
                    <div style={{textAlign: 'center'}}>
                        <Button type="primary" onClick={() => setOpenResultModal(false)}>OK</Button>
                        <Button onClick={() => setOpenResultModal(false)} style={{marginLeft: 10}}>Đóng</Button>
                    </div>
                }
            >
                {quizResult ? (
                    <>
                        <div style={{textAlign: 'center', fontSize: 24}}>
                            {quizResult.correctAnswers === quizResult.totalQuestions
                                ? <CheckCircleOutlined style={{color: 'green', fontSize: 64}}/>
                                : <CloseCircleOutlined style={{color: 'red', fontSize: 64}}/>
                            }
                        </div>
                        <div style={{marginTop: 20, fontSize: 18}}>
                            <Text style={{display: 'block', marginBottom: 10}}><strong>Tổng số câu:</strong> {quizResult.totalQuestions}</Text>
                            <Text style={{display: 'block', marginBottom: 10, color: 'green'}}><strong>Đúng:</strong> {quizResult.correctAnswers}</Text>
                            <Text style={{display: 'block', marginBottom: 10, color: 'red'}}><strong>Sai:</strong> {quizResult.incorrectAnswers}</Text>
                            <Text style={{display: 'block', marginBottom: 10, color: 'orange'}}><strong>Chưa làm:</strong> {quizResult.unansweredQuestions}</Text>
                            <Text style={{display: 'block', marginTop: 10, fontSize: 20, fontWeight: 'bold'}}>
                                Điểm: {quizResult.correctAnswers} / {quizResult.totalQuestions}
                            </Text>
                        </div>
                        <div style={{marginTop: 20, maxHeight: 300, overflowY: 'auto'}}>
                            <Typography.Title level={5}>Chi tiết kết quả:</Typography.Title>
                            {quizResult.questionResults.map((result, index) => (
                                <div
                                    key={index}
                                    style={{
                                        padding: 10, marginBottom: 10,
                                        border: '1px solid #d9d9d9', borderRadius: 4,
                                        backgroundColor: result.isCorrect ? '#f6ffed' : result.isUnanswered ? '#fffbe6' : '#fff1f0',
                                    }}
                                >
                                    <Text strong>Câu {result.questionNumber}:</Text>
                                    <div style={{marginLeft: 10}}>
                                        <Text>{result.questionText}</Text>
                                        {result.isUnanswered ? (
                                            <div style={{color: 'orange', marginTop: 5}}>Chưa chọn đáp án</div>
                                        ) : (
                                            <div style={{marginTop: 5}}>
                                                <Text>Bạn chọn: {result.userAnswer}</Text>
                                                {!result.isCorrect && (
                                                    <div style={{color: 'red'}}>
                                                        Đáp án đúng: {result.correctAnswer} - {result.correctAnswerText}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div style={{textAlign: 'center', padding: 20}}>
                        <Spin size="large"/>
                        <p>Đang tính kết quả...</p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

const MultipleChoicePageWrapper = () => (
    <Suspense fallback={<Spin size="large"/>}>
        <MultipleChoicePage/>
    </Suspense>
);

export default MultipleChoicePageWrapper;
