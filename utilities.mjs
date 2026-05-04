//--- Help functions ---
export function hitTest(mx, my, x, y, w, h) {
    return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

export function distance(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
}

export function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    words.forEach(word => {
        const testLine = line + word + ' ';
        if (ctx.measureText(testLine).width > maxWidth && line !== '') {
            ctx.fillText(line, x, y);
            line = word + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    });
    ctx.fillText(line, x, y);
}
