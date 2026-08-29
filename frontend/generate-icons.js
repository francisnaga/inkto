const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const logoPath = 'C:\\Users\\PAP AMNESTY\\.gemini\\antigravity\\brain\\7fc5013e-f309-4183-909b-09a2070361d1\\inkto_logo_1787950385675.jpg';
const baseDir = 'C:\\Users\\PAP AMNESTY\\Downloads\\Legal Text Ai Transcriber';

async function processIcons() {
  try {
    const androidSizes = {
      'mdpi': 48,
      'hdpi': 72,
      'xhdpi': 96,
      'xxhdpi': 144,
      'xxxhdpi': 192
    };

    const resDir = path.join(baseDir, 'frontend', 'android', 'app', 'src', 'main', 'res');

    for (const [density, size] of Object.entries(androidSizes)) {
      const mipmapDir = path.join(resDir, 'mipmap-' + density);
      if (!fs.existsSync(mipmapDir)) {
        fs.mkdirSync(mipmapDir, { recursive: true });
      }

      await sharp(logoPath)
        .resize(size, size, { fit: 'cover' })
        .png()
        .toFile(path.join(mipmapDir, 'ic_launcher.png'));
        
      await sharp(logoPath)
        .resize(size, size, { fit: 'cover' })
        .png()
        .toFile(path.join(mipmapDir, 'ic_launcher_round.png'));
        
      await sharp(logoPath)
        .resize(size, size, { fit: 'cover' })
        .png()
        .toFile(path.join(mipmapDir, 'ic_launcher_foreground.png'));
    }
    console.log('Android icons generated.');

    const publicDir = path.join(baseDir, 'frontend', 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    await sharp(logoPath).resize(512, 512, { fit: 'cover' }).png().toFile(path.join(publicDir, 'icon.png'));
    await sharp(logoPath).resize(192, 192, { fit: 'cover' }).png().toFile(path.join(publicDir, 'icon-192.png'));
    await sharp(logoPath).resize(512, 512, { fit: 'cover' }).png().toFile(path.join(publicDir, 'icon-512.png'));
    await sharp(logoPath).resize(180, 180, { fit: 'cover' }).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
    
    // For favicon, use png (most modern browsers support it)
    await sharp(logoPath).resize(32, 32, { fit: 'cover' }).png().toFile(path.join(publicDir, 'favicon.ico'));

    console.log('Web icons generated.');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

processIcons();
