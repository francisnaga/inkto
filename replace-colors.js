const fs = require('fs');

let content = fs.readFileSync('frontend/src/components/output-box.tsx', 'utf8');

const colorMap = {
  // Primary (Blues -> Deep Purple)
  '#2563EB': '#4F46E5', // Blue 600 -> Indigo 600
  '#1D4ED8': '#4338CA', // Blue 700 -> Indigo 700
  '#3B82F6': '#6366F1', // Blue 500 -> Indigo 500
  '#EFF6FF': '#E0E7FF', // Blue 50  -> Indigo 100
  
  // Text Main (Warm Dark -> Cool Dark Navy)
  '#1C1917': '#0F172A', // Stone 900 -> Slate 900
  '#0B0D12': '#0F172A', 
  
  // Text Muted (Warm Gray -> Slate Gray)
  '#78716C': '#64748B', // Stone 500 -> Slate 500
  '#57534E': '#64748B', // Stone 600 -> Slate 500
  '#44403C': '#475569', // Stone 700 -> Slate 600
  '#4B5563': '#64748B', // Gray 600 -> Slate 500
  '#A8A29E': '#94A3B8', // Stone 400 -> Slate 400
  '#9CA3AF': '#94A3B8', // Gray 400 -> Slate 400
  
  // Borders (Warm Gray -> Cool Gray)
  '#E4E2DC': '#E2E8F0', // Custom Stone -> Slate 200
  '#D6D3D1': '#CBD5E1', // Stone 300 -> Slate 300
  '#C4C0BB': '#CBD5E1', // Custom Stone -> Slate 300
  
  // Backgrounds (Warm Light -> Cool Light)
  '#FAFAF9': '#F8FAFC', // Stone 50 -> Slate 50
  '#F5F4F0': '#F1F5F9', // Custom Stone -> Slate 100
  '#F0EFEB': '#F1F5F9', // Custom Stone -> Slate 100
};

for (const [oldColor, newColor] of Object.entries(colorMap)) {
  const regex = new RegExp(oldColor, 'gi');
  content = content.replace(regex, newColor);
}

// Fonts
content = content.replace(/fontFamily: ['"](UI|DISPLAY)['"]/g, "fontFamily: 'var(--font-sans)'");
content = content.replace(/fontFamily: (UI|DISPLAY)/g, "fontFamily: 'var(--font-sans)'");

// Ensure className includes font-sans
content = content.replace(/<div style={{ animation: 'fadeIn 0.4s ease'/g, "<div className=\"font-sans\" style={{ animation: 'fadeIn 0.4s ease'");

fs.writeFileSync('frontend/src/components/output-box.tsx', content);
console.log('Colors and fonts replaced!');
