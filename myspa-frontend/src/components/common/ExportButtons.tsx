import React from 'react';
import Button from '@mui/material/Button';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

interface ExportButtonsProps {
  onExportExcel?: () => void;
  onExportPdf?: () => void;
  disabled?: boolean;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({
  onExportExcel,
  onExportPdf,
  disabled,
}) => {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {onExportExcel && (
        <Button
          variant="outlined"
          onClick={onExportExcel}
          disabled={disabled}
          startIcon={<FileDownloadIcon />}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontFamily: 'inherit',
            fontWeight: 500,
            fontSize: 13,
            borderColor: '#10B981',
            color: '#10B981',
            px: 2,
            '&:hover': { borderColor: '#059669', background: 'var(--success-light)', color: '#059669' },
          }}
        >
          Excel
        </Button>
      )}
      {onExportPdf && (
        <Button
          variant="outlined"
          onClick={onExportPdf}
          disabled={disabled}
          startIcon={<PictureAsPdfIcon />}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontFamily: 'inherit',
            fontWeight: 500,
            fontSize: 13,
            borderColor: '#EF4444',
            color: '#EF4444',
            px: 2,
            '&:hover': { borderColor: '#DC2626', background: 'var(--error-light)', color: '#DC2626' },
          }}
        >
          PDF
        </Button>
      )}
    </div>
  );
};

export default ExportButtons;
