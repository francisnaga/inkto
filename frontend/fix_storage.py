import re
import glob

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()
        
    if 'localStorage' not in text:
        return
        
    if "import { Storage }" not in text:
        text = "import { Storage } from '@/lib/storage';\n" + text
        
    text = re.sub(r'localStorage\.getItem\((.*?)\)', r'await Storage.get(\1)', text)
    text = re.sub(r'localStorage\.setItem\((.*?), (.*?)\)', r'await Storage.set(\1, \2)', text)
    text = re.sub(r'localStorage\.removeItem\((.*?)\)', r'await Storage.remove(\1)', text)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(text)

files = glob.glob('src/app/page.tsx') + glob.glob('src/app/verify/page.tsx') + glob.glob('src/components/output-box.tsx')
for f in files:
    process_file(f)
