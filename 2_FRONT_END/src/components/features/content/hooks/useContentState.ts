import { useState, useRef, useEffect, useCallback } from 'react';
import debounce from 'lodash.debounce';
import { getMeaningWords } from '@/utils/apiService';

// ============================================================
// USE CONTENT STATE HOOK
// Hook quan ly state chung cho content components:
// - Trang thai tooltip tra nghia tu
// - Trang thai modal chinh sua
// - Trang thai modal xem video
// - Trang thai UI toggles (show/hide English, Vietnamese, etc.)
// ============================================================

export const useContentState = () => {
  // ============================================================
  // STATE - TOOLTIP TRA NGHIA TU
  // ============================================================
  
  const [meaningEnKeywords, setMeaningEnKeywords] = useState<string[]>([]);
  const [meaningViKeywords, setMeaningViKeywords] = useState<string[]>([]);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const meaningEnRef = useRef<string[]>([]);
  const meaningViRef = useRef<string[]>([]);
  meaningEnRef.current = meaningEnKeywords;
  meaningViRef.current = meaningViKeywords;

  // Lay nghia cua tu nguoi dung boi chon (debounce 300ms)
  const handleGetMeaning = useCallback(
    debounce(async () => {
      try {
        const selection = window.getSelection();
        const searchValue = selection?.toString().trim();

        if (!searchValue) {
          setMeaningEnKeywords([]);
          setMeaningViKeywords([]);
          return;
        }

        const alreadyShown =
          searchValue === meaningEnRef.current.join(' ') ||
          searchValue === meaningViRef.current.join(' ');
        if (alreadyShown) return;

        const isEnglish = /^[a-zA-Z ]+$/.test(searchValue);
        const response = isEnglish
          ? await getMeaningWords(searchValue, null)
          : await getMeaningWords(null, searchValue);

        if (response.length > 0) {
          setMeaningEnKeywords(response.map((w) => w.eng));
          setMeaningViKeywords(response.map((w) => w.vi));
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
      } catch (error) {
        console.error('Loi khi tra nghia tu:', error);
      }
    }, 300),
    []
  );

  // Register listener cho selection change
  useEffect(() => {
    document.addEventListener('selectionchange', handleGetMeaning);
    return () => {
      document.removeEventListener('selectionchange', handleGetMeaning);
      handleGetMeaning.cancel();
    };
  }, [handleGetMeaning]);

  // Dong tooltip khi click ra ngoai vung boi
  useEffect(() => {
    const handleClickOutside = () => {
      if (window.getSelection()?.toString().trim() === '') {
        setMeaningEnKeywords([]);
        setMeaningViKeywords([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================================
  // STATE - UI TOGGLES
  // ============================================================

  const [showEnglish, setShowEnglish] = useState(true);
  const [showVietnamese, setShowVietnamese] = useState(true);
  const [highlightMissingWords, setHighlightMissingWords] = useState(true);

  // ============================================================
  // STATE - MODAL CHINH SUA
  // ============================================================

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

  const handleOpenEdit = useCallback((item: any) => {
    setEditingItem(item);
    setEditModalOpen(true);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditModalOpen(false);
    setEditingItem(null);
  }, []);

  // ============================================================
  // STATE - MODAL XEM VIDEO
  // ============================================================

  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoSrc, setVideoSrc] = useState('');
  const [videoStartTime, setVideoStartTime] = useState(0);
  const [videoEndTime, setVideoEndTime] = useState(0);

  const handleOpenVideo = useCallback((src: string, start: number, end: number) => {
    setVideoSrc(src);
    setVideoStartTime(start);
    setVideoEndTime(end);
    setVideoModalOpen(true);
  }, []);

  const handleCloseVideo = useCallback(() => {
    setVideoModalOpen(false);
    setVideoSrc('');
    setVideoStartTime(0);
    setVideoEndTime(0);
  }, []);

  return {
    // Tooltip state
    meaningEnKeywords,
    meaningViKeywords,
    tooltipPosition,
    handleGetMeaning,
    
    // UI toggles
    showEnglish,
    setShowEnglish,
    showVietnamese,
    setShowVietnamese,
    highlightMissingWords,
    setHighlightMissingWords,
    
    // Edit modal state
    editModalOpen,
    editingItem,
    editLoading,
    setEditLoading,
    handleOpenEdit,
    handleCloseEdit,
    
    // Video modal state
    videoModalOpen,
    videoSrc,
    videoStartTime,
    videoEndTime,
    handleOpenVideo,
    handleCloseVideo,
  };
};
