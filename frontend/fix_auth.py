import re

with open('src/contexts/auth-context.tsx', 'r') as f:
    text = f.read()

text = "import { Storage } from '@/lib/storage';\n" + text
text = re.sub(r'localStorage\.getItem\((.*?)\)', r'await Storage.get(\1)', text)
text = re.sub(r'localStorage\.setItem\((.*?), (.*?)\)', r'await Storage.set(\1, \2)', text)
text = re.sub(r'localStorage\.removeItem\((.*?)\)', r'await Storage.remove(\1)', text)

# Fix the useState callback issue
pattern = r"const \[user, setUser\] = useState<AuthUser \| null>\(\(\) => \{.*?\n    return null;\n  \}\);"
replacement = "const [user, setUser] = useState<AuthUser | null>(null);"
text = re.sub(pattern, replacement, text, flags=re.DOTALL)

with open('src/contexts/auth-context.tsx', 'w') as f:
    f.write(text)
