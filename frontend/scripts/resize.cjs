const Jimp = require('jimp');
const path = require('path');

async function processIcon(imgPath, size) {
    try {
        const image = await Jimp.read(imgPath);
        image.autocrop();
        
        // Add 10% padding
        const maxDim = Math.max(image.bitmap.width, image.bitmap.height);
        const padding = Math.floor(maxDim * 0.1);
        const newDim = maxDim + 2 * padding;
        
        // Create a new transparent image
        const newImage = await new Jimp(newDim, newDim, 0x00000000);
        
        // Paste the cropped image in the center
        const xOffset = Math.floor((newDim - image.bitmap.width) / 2);
        const yOffset = Math.floor((newDim - image.bitmap.height) / 2);
        
        newImage.composite(image, xOffset, yOffset);
        
        // Resize to target size
        newImage.resize(size, size);
        
        await newImage.writeAsync(imgPath);
        console.log(`Processed ${imgPath}`);
    } catch (err) {
        console.error(`Error processing ${imgPath}:`, err);
    }
}

async function main() {
    const basePath = path.join(__dirname, '..', 'public');
    await processIcon(path.join(basePath, 'icon-512.png'), 512);
    await processIcon(path.join(basePath, 'icon-192.png'), 192);
}

main();
