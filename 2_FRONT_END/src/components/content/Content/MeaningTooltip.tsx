import { createPortal } from 'react-dom';

// ============================================================
// MEANING TOOLTIP COMPONENT
// Hien thi tooltip tra nghia tu khi nguoi dung boi chon text
// ============================================================

interface MeaningTooltipProps {
  meaningEnKeywords: string[];
  meaningViKeywords: string[];
  tooltipPosition: { x: number; y: number };
}

const TOOLTIP_STYLE: React.CSSProperties = {
  position: 'fixed',
  backgroundColor: '#1d1d2e',
  color: 'white',
  padding: '10px 14px',
  borderRadius: 10,
  boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
  zIndex: 9999,
  maxWidth: 360,
  wordWrap: 'break-word',
  fontSize: 14,
  lineHeight: '1.85',
  pointerEvents: 'none',
  borderLeft: '4px solid #108ee9',
};

const TOOLTIP_BODY_STYLE: React.CSSProperties = {
  maxHeight: '60vh',
  overflowY: 'auto',
  overflowX: 'hidden',
  pointerEvents: 'auto',
};

const MeaningTooltip = ({
  meaningEnKeywords,
  meaningViKeywords,
  tooltipPosition,
}: MeaningTooltipProps) => {
  if (!meaningEnKeywords.length || !meaningViKeywords.length) {
    return null;
  }

  const sel = window.getSelection()?.toString().trim() || '';
  const isEng = /^[a-zA-Z ]+$/.test(sel);

  return createPortal(
    <div style={{ ...TOOLTIP_STYLE, left: tooltipPosition.x, top: tooltipPosition.y }}>
      <div style={TOOLTIP_BODY_STYLE}>
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
      </div>
    </div>,
    document.body
  );
};

export default MeaningTooltip;
