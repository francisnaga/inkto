import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function ThumbnailGrid({ files, onRemove }) {
    const [previews, setPreviews] = useState([]);

    useEffect(() => {
        // Create object URLs for images
        const newPreviews = files.map(file => {
            if (file.type.startsWith('image/')) {
                return URL.createObjectURL(file);
            }
            return null; // For PDFs, we might just show a PDF icon
        });

        setPreviews(newPreviews);

        // Cleanup
        return () => {
            newPreviews.forEach(url => {
                if (url) URL.revokeObjectURL(url);
            });
        };
    }, [files]);

    if (files.length === 0) return null;

    return (
        <div className="thumbnail-section">
            <div className="thumbnail-header">
                <span>Selected files ({files.length}):</span>
            </div>
            <div className="thumbnail-grid">
                {files.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="thumbnail-item">
                        {previews[index] ? (
                            <img src={previews[index]} alt={`Page ${index + 1}`} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eee', fontSize: '12px' }}>PDF</div>
                        )}
                        <button 
                            className="remove-btn" 
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove(index);
                            }}
                            title="Remove"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--secondary-text)', marginTop: '8px' }}>
                Images will be processed in this order.
            </p>
        </div>
    );
}
