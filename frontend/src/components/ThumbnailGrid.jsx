import React, { useEffect, useState } from 'react';
import { X, FileText, ImageIcon, GripVertical } from 'lucide-react';

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ThumbnailGrid({ files, onRemove }) {
    const [previews, setPreviews] = useState([]);

    useEffect(() => {
        const urls = files.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
        setPreviews(urls);
        return () => urls.forEach(u => u && URL.revokeObjectURL(u));
    }, [files]);

    if (files.length === 0) return null;

    return (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '10px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: '#2563EB', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: '800'
                    }}>2</div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                        Review pages ({files.length})
                    </span>
                </div>
                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                    Pages will be read in order
                </span>
            </div>

            {/* Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                gap: '10px',
                maxHeight: '260px',
                overflowY: 'auto',
                padding: '4px 2px'
            }}>
                {files.map((file, i) => (
                    <div
                        key={`${file.name}-${i}`}
                        style={{
                            position: 'relative',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            background: '#fff',
                            border: '1px solid #E5E7EB',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                            aspectRatio: '3/4',
                            transition: 'transform 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        {/* Thumbnail image or PDF placeholder */}
                        {previews[i] ? (
                            <img
                                src={previews[i]}
                                alt={`Page ${i + 1}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                        ) : (
                            <div style={{
                                width: '100%', height: '100%',
                                background: 'linear-gradient(135deg, #F8FAFC, #EFF6FF)',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', gap: '6px'
                            }}>
                                <FileText size={22} color="#2563EB" />
                                <span style={{ fontSize: '9px', fontWeight: '700', color: '#6B7280', letterSpacing: '0.05em' }}>PDF</span>
                            </div>
                        )}

                        {/* Page number badge */}
                        <div style={{
                            position: 'absolute', top: '5px', left: '5px',
                            background: 'rgba(0,0,0,0.62)', color: '#fff',
                            borderRadius: '5px', padding: '2px 6px',
                            fontSize: '10px', fontWeight: '700', backdropFilter: 'blur(4px)'
                        }}>
                            {i + 1}
                        </div>

                        {/* Remove button */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                            title="Remove page"
                            style={{
                                position: 'absolute', top: '5px', right: '5px',
                                width: '20px', height: '20px',
                                background: 'rgba(239,68,68,0.9)', border: 'none',
                                borderRadius: '50%', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'transform 0.15s',
                                backdropFilter: 'blur(4px)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <X size={10} color="white" strokeWidth={3} />
                        </button>

                        {/* File size */}
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
                            padding: '12px 5px 4px',
                            fontSize: '9px', color: 'rgba(255,255,255,0.85)',
                            fontWeight: '600', textAlign: 'center'
                        }}>
                            {formatBytes(file.size)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
