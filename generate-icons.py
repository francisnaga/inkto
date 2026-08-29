import os
from PIL import Image

logo_path = r'C:\Users\PAP AMNESTY\.gemini\antigravity\brain\7fc5013e-f309-4183-909b-09a2070361d1\inkto_logo_1787950385675.jpg'
base_dir = r'C:\Users\PAP AMNESTY\Downloads\Legal Text Ai Transcriber'

try:
    img = Image.open(logo_path).convert('RGBA')
    
    # Crop to square
    width, height = img.size
    min_dim = min(width, height)
    left = (width - min_dim) / 2
    top = (height - min_dim) / 2
    right = (width + min_dim) / 2
    bottom = (height + min_dim) / 2
    img = img.crop((left, top, right, bottom))
    
    # Define sizes
    android_sizes = {
        'mdpi': 48,
        'hdpi': 72,
        'xhdpi': 96,
        'xxhdpi': 144,
        'xxxhdpi': 192
    }
    
    res_dir = os.path.join(base_dir, 'frontend', 'android', 'app', 'src', 'main', 'res')
    
    for density, size in android_sizes.items():
        mipmap_dir = os.path.join(res_dir, f'mipmap-{density}')
        if not os.path.exists(mipmap_dir):
            os.makedirs(mipmap_dir)
            
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        
        resized.save(os.path.join(mipmap_dir, 'ic_launcher.png'), 'PNG')
        resized.save(os.path.join(mipmap_dir, 'ic_launcher_round.png'), 'PNG')
        resized.save(os.path.join(mipmap_dir, 'ic_launcher_foreground.png'), 'PNG')
        print(f'Saved {density} Android icons')

    # Web Icons
    public_dir = os.path.join(base_dir, 'frontend', 'public')
    if not os.path.exists(public_dir):
        os.makedirs(public_dir)
        
    img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(public_dir, 'icon.png'), 'PNG')
    img.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(public_dir, 'icon-192.png'), 'PNG')
    img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(public_dir, 'icon-512.png'), 'PNG')
    img.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(public_dir, 'apple-touch-icon.png'), 'PNG')
    
    # Favicon (32x32)
    favicon = img.resize((32, 32), Image.Resampling.LANCZOS)
    favicon.save(os.path.join(public_dir, 'favicon.ico'), format='ICO', sizes=[(32, 32)])
    
    print('Saved Web icons')
    
except Exception as e:
    print('Error:', e)
