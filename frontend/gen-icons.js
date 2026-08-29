const { Jimp } = require('jimp');
async function generate() {
  const image = await Jimp.read('frontend/assets/icon.jpg');
  const size = Math.min(image.bitmap.width, image.bitmap.height);
  image.cover({w: size, h: size}).resize({w: 1024, h: 1024});
  await image.write('frontend/assets/icon.png');
  console.log('icon.png created!');
  
  const splash = await Jimp.read('frontend/assets/icon.jpg');
  splash.cover({w: 2732, h: 2732});
  await splash.write('frontend/assets/splash.png');
  console.log('splash.png created!');
}
generate().catch(console.error);
