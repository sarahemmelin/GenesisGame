import { BASE_COLORS } from "./constants.mjs";

export function drawLabel(ctx, canvas, playerInitials, playerMedium, playerSource) {
    const pad  = 10;
    const x    = 20;
    const y    = 20;

    const today   = new Date();
    const dateStr = today.toLocaleDateString('en-GB');
    const line1   = `PETRI DISH   ${playerInitials}   ${dateStr}`;
    const line2   = `Medium: ${playerMedium}   Source: ${playerSource}`;

    ctx.font = 'bold 12px monospace';
    const w = Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width) + pad * 2;
    const h = 44;

    ctx.fillStyle = 'rgba(238, 232, 213, 0.92)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#222';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(line1, x + pad, y + pad);
    ctx.font = '11px monospace';
    ctx.fillText(line2, x + pad, y + pad + 17);
    ctx.textBaseline = 'alphabetic';
}

export function drawPopulationPanel(ctx, canvas, embers, alleleCounts, avgFlicker, avgSize, maleCount, femaleCount) {
    ctx.shadowBlur = 0;
    const panelWidth = 220;
    const panelX = canvas.width - panelWidth - 10;
    let panelY = 10;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(panelX, panelY, panelWidth, 150 + Object.keys(alleleCounts).length * 20);

    ctx.fillStyle = 'white';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Population: ${embers.length}`, panelX + 10, panelY + 20);

    ctx.fillText(`Allele pool:`, panelX + 10, panelY + 40);
    const colorKeys = Object.keys(BASE_COLORS);
    colorKeys.forEach((color, i) => {
        const count = alleleCounts[color];
        ctx.fillStyle = count ? 'white' : 'red';
        ctx.fillText(count ? `${color}: ${count}` : `${color}: extinct`, panelX + 30, panelY + 60 + i * 20);
    });
    ctx.fillStyle = 'white';

    ctx.fillText(`Flicker avg: ${avgFlicker.toFixed(2)}`, panelX + 10, panelY + 60 + colorKeys.length * 20 + 20);
    ctx.fillText(`Avg size: ${avgSize.toFixed(1)}`, panelX + 10, panelY + 60 + colorKeys.length * 20 + 40);
    ctx.fillText(`Males: ${maleCount}`, panelX + 10, panelY + 60 + colorKeys.length * 20 + 60);
    ctx.fillText(`Females: ${femaleCount}`, panelX + 10, panelY + 60 + colorKeys.length * 20 + 80);

}
