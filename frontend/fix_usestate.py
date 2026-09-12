import re
with open('src/components/output-box.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

pattern1 = r"const \[reviewed, setReviewed\] = useState\(\(\) => \{\n    if \(typeof window !== 'undefined'\) \{\n        if \(\!sessionId\) return false;\n        return await Storage\.get\('inkto_reviewed_' \+ sessionId\) === 'true';\n    \}\n    return false;\n  \}\);"
replacement1 = "const [reviewed, setReviewed] = useState(false);\n  useEffect(() => {\n    if (sessionId) Storage.get('inkto_reviewed_' + sessionId).then(v => setReviewed(v === 'true'));\n  }, [sessionId]);"
text = re.sub(pattern1, replacement1, text, flags=re.DOTALL)

pattern2 = r"const \[email, setEmail\] = useState\(\(\) => await Storage\.get\('inkto_last_email'\) \|\| ''\);"
replacement2 = "const [email, setEmail] = useState('');\n  useEffect(() => {\n    Storage.get('inkto_last_email').then(v => { if (v) setEmail(v); });\n  }, []);"
text = text.replace(pattern2, replacement2)

with open('src/components/output-box.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
