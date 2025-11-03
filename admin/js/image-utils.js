// Utilities for image handling
window.ImageUtils = {
    generateFallbackImage(text, options = {}) {
        const canvas = document.createElement('canvas');
        canvas.width = options.width || 400;
        canvas.height = options.height || 200;
        const ctx = canvas.getContext('2d');
        
        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#FF7900');
        gradient.addColorStop(1, '#ff9933');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add pattern
        if (options.pattern !== false) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i < canvas.width; i += 20) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i + 10, canvas.height);
                ctx.stroke();
            }
        }

        // Add circles decoration
        if (options.circles !== false) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            for (let i = 0; i < 5; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const radius = 20 + Math.random() * 40;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // ODC Logo
        if (options.logo !== false) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('ODC', canvas.width / 2, canvas.height / 2 - 30);
        }
        
        // Text settings for title
        ctx.font = options.font || 'bold 20px "Open Sans", sans-serif';
        ctx.fillStyle = options.textColor || '#FFFFFF';
        ctx.textAlign = 'center';
        
        // Word wrap
        const maxWidth = options.maxWidth || 360;
        const words = text.split(' ');
        let lines = [];
        let currentLine = words[0];
        
        // Calculate lines
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        
        // Draw each line
        const lineHeight = options.lineHeight || 25;
        const totalHeight = lines.length * lineHeight;
        const startY = options.logo !== false ? 
            (canvas.height - totalHeight) / 2 + 40 :
            (canvas.height - totalHeight) / 2;
        
        lines.forEach((line, i) => {
            ctx.fillText(line, canvas.width / 2, startY + (i * lineHeight));
        });
        
        // Add border
        if (options.border !== false) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 4;
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        }
        
        return canvas.toDataURL('image/png');
    },

    validateImageUrl(url) {
        if (!url) return { isValid: false, url: '' };
        
        try {
            // Vérifier si l'URL est valide
            const isValidUrl = url && (url.startsWith('http') || url.startsWith('https'));
            
            if (!isValidUrl) {
                return { isValid: false, url: '' };
            }

            return { isValid: true, url };
        } catch (error) {
            console.warn(`⚠️ Erreur de validation d'image: ${error.message}`, url);
            return { isValid: false, url: '' };
        }
    }
};