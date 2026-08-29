const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/output-box.tsx', 'utf8');

const startIndex = content.indexOf('const FilmstripViewer = ({ images }) => {');
const endIndex = content.indexOf('function InboxModal({ onClose, onSend }) {');

if (startIndex !== -1 && endIndex !== -1) {
    const codeBefore = content.substring(0, startIndex);
    const codeAfter = content.substring(endIndex);

    const filmstripCode = `const FilmstripViewer = ({ images }) => {
    return (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', background: '#F8FAFC' }}>
            {images.map((url, i) => {
                const isPdf = url.includes('.pdf');
                return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        {isPdf ? (
                            <div style={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                gap: '12px', padding: '48px', textAlign: 'center',
                                background: '#fff', borderRadius: '12px',
                                border: '1px solid #E2E8F0', width: '100%', maxWidth: '800px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                            }}>
                                <FileText size={40} color="#94A3B8" />
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748B' }}>PDF Document</div>
                                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Page {i + 1}</div>
                            </div>
                        ) : (
                            <div style={{ position: 'relative', width: '100%', maxWidth: '800px' }}>
                                <img
                                    src={url}
                                    alt={'Page ' + (i + 1)}
                                    style={{
                                        width: '100%', borderRadius: '12px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                        display: 'block', border: '1px solid #E2E8F0',
                                    }}
                                />
                                <div style={{
                                    position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
                                    background: 'rgba(15, 23, 42, 0.75)', color: '#fff',
                                    fontSize: '12px', fontWeight: '600',
                                    padding: '4px 10px', borderRadius: '20px',
                                    backdropFilter: 'blur(4px)', whiteSpace: 'nowrap'
                                }}>
                                    Page {i + 1} of {images.length}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

/* Format picker modal for Inbox */
`;

    fs.writeFileSync('frontend/src/components/output-box.tsx', codeBefore + filmstripCode + codeAfter);
    console.log('Successfully replaced FilmstripViewer');
} else {
    console.log('Could not find FilmstripViewer boundaries');
}
