const { Jimp } = require('jimp');
async function generateAndroidIcons() {
  const image = await Jimp.read('frontend/assets/icon.png');
  const sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
  };
  
  for (const [folder, size] of Object.entries(sizes)) {
    const clone = image.clone();
    clone.resize({w: size, h: size});
    await clone.write('frontend/android/app/src/main/res/' + folder + '/ic_launcher.png');
    await clone.write('frontend/android/app/src/main/res/' + folder + '/ic_launcher_round.png');
    await clone.write('frontend/android/app/src/main/res/' + folder + '/ic_launcher_foreground.png');
    console.log('Generated ' + folder);
  }
}
generateAndroidIcons().catch(console.error);
