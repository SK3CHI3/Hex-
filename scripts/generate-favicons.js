import svg2png from 'svg2png';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateFavicons() {
    try {
        const inputSvg = await fs.readFile(path.join(__dirname, '../public/favicon.svg'));
        
        // Generate PNG for apple-touch-icon (180x180)
        const appleTouchIcon = await svg2png(inputSvg, { width: 180, height: 180 });
        await fs.writeFile(path.join(__dirname, '../public/apple-touch-icon.png'), appleTouchIcon);
        
        // Generate favicon.ico (32x32)
        const faviconPng = await svg2png(inputSvg, { width: 32, height: 32 });
        await fs.writeFile(path.join(__dirname, '../public/favicon.ico'), faviconPng);
        
        console.log('Favicons generated successfully!');
    } catch (err) {
        console.error('Error generating favicons:', err);
    }
}

generateFavicons().catch(console.error);
