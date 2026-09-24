'use client';
import {QuestionType, QuizResultType} from '@/interfaces/question';
import {getMeaningWords, getQuestionsWithAnswersByVolumeSlug, submitQuiz} from '@/utils/apiService';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    PauseOutlined,
    PlayCircleOutlined,
    ReloadOutlined,
    SoundOutlined,
} from '@ant-design/icons';
import {Button, Modal, Radio, Select, Spin, Switch, Tooltip, Typography, message} from 'antd';
import debounce from 'lodash.debounce';
import {useRouter, useSearchParams} from 'next/navigation';
import {Suspense, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import '../../styles/global.css';

const {Text} = Typography;

// ============================================================
// TOOLTIP STYLE — giống ContentComponent
// ============================================================

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

// ============================================================
// UTILITY
// ============================================================

const shuffleArray = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

// Helper: lấy mã đáp án ưu tiên answerCode, fallback optionCode
const getAnswerCode = (answer: QuestionType['answers'][0]) =>
    answer.answerCode ?? answer.optionCode;

// Helper: lấy text đáp án EN ưu tiên answerText, fallback optionText
const getAnswerTextEn = (answer: QuestionType['answers'][0]) =>
    answer.answerText ?? answer.optionText;

// ============================================================
// MAIN COMPONENT
// ============================================================

const MultipleChoicePage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const volumeSlug = searchParams?.get('volumeSlug') || '';

    // Quiz state
    const [questions, setQuestions] = useState<QuestionType[]>([]);
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [isChecked, setIsChecked] = useState(false);
    const [quizResult, setQuizResult] = useState<QuizResultType | null>(null);
    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [openResultModal, setOpenResultModal] = useState(false);

    // Số câu muốn làm (0 = tất cả)
    const [questionLimit, setQuestionLimit] = useState<number>(0);

    // Toggle hiển thị nghĩa tiếng Việt
    // key: questionCode → hiện/ẩn nghĩa câu hỏi
    // key: `${questionCode}-${answerCode}` → hiện/ẩn nghĩa từng đáp án
    const [shownVi, setShownVi] = useState<Record<string, boolean>>({});

    const toggleVi = (key: string) =>
        setShownVi(prev => ({...prev, [key]: !prev[key]}));

    // TTS
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);
    const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);

    // Tooltip / meaning (bôi chọn từ) — giống ContentComponent
    const [meaningEnKeywords, setMeaningEnKeywords] = useState<string[]>([]);
    const [meaningViKeywords, setMeaningViKeywords] = useState<string[]>([]);
    const [tooltipPosition, setTooltipPosition] = useState({x: 0, y: 0});
    const [selectedText, setSelectedText] = useState('');
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState('');
    const [autoRead, setAutoRead] = useState(true);
    const meaningEnRef = useRef<string[]>([]);
    const meaningViRef = useRef<string[]>([]);
    meaningEnRef.current = meaningEnKeywords;
    meaningViRef.current = meaningViKeywords;

    // ============================================================
    // LOAD VOICES
    // ============================================================

    useEffect(() => {
        if (!('speechSynthesis' in window)) return;
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            setAvailableVoices(voices);
            if (!selectedVoice && voices.length > 0) {
                const def = voices.find(v => v.lang.startsWith('en')) ?? voices[0];
                setSelectedVoice(def.name);
            }
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
        const timeout = setTimeout(() => {
            if (window.speechSynthesis.getVoices().length === 0) loadVoices();
        }, 1000);
        return () => {
            window.speechSynthesis.onvoiceschanged = null;
            clearTimeout(timeout);
        };
    }, [selectedVoice]);

    // ============================================================
    // DATA FETCHING
    // ============================================================

    const fetchData = async (limit?: number) => {
        setLoading(true);
        try {
            const response = await getQuestionsWithAnswersByVolumeSlug(volumeSlug);
            const shuffled = shuffleArray(response);
            const cap = limit ?? questionLimit;
            setQuestions(cap > 0 ? shuffled.slice(0, cap) : shuffled);
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

    const handleAnswerChange = (questionCode: string, code: string) => {
        if (isChecked) return;
        setUserAnswers(prev => ({...prev, [questionCode]: code}));
    };

    // ============================================================
    // TTS
    // ============================================================

    const speakText = useCallback((text: string) => {
        if (!text?.trim() || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(
            text.replace(/\s+/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '').trim()
        );
        utterance.rate = 1.0;
        utterance.lang = /^[a-zA-Z ]+$/.test(text) ? 'en-US' : 'vi-VN';
        if (selectedVoice) {
            const voice = availableVoices.find(v => v.name === selectedVoice);
            if (voice) utterance.voice = voice;
        }
        utterance.onerror = (e) => console.error('TTS Error:', e.error);
        window.speechSynthesis.speak(utterance);
    }, [selectedVoice, availableVoices]);

    const stopSpeaking = () => {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        setCurrentPlayingId(null);
    };

    const speakFull = (text: string, itemId: string) => {
        if (!('speechSynthesis' in window)) { message.error('Trình duyệt không hỗ trợ TTS'); return; }
        if (currentPlayingId === itemId) { stopSpeaking(); return; }
        stopSpeaking();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        if (selectedVoice) {
            const voice = availableVoices.find(v => v.name === selectedVoice);
            if (voice) utterance.voice = voice;
        }
        utterance.onend = () => setCurrentPlayingId(null);
        utterance.onerror = () => setCurrentPlayingId(null);
        currentAudioRef.current = null;
        setCurrentPlayingId(itemId);
        window.speechSynthesis.speak(utterance);
    };

    // ============================================================
    // TOOLTIP bôi chọn từ — giống ContentComponent
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
                        setMeaningEnKeywords(res.map(w => w.eng));
                        setMeaningViKeywords(res.map(w => w.vi));
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
                    if (autoRead) speakText(searchValue);
                } catch (e) {
                    console.error(e);
                }
            }, 300),
        [autoRead, speakText]
    );

    useEffect(() => {
        document.addEventListener('selectionchange', handleGetMeaning);
        return () => {
            document.removeEventListener('selectionchange', handleGetMeaning);
            handleGetMeaning.cancel();
        };
    }, [handleGetMeaning]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const tooltip = document.querySelector('[style*="position: fixed"][style*="z-index: 10000"]');
            const dropdowns = document.querySelectorAll('.ant-select-dropdown');
            const isInDropdown = Array.from(dropdowns).some(d => d.contains(target));
            if (tooltip?.contains(target) || isInDropdown) return;
            if (window.getSelection()?.toString().trim() === '') {
                setMeaningEnKeywords([]);
                setMeaningViKeywords([]);
                setSelectedText('');
            }
        };
        const handleSelectionChange = () => {
            const dropdowns = document.querySelectorAll('.ant-select-dropdown');
            const isDropdownOpen = Array.from(dropdowns).some(d => {
                const el = d as HTMLElement;
                return el.style.display !== 'none' && el.style.visibility !== 'hidden';
            });
            if (isDropdownOpen) return;
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

    const renderTooltip = useCallback((): React.ReactNode => {
        if (!selectedText) return null;
        const sel = window.getSelection()?.toString().trim() || '';
        const isEng = /^[a-zA-Z ]+$/.test(sel);
        return createPortal(
            <div style={{...TOOLTIP_STYLE, left: tooltipPosition.x, top: tooltipPosition.y}}>
                <div style={TOOLTIP_BODY_STYLE}>
                    <div style={{marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.2)'}}>
                        <div style={{marginBottom: 8}}>
                            <Select
                                value={selectedVoice}
                                onChange={setSelectedVoice}
                                style={{width: '100%'}}
                                placeholder="Chọn giọng đọc"
                                size="small"
                                getPopupContainer={(t) => t.parentElement as HTMLElement}
                                dropdownStyle={{zIndex: 10001}}
                                options={availableVoices.map(v => ({value: v.name, label: `${v.name} (${v.lang})`}))}
                            />
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8}}>
                            <Button
                                type="link" icon={<SoundOutlined/>}
                                onClick={() => speakText(selectedText)}
                                style={{color: '#7dd3fc', padding: 0, height: 'auto'}}
                            >
                                Đọc từ đã chọn
                            </Button>
                            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                                <span style={{fontSize: 12, opacity: 0.8}}>Tự động đọc</span>
                                <Switch size="small" checked={autoRead} onChange={setAutoRead}/>
                            </div>
                        </div>
                    </div>
                    {meaningEnKeywords.length > 0 && meaningViKeywords.length > 0 && (
                        <>
                            {isEng ? (
                                <>
                                    <div style={{fontSize: 11, opacity: 0.65, marginBottom: 4, letterSpacing: 1}}>EN → VI</div>
                                    {meaningEnKeywords.map((word, i) => (
                                        <div key={i}>
                                            <strong style={{color: '#7dd3fc'}}>{word}</strong>
                                            <span style={{opacity: 0.8}}> : </span>
                                            {meaningViKeywords[i]}
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <>
                                    <div style={{fontSize: 11, opacity: 0.65, marginBottom: 4, letterSpacing: 1}}>VI → EN</div>
                                    {meaningViKeywords.map((word, i) => (
                                        <div key={i}>
                                            <strong style={{color: '#7dd3fc'}}>{word}</strong>
                                            <span style={{opacity: 0.8}}> : </span>
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
    // SUBMIT QUIZ
    // ============================================================

    const handleSubmitQuiz = async () => {
        setConfirmLoading(true);
        try {
            setOpenConfirmModal(false);
            setConfirmLoading(false);
            await performSubmit();
        } catch (error) {
            console.error(error);
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
            console.error(error);
            setConfirmLoading(false);
            message.error('Có lỗi xảy ra khi tính điểm');
        }
    };

    const reloadQuiz = async () => {
        stopSpeaking();
        setMeaningEnKeywords([]);
        setMeaningViKeywords([]);
        setSelectedText('');
        setShownVi({});
        setLoading(true);
        setQuestions([]);
        setUserAnswers({});
        setIsChecked(false);
        setQuizResult(null);
        await fetchData(questionLimit);
    };

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div style={{maxWidth: '2000px', margin: '100px auto 70px', padding: '10px 20px'}}>

            {renderTooltip()}

            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                <Typography.Title level={2} style={{margin: 0}}>
                    Lựa chọn đáp án đúng
                </Typography.Title>
                <Button onClick={() => router.back()} icon={<ReloadOutlined/>}>
                    Quay lại
                </Button>
            </div>

            {/* Thanh chọn giọng đọc + số câu */}
            {availableVoices.length > 0 && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    marginBottom: 24,
                    padding: '10px 16px',
                    background: '#f0f7ff',
                    borderRadius: 8,
                    border: '1px solid #d0e8ff',
                    flexWrap: 'wrap',
                }}>
                    {/* Giọng đọc */}
                    <div style={{display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200}}>
                        <SoundOutlined style={{color: '#1890ff', fontSize: 16}}/>
                        <span style={{fontSize: 14, color: '#555', whiteSpace: 'nowrap'}}>Giọng đọc:</span>
                        <Select
                            value={selectedVoice}
                            onChange={setSelectedVoice}
                            style={{flex: 1, maxWidth: 360}}
                            size="small"
                            options={availableVoices.map(v => ({
                                value: v.name,
                                label: `${v.name} (${v.lang})`,
                            }))}
                        />
                    </div>

                    {/* Số câu */}
                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                        <span style={{fontSize: 14, color: '#555', whiteSpace: 'nowrap'}}>Số câu:</span>
                        <Select
                            value={questionLimit}
                            onChange={(val) => {
                                setQuestionLimit(val);
                                // Reset và load lại ngay với giới hạn mới
                                stopSpeaking();
                                setShownVi({});
                                setUserAnswers({});
                                setIsChecked(false);
                                setQuizResult({} as QuizResultType);
                                setQuizResult(null);
                                fetchData(val);
                            }}
                            size="small"
                            style={{width: 100}}
                            options={[
                                {value: 0,  label: 'Tất cả'},
                                {value: 5,  label: '5 câu'},
                                {value: 10, label: '10 câu'},
                                {value: 15, label: '15 câu'},
                                {value: 20, label: '20 câu'},
                                {value: 30, label: '30 câu'},
                            ]}
                        />
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{textAlign: 'center', padding: '50px'}}>
                    <Spin size="large"/>
                </div>
            ) : (
                <div>
                    {questions.map((question, index) => {
                        const qViKey = question.questionCode;
                        const isQViShown = !!shownVi[qViKey];
                        const hasQVi = !!question.questionTextVi;

                        return (
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
                                {/* ── CÂU HỎI ── */}
                                <div style={{marginBottom: 20}}>
                                    <div style={{display: 'flex', alignItems: 'flex-start', marginBottom: 4}}>
                                        <Text strong style={{marginRight: 12, minWidth: '50px', fontSize: '20px', color: '#1890ff'}}>
                                            Câu {index + 1}:
                                        </Text>
                                        <div style={{flex: 1}}>
                                            {/* Tiếng Anh */}
                                            <Text style={{fontSize: '20px', lineHeight: '1.6', userSelect: 'text'}}>
                                                {question.questionText}
                                            </Text>

                                            {/* Nút phát âm toàn câu */}
                                            <Button
                                                type="text"
                                                icon={currentPlayingId === `q-${question.questionCode}` ? <PauseOutlined/> : <PlayCircleOutlined/>}
                                                onClick={() => speakFull(question.questionText, `q-${question.questionCode}`)}
                                                style={{marginLeft: 8, color: '#1890ff'}}
                                            />

                                            {/* Nút xem nghĩa tiếng Việt câu hỏi */}
                                            {hasQVi && (
                                                <Tooltip title={isQViShown ? 'Ẩn nghĩa' : 'Xem nghĩa tiếng Việt'}>
                                                    <Button
                                                        type="text"
                                                        icon={isQViShown ? <EyeInvisibleOutlined/> : <EyeOutlined/>}
                                                        onClick={() => toggleVi(qViKey)}
                                                        style={{marginLeft: 4, color: '#52c41a', fontSize: '14px'}}
                                                        size="small"
                                                    />
                                                </Tooltip>
                                            )}

                                            {/* Tiếng Việt câu hỏi (toggle) */}
                                            {isQViShown && question.questionTextVi && (
                                                <div style={{
                                                    marginTop: 6,
                                                    padding: '6px 12px',
                                                    background: '#f6ffed',
                                                    borderLeft: '3px solid #52c41a',
                                                    borderRadius: '4px',
                                                    fontSize: '18px',
                                                    color: '#389e0d',
                                                    userSelect: 'text',
                                                }}>
                                                    {question.questionTextVi}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ── ĐÁP ÁN ── */}
                                <div style={{marginLeft: 62}}>
                                    <Radio.Group
                                        value={userAnswers[question.questionCode]}
                                        onChange={(e) => handleAnswerChange(question.questionCode, e.target.value)}
                                        disabled={isChecked}
                                        style={{width: '100%'}}
                                    >
                                        {question.answers.map((answer) => {
                                            const code = getAnswerCode(answer);
                                            const textEn = getAnswerTextEn(answer);
                                            const textVi = answer.answerTextVi;
                                            const aViKey = `${question.questionCode}-${code}`;
                                            const isAViShown = !!shownVi[aViKey];
                                            const hasAVi = !!textVi;

                                            return (
                                                <div
                                                    key={code}
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
                                                    onClick={() => {
                                                        if (!isChecked) handleAnswerChange(question.questionCode, code);
                                                    }}
                                                >
                                                    {/* Layout: Radio + mã + text EN + buttons — tất cả trên 1 dòng */}
                                                    <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                                                        {/* Radio chỉ chứa mã đáp án */}
                                                        <Radio value={code} style={{marginRight: 0}}>
                                                            <span style={{fontWeight: 'bold', color: '#1890ff', fontSize: '20px', whiteSpace: 'nowrap'}}>
                                                                {code}.
                                                            </span>
                                                        </Radio>

                                                        {/* Text tiếng Anh — chiếm toàn bộ không gian còn lại */}
                                                        <span style={{fontSize: '20px', userSelect: 'text', flex: 1, lineHeight: '1.5'}}>
                                                            {textEn}
                                                        </span>

                                                        {/* Nút phát âm đáp án */}
                                                        <Button
                                                            type="text"
                                                            icon={currentPlayingId === `a-${question.questionCode}-${code}` ? <PauseOutlined/> : <PlayCircleOutlined/>}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                speakFull(textEn, `a-${question.questionCode}-${code}`);
                                                            }}
                                                            style={{color: '#52c41a', flexShrink: 0}}
                                                            size="small"
                                                        />

                                                        {/* Nút xem nghĩa tiếng Việt đáp án */}
                                                        {hasAVi && (
                                                            <Tooltip title={isAViShown ? 'Ẩn nghĩa' : 'Xem nghĩa tiếng Việt'}>
                                                                <Button
                                                                    type="text"
                                                                    icon={isAViShown ? <EyeInvisibleOutlined/> : <EyeOutlined/>}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleVi(aViKey);
                                                                    }}
                                                                    style={{color: '#52c41a', flexShrink: 0}}
                                                                    size="small"
                                                                />
                                                            </Tooltip>
                                                        )}
                                                    </div>

                                                    {/* Nghĩa tiếng Việt đáp án (toggle) — dòng riêng bên dưới */}
                                                    {isAViShown && textVi && (
                                                        <div style={{
                                                            marginTop: 6,
                                                            marginLeft: 52,
                                                            padding: '4px 10px',
                                                            background: '#f6ffed',
                                                            borderLeft: '3px solid #52c41a',
                                                            borderRadius: '4px',
                                                            fontSize: '17px',
                                                            color: '#389e0d',
                                                            userSelect: 'text',
                                                        }}>
                                                            {textVi}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </Radio.Group>
                                </div>

                                {/* ── KẾT QUẢ SAU KHI KIỂM TRA ── */}
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
                                            <Text style={{color: '#fa8c16', fontSize: '20px'}}>
                                                ⚠️ Bạn chưa chọn đáp án
                                            </Text>
                                        ) : quizResult.questionResults[index]?.isCorrect ? (
                                            <Text style={{color: '#52c41a', fontSize: '20px', display: 'flex', alignItems: 'center'}}>
                                                <CheckCircleOutlined style={{marginRight: 8}}/> Đúng!
                                            </Text>
                                        ) : (
                                            <Text style={{color: '#ff4d4f', fontSize: '20px', display: 'flex', alignItems: 'center'}}>
                                                <CloseCircleOutlined style={{marginRight: 8}}/> Sai! Đáp án đúng: {quizResult.questionResults[index]?.correctAnswer} — {quizResult.questionResults[index]?.correctAnswerText}
                                            </Text>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
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
                            {quizResult.questionResults.map((result, idx) => (
                                <div
                                    key={idx}
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
                                                        Đáp án đúng: {result.correctAnswer} — {result.correctAnswerText}
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
