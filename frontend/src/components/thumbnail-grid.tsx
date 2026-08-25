/* eslint-disable */
// @ts-nocheck
'use client';
import React, { useEffect, useState } from 'react';
import { X, FileText } from 'lucide-react';

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// For very large uploads, we show a compact list with collapse behaviour
const GRID_THRESHOLD = 20; // above this count, switch to compact list view
const MAX_VISIBLE_IN_GRID = 15; // in grid mode, show at most this before collapsing

export default function ThumbnailGrid({ files, onRemove }) {
    const [previews, setPreviews] = useState([]);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const urls = files.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
        setPreviews(urls);
        return () => urls.forEach(u => u && URL.revokeObjectURL(u));
    }, [files]);

    if (files.length === 0) return null;

    const isCompact = files.length >= GRID_THRESHOLD;
    const visibleFiles = (!showAll && !isCompact) ? files.slice(0, MAX_VISIBLE_IN_GRID) : files;
    const hiddenCount = isCompact ? 0 : Math.max(0, files.length - MAX_VISIBLE_IN_GRID);

    // Compute a summary: how many are images, how many are PDF pages
    const imageCount = files.filter(f => f.type.startsWith('image/')).length;
    const pdfPageCount = files.length - imageCount;

    return (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: '#2563EB', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: '800'
                    }}>2</div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>
                        {files.length} {files.length === 1 ? 'page' : 'pages'} ready
                    </span>
                    {files.length > 1 && (
                        <span style={{
                            fontSize: '10px', color: '#9CA3AF', background: '#F3F4F6',
                            padding: '2px 7px', borderRadius: '20px', fontWeight: '600'
                        }}>
                            {imageCount > 0 && pdfPageCount > 0
                                ? `${imageCount} image${imageCount > 1 ? 's' : ''} + ${pdfPageCount} PDF page${pdfPageCount > 1 ? 's' : ''}`
                                : imageCount > 0
                                    ? `${imageCount} image${imageCount > 1 ? 's' : ''}`
                                    : `${pdfPageCount} PDF page${pdfPageCount > 1 ? 's' : ''}`
                            }
                        </span>
                    )}
                </div>
                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Read in order left to right</span>
            </div>

            {isCompact ? (
                /* Compact list for 20+ files */
                <CompactList files={files} previews={previews} onRemove={onRemove} showAll={showAll} setShowAll={setShowAll} />
            ) : (
                /* Grid for < 20 files */
                <>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))',
                        gap: '8px',
                        maxHeight: showAll ? '600px' : '240px',
                        overflowY: showAll ? 'auto' : 'hidden',
                        padding: '4px 2px',
                        transition: 'max-height 0.4s ease',
                    }}>
                        {visibleFiles.map((file, i) => (
                            <ThumbnailCard key={`${file.name}-${i}`} file={file} index={i} preview={previews[i]} onRemove={onRemove} />
                        ))}
                    </div>
                    {!showAll && hiddenCount > 0 && (
                        <button
                            onClick={() => setShowAll(true)}
                            style={{
                                marginTop: '8px', width: '100%', background: '#F9FAFB',
                                border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px',
                                fontSize: '12px', fontWeight: '600', color: '#6B7280',
                                cursor: 'pointer', transition: 'background 0.15s, color 0.15s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#374151'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.color = '#6B7280'; }}
                        >
                            Show {hiddenCount} more pages
                        </button>
                    )}
                </>
            )}
        </div>
    );
}

function ThumbnailCard({ file, index, preview, onRemove }) {
    return (
        <div
            style={{
                position: 'relative', borderRadius: '10px', overflow: 'hidden',
                background: '#fff', border: '1px solid #E5E7EB',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                aspectRatio: '3/4', transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
        >
            {preview ? (
                <img src={preview} alt={`Page ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
                <div style={{
                    width: '100%', height: '100%',
                    background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '5px'
                }}>
                    <FileText size={20} color="#2563EB" />
                    <span style={{ fontSize: '8px', fontWeight: '700', color: '#6B7280', letterSpacing: '0.06em' }}>PDF</span>
                </div>
            )}
            <div style={{
                position: 'absolute', top: '5px', left: '5px',
                background: 'rgba(0,0,0,0.6)', color: '#fff',
                borderRadius: '4px', padding: '1px 5px',
                fontSize: '10px', fontWeight: '700', backdropFilter: 'blur(4px)'
            }}>{index + 1}</div>
            <button
                onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                style={{
                    position: 'absolute', top: '5px', right: '5px',
                    width: '18px', height: '18px',
                    background: 'rgba(239,68,68,0.9)', border: 'none',
                    borderRadius: '50%', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.15s', backdropFilter: 'blur(4px)'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                <X size={9} color="white" strokeWidth={3} />
            </button>
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
                padding: '12px 4px 4px',
                fontSize: '8px', color: 'rgba(255,255,255,0.85)',
                fontWeight: '600', textAlign: 'center'
            }}>{formatBytes(file.size)}</div>
        </div>
    );
}

function CompactList({ files, previews, onRemove, showAll, setShowAll }) {
    const VISIBLE = 10;
    const visible = showAll ? files : files.slice(0, VISIBLE);
    const hidden = files.length - VISIBLE;

    return (
        <div style={{
            border: '1px solid #E5E7EB', borderRadius: '12px',
            overflow: 'hidden', background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
            {/* Summary banner */}
            <div style={{
                background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                padding: '10px 14px', borderBottom: '1px solid #E5E7EB',
                display: 'flex', alignItems: 'center', gap: '10px'
            }}>
                <FileText size={16} color="#2563EB" />
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1E40AF' }}>
                    {files.length} pages queued for transcription
                </span>
                <span style={{
                    marginLeft: 'auto', fontSize: '11px', color: '#60A5FA', fontWeight: '600',
                    background: 'rgba(37,99,235,0.1)', padding: '2px 8px', borderRadius: '20px'
                }}>
                    {files.length} page calls
                </span>
            </div>

            {/* Scrollable list */}
            <div style={{ maxHeight: showAll ? '400px' : '240px', overflowY: 'auto' }}>
                {visible.map((file, i) => (
                    <div key={`${file.name}-${i}`} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 12px',
                        borderBottom: i < visible.length - 1 ? '1px solid #F3F4F6' : 'none',
                        transition: 'background 0.15s',
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        {/* Mini thumbnail or icon */}
                        <div style={{
                            width: '36px', height: '46px', borderRadius: '5px',
                            overflow: 'hidden', flexShrink: 0,
                            border: '1px solid #E5E7EB', background: '#F3F4F6',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {previews[i] ? (
                                <img src={previews[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <FileText size={14} color="#6B7280" />
                            )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontSize: '12px', fontWeight: '600', color: '#111827',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                            }}>{file.name.length > 28 ? file.name.slice(0, 25) + '...' : file.name}</div>
                            <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '1px' }}>{formatBytes(file.size)}</div>
                        </div>

                        {/* Page badge */}
                        <div style={{
                            fontSize: '10px', fontWeight: '700', color: '#6B7280',
                            background: '#F3F4F6', padding: '2px 7px', borderRadius: '20px',
                            flexShrink: 0
                        }}>p.{i + 1}</div>

                        {/* Remove */}
                        <button
                            onClick={() => onRemove(i)}
                            style={{
                                width: '22px', height: '22px', flexShrink: 0,
                                background: 'transparent', border: '1px solid #E5E7EB',
                                borderRadius: '50%', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.15s, border-color 0.15s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.borderColor = '#FCA5A5'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
                        >
                            <X size={10} color="#EF4444" strokeWidth={2.5} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Show more / collapse toggle */}
            {files.length > VISIBLE && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    style={{
                        width: '100%', background: '#F9FAFB', border: 'none',
                        borderTop: '1px solid #E5E7EB', padding: '9px 14px',
                        fontSize: '12px', fontWeight: '600', color: '#6B7280',
                        cursor: 'pointer', transition: 'background 0.15s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                    onMouseLeave={e => e.currentTarget.style.background = '#F9FAFB'}
                >
                    {showAll ? `Collapse list` : `Show ${hidden} more pages`}
                </button>
            )}
        </div>
    );
}
