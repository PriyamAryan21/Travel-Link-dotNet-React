export function getOptimizedImageUrl(url?: string | null, width?: number, height?: number): string {
    if (!url) return '';
    
    // Check if it's a Cloudinary URL
    if (url.includes('res.cloudinary.com')) {
        const parts = url.split('/upload/');
        if (parts.length === 2) {
            // Build transformation string
            const transforms = ['f_auto', 'q_auto']; // auto format (WebP/AVIF) and auto quality
            
            if (width) transforms.push(`w_${width}`);
            if (height) transforms.push(`h_${height}`);
            if (width || height) transforms.push('c_fill'); // crop to fill
            
            return `${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
        }
    }
    return url;
}
