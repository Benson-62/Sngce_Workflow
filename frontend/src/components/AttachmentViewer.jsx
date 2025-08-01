import React, { useState } from 'react';
import './AttachmentViewer.css';

const AttachmentViewer = ({ attachment }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  console.log('AttachmentViewer received attachment:', attachment);

  if (!attachment) return null;

  const { filename, mimetype, file } = attachment;
  
  console.log('AttachmentViewer extracted data:', { filename, mimetype, fileType: typeof file, fileLength: file ? file.length : 'N/A' });
  
  // Convert base64 to blob URL for preview/download
  const getBlobUrl = () => {
    if (!file) {
      console.log('No file data found in attachment:', attachment);
      return null;
    }
    
    try {
      // If file is a base64 string (existing attachment from backend)
      if (typeof file === 'string') {
        console.log('Processing base64 string file, length:', file.length);
        const byteCharacters = atob(file);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimetype });
        return URL.createObjectURL(blob);
      }
      
      // If file is a File object (new attachment from frontend)
      if (file instanceof File) {
        console.log('Processing File object:', file.name, file.type, file.size);
        return URL.createObjectURL(file);
      }
      
      console.log('Unknown file type:', typeof file, file);
      return null;
    } catch (error) {
      console.error('Error creating blob URL:', error);
      return null;
    }
  };

  const blobUrl = getBlobUrl();

  // Determine file type and icon
  const getFileType = () => {
    if (!mimetype) return 'file';
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype === 'application/pdf') return 'pdf';
    if (mimetype.includes('document') || mimetype.includes('word')) return 'document';
    if (mimetype.includes('spreadsheet') || mimetype.includes('excel')) return 'spreadsheet';
    if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return 'presentation';
    return 'file';
  };

  const fileType = getFileType();

  const getFileIcon = () => {
    switch (fileType) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      case 'pdf':
        return '📄';
      case 'document':
        return '📝';
      case 'spreadsheet':
        return '📊';
      case 'presentation':
        return '📈';
      default:
        return '📎';
    }
  };

  const getFileSize = () => {
    if (!file) return 'Unknown size';
    
    try {
      let sizeInBytes;
      
      // If file is a base64 string (existing attachment)
      if (typeof file === 'string') {
        sizeInBytes = Math.ceil((file.length * 3) / 4);
      }
      // If file is a File object (new attachment)
      else if (file instanceof File) {
        sizeInBytes = file.size;
      }
      else {
        return 'Unknown size';
      }
      
      if (sizeInBytes < 1024) return `${sizeInBytes} B`;
      if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    } catch (error) {
      console.error('Error calculating file size:', error);
      return 'Unknown size';
    }
  };

  const handlePreview = () => {
    if (!blobUrl) {
      console.error('No blob URL available for preview');
      return;
    }
    
    if (fileType === 'image' || fileType === 'video' || fileType === 'audio' || fileType === 'pdf') {
      setIsPreviewOpen(true);
    } else {
      // For other file types, trigger download
      handleDownload();
    }
  };

  const handleDownload = () => {
    if (!blobUrl) {
      console.error('No blob URL available for download');
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleOpenInNewTab = () => {
    if (!blobUrl) {
      console.error('No blob URL available for opening in new tab');
      return;
    }
    
    try {
      window.open(blobUrl, '_blank');
    } catch (error) {
      console.error('Error opening file in new tab:', error);
    }
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  // If we can't create a blob URL, show an error message
  if (!blobUrl) {
    return (
      <div className="attachment-viewer">
        <div className="attachment-header">
          <span className="file-icon">{getFileIcon()}</span>
          <div className="file-info">
            <div className="filename">{filename}</div>
            <div className="file-details">
              Error: Unable to load file • {mimetype}
            </div>
          </div>
        </div>
        <div style={{ color: 'red', fontSize: '0.9em', marginTop: '8px' }}>
          File data is corrupted or missing. Please contact support.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="attachment-viewer">
        <div className="attachment-header">
          <span className="file-icon">{getFileIcon()}</span>
          <div className="file-info">
            <div className="filename">{filename}</div>
            <div className="file-details">
              {getFileSize()} • {mimetype}
            </div>
          </div>
        </div>
        
        <div className="attachment-actions">
          {fileType === 'image' && (
            <div className="image-preview">
              <img 
                src={blobUrl} 
                alt={filename}
                onClick={handlePreview}
                className="preview-image"
                onError={(e) => {
                  console.error('Error loading image:', e);
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          <div className="action-buttons">
            {fileType === 'image' || fileType === 'video' || fileType === 'audio' || fileType === 'pdf' ? (
              <button 
                className="preview-btn"
                onClick={handlePreview}
                title="Preview file"
              >
                👁️ Preview
              </button>
            ) : null}
            
            <button 
              className="open-btn"
              onClick={handleOpenInNewTab}
              title="Open in new tab"
            >
              🔗 Open
            </button>
            
            <button 
              className="download-btn"
              onClick={handleDownload}
              title="Download file"
            >
              ⬇️ Download
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="preview-modal" onClick={closePreview}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <span className="preview-filename">{filename}</span>
              <button className="close-btn" onClick={closePreview}>✕</button>
            </div>
            
            <div className="preview-body">
              {fileType === 'image' && (
                <img 
                  src={blobUrl} 
                  alt={filename} 
                  className="preview-image-full"
                  onError={(e) => {
                    console.error('Error loading image in preview:', e);
                    e.target.style.display = 'none';
                  }}
                />
              )}
              
              {fileType === 'video' && (
                <video controls className="preview-video">
                  <source src={blobUrl} type={mimetype} />
                  Your browser does not support the video tag.
                </video>
              )}
              
              {fileType === 'audio' && (
                <audio controls className="preview-audio">
                  <source src={blobUrl} type={mimetype} />
                  Your browser does not support the audio tag.
                </audio>
              )}
              
              {fileType === 'pdf' && (
                <iframe 
                  src={blobUrl} 
                  className="preview-pdf"
                  title={filename}
                  onError={(e) => {
                    console.error('Error loading PDF in preview:', e);
                  }}
                />
              )}
            </div>
            
            <div className="preview-footer">
              <button className="download-btn" onClick={handleDownload}>
                ⬇️ Download
              </button>
              <button className="open-btn" onClick={handleOpenInNewTab}>
                🔗 Open in New Tab
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AttachmentViewer; 