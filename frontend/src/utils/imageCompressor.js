/**
 * Compresses and resizes an image File to reduce memory usage on mobile.
 * Target: max 1600px on longest side, JPEG quality 0.85
 * This prevents "low memory" crashes on Android when using camera photos.
 */
export async function compressImage(file, maxDimension = 1600, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            let { width, height } = img;

            // Only resize if image is larger than maxDimension
            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                } else {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        // If compression fails, return original
                        resolve(file);
                        return;
                    }
                    const compressedFile = new File(
                        [blob],
                        file.name.replace(/\.[^.]+$/, '.jpg'),
                        { type: 'image/jpeg' }
                    );
                    resolve(compressedFile);
                },
                'image/jpeg',
                quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            // If we can't load it, just return original file
            resolve(file);
        };

        img.src = objectUrl;
    });
}
