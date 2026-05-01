import { BASE_COLORS, GAME_STATE } from "./constants.mjs";
import { wrapText } from "./utilities.mjs";

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


export function drawModeButtons(ctx, canvas, phase2Started, squishMode, glovesUnlocked, glovesActive, glovesRemaining, glovesTimer){
    if (!phase2Started) {
        return;
    }
    const btnX = canvas.width - 370;
    const btnY = 10;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(btnX, btnY, 130, 50);
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = squishMode ? '#555' : 'white';
    ctx.fillText('[ grab ]', btnX + 10, btnY + 20);
    ctx.fillStyle = squishMode ? 'white' : '#555';
    ctx.fillText('[ squish ]', btnX + 10, btnY + 40);

    if (!glovesUnlocked) {
        return;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(btnX, btnY + 58, 160, 30);
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    const glovesLabel = glovesRemaining > 0 ? `[ gloves x${glovesRemaining} ]` : '[ gloves x0 ]';
    ctx.fillStyle = glovesActive ? '#5b9bd5' : (glovesRemaining > 0 ? 'white' : '#555');
    ctx.fillText(glovesLabel, btnX + 10, btnY + 78);
    if (glovesActive) {
        ctx.fillStyle = '#5b9bd5';
        ctx.fillText(`${Math.ceil(glovesTimer)}s`, btnX + 130, btnY + 78);
    }
}

export function drawEmberInfoPanel(ctx, canvas, selectedEmber, draggedEmber, showEpistasisPopup){
    if (!selectedEmber || draggedEmber === selectedEmber || showEpistasisPopup) {
        return;
    }

    const panelWidth = 200;
    const panelHeight = 120;
    const offset = (selectedEmber.displayRadius ?? selectedEmber.radius) + 15;

    const placeOnRight = selectedEmber.x < canvas.width / 2;
    let panelX = placeOnRight
        ? selectedEmber.x + offset
        : selectedEmber.x - offset - panelWidth;
    let panelY = selectedEmber.y - panelHeight / 2;

    if (panelY < 0) {
        panelY = 0;
    }
    if (panelY + panelHeight > canvas.height) {
        panelY = canvas.height - panelHeight;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.shadowColor = `rgb(${Math.round(selectedEmber.r)}, ${Math.round(selectedEmber.g)}, ${Math.round(selectedEmber.b)})`;
    ctx.shadowBlur = 20;
    ctx.fillRect(panelX, panelY, 200, 120);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'white';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Allele 1: ${selectedEmber.colorAlleles[0].value} (${selectedEmber.colorAlleles[0].strength.toFixed(2)})`, panelX + 10, panelY + 20);
    ctx.fillText(`Allele 2: ${selectedEmber.colorAlleles[1].value} (${selectedEmber.colorAlleles[1].strength.toFixed(2)})`, panelX + 10, panelY + 40);
    ctx.fillText(`Flicker: ${selectedEmber.flickeredChannel ?? 'none'}`, panelX + 10, panelY + 60);
    ctx.fillText(`Gender: ${selectedEmber.gender}`, panelX + 10, panelY + 80);
    const cooldownText = selectedEmber.matingCooldown > 0
        ? `Ready in: ${Math.ceil(selectedEmber.matingCooldown)}s`
        : selectedEmber.age < 10 ? 'Too young' : 'Ready';
    ctx.fillText(`Mate: ${cooldownText}`, panelX + 10, panelY + 100);

}

export function drawPopupOverlay(ctx, canvas) {
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
}

export function drawExtinctPopup(ctx, canvas, currentGameState, extinctColor) {
    const isPlaying = currentGameState === GAME_STATE.PLAYING;
    drawPopupOverlay(ctx, canvas);
    ctx.fillStyle = 'red';
    ctx.fillText(`The ${extinctColor} allele went extinct.`, canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(isPlaying ? 'Click anywhere to continue.' : 'Click anywhere to try again.', canvas.width / 2, canvas.height / 2 + 20);
}

export function drawGermIntroPopup(ctx, canvas, germIntroCard) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const navY = canvas.height * 0.70;
    drawPopupOverlay(ctx, canvas);
    if (germIntroCard === 0) {
        ctx.fillText("You've touched the petri dish too many times and introduced germs!", cx, cy - 20);
        ctx.font = '28px sans-serif';
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 10;
        ctx.fillText('▶', cx + 280, navY);
    } else {
        ctx.fillText('You need to act fast and SQUISH them.', cx, cy - 20);
        ctx.font = '16px sans-serif';
        ctx.fillText('Click the [ squish ] button in the top right, or hold Shift and left-click.', cx, cy + 20);
        ctx.font = '28px sans-serif';
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 10;
        ctx.fillText('◀', cx - 200, navY);
        ctx.shadowBlur = 0;
        ctx.font = '16px sans-serif';
        ctx.fillText('Click anywhere to continue.', cx, navY - 30);
    }
    ctx.shadowBlur = 0;
}

export function drawGlovesPopup(ctx, canvas, glovesPopupCard) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const navY = canvas.height * 0.70;
    drawPopupOverlay(ctx, canvas);
    if (glovesPopupCard === 0) {
        ctx.fillText('You found medical gloves!', cx, cy - 20);
        ctx.font = '16px sans-serif';
        ctx.fillText('Gloves protect the petri dish from contamination.', cx, cy + 20);
        ctx.font = '28px sans-serif';
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 10;
        ctx.fillText('▶', cx + 280, navY);
    } else {
        ctx.fillText('You have 3 uses, each lasting 60 seconds.', cx, cy - 20);
        ctx.font = '16px sans-serif';
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 10;
        ctx.fillText('◀', cx - 200, navY);
        ctx.shadowBlur = 0;
        ctx.fillText('Click anywhere to continue.', cx, navY - 30);
    }
    ctx.shadowBlur = 0;
}

export function drawPhase2Win(ctx, canvas, phase2WinCard) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const navY = canvas.height * 0.70;
    drawPopupOverlay(ctx, canvas);
    if (phase2WinCard === 0) {
        ctx.fillText('The population is thriving.', cx, cy - 20);
        ctx.font = '28px sans-serif';
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 10;
        ctx.fillText('▶', cx + 280, navY);
    } else {
        ctx.font = '16px sans-serif';
        wrapText(ctx, 'But something is coming. A virus has been detected, and it targets a specific allele. If that allele disappears from your population, it is gone forever.', cx, cy - 20, 500, 28);
        ctx.font = '28px sans-serif';
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 10;
        ctx.fillText('◀', cx - 200, navY);
        ctx.shadowBlur = 0;
        ctx.font = '16px sans-serif';
        ctx.fillText('Click anywhere to continue.', cx, navY - 30);
    }
    ctx.shadowBlur = 0;
}

export function drawBonusCard(ctx, canvas, selectedEmber, bonusCardShownAt) {
    const de = selectedEmber;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fillRect(cx - 250, cy - 150, 500, 300);

    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.fillText('You found it!', cx, cy - 110);

    ctx.font = '13px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('Inherited from parents:', cx, cy - 85);

    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    const x = cx - 220;

    // Allele names colored in their BASE_COLOR
    const allele1 = de.colorAlleles[0];
    const allele2 = de.colorAlleles[1];
    const col1 = BASE_COLORS[allele1.value];
    const col2 = BASE_COLORS[allele2.value];

    ctx.fillStyle = 'white';
    ctx.fillText('Allele 1: ', x, cy - 55);
    ctx.fillStyle = col1 ? `rgb(${col1.r}, ${col1.g}, ${col1.b})` : 'white';
    ctx.fillText(`${allele1.value} (${allele1.strength.toFixed(2)})`, x + ctx.measureText('Allele 1: ').width, cy - 55);

    ctx.fillStyle = 'white';
    ctx.fillText('Allele 2: ', x, cy - 30);
    ctx.fillStyle = col2 ? `rgb(${col2.r}, ${col2.g}, ${col2.b})` : 'white';
    ctx.fillText(`${allele2.value} (${allele2.strength.toFixed(2)})`, x + ctx.measureText('Allele 2: ').width, cy - 30);

    ctx.fillStyle = 'white';
    ctx.fillText(`Gender: ${de.gender}`, x, cy + 50);

    const CHANNEL_COLORS = { r: '#ff4444', g: '#44ff44', b: '#4499ff' };
    const channels = ['r', 'g', 'b'];
    const values = [Math.round(de.r), Math.round(de.g), Math.round(de.b)];

    const elapsed = Date.now() - bonusCardShownAt;
    const settled = elapsed >= 4000;
    const showChannelColor = !settled && Math.floor(elapsed / 500) % 2 === 0;

    ctx.fillStyle = 'white';
    ctx.fillText('RGB:', x, cy - 5);
    let rx = x + ctx.measureText('RGB: ').width;
    channels.forEach((ch, i) => {
        const isFlickered = ch === de.flickeredChannel;
        ctx.fillStyle = isFlickered ? (showChannelColor ? CHANNEL_COLORS[ch] : 'white') : CHANNEL_COLORS[ch];
        ctx.fillText(String(values[i]), rx, cy - 5);
        rx += ctx.measureText(String(values[i]) + '   ').width;
    });

    ctx.fillStyle = 'white';
    ctx.fillText('Channel flickered off:', x, cy + 20);
    let lx = x + ctx.measureText('Channel flickered off: ').width;
    channels.forEach(ch => {
        const isFlickered = ch === de.flickeredChannel;
        ctx.fillStyle = isFlickered ? (showChannelColor ? CHANNEL_COLORS[ch] : 'white') : CHANNEL_COLORS[ch];
        ctx.fillText(ch.toUpperCase(), lx, cy + 20);
        lx += ctx.measureText('X  ').width;
    });

    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('[ Close ]', cx, cy + 120);
}

function drawParentVisual(ctx, cx, centerY, parent1, parent2) {
    const dad = parent1.gender === 'male' ? parent1 : parent2;
    const mom = parent1.gender === 'female' ? parent1 : parent2;
    const r = 18;
    const dadX = cx - 200;
    const momX = cx - 20;

    // Dad (circle)
    const dadColor = `rgb(${Math.round(dad.r)}, ${Math.round(dad.g)}, ${Math.round(dad.b)})`;
    ctx.shadowColor = dadColor;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(dadX, centerY, r, 0, Math.PI * 2);
    ctx.fillStyle = dadColor;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('+', cx - 110, centerY + 7);

    // Mom (rounded square)
    const momColor = `rgb(${Math.round(mom.r)}, ${Math.round(mom.g)}, ${Math.round(mom.b)})`;
    ctx.shadowColor = momColor;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(momX - r, centerY - r, r * 2, r * 2, r * 0.35);
    ctx.fillStyle = momColor;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('=', cx + 80, centerY + 7);

    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('?', cx + 150, centerY + 10);
    ctx.shadowBlur = 0;

    // Alleles below each parent
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    const alY1 = centerY + r + 20;
    const alY2 = centerY + r + 38;

    [[dad, dadX - 75], [mom, momX - 75]].forEach(([parent, alX]) => {
        [parent.colorAlleles[0], parent.colorAlleles[1]].forEach((allele, i) => {
            const col = BASE_COLORS[allele.value];
            const label = `Allele ${i + 1}: `;
            const y = i === 0 ? alY1 : alY2;
            ctx.fillStyle = 'white';
            ctx.fillText(label, alX, y);
            ctx.fillStyle = col ? `rgb(${col.r}, ${col.g}, ${col.b})` : 'white';
            ctx.fillText(`${allele.value} (${allele.strength.toFixed(2)})`, alX + ctx.measureText(label).width, y);
        });
    });
}

export function drawEpistasisPopup(ctx, canvas, epistasisCard, epistasisCards, epistasisEmberFound, showBonusCard, selectedEmber, draggedEmber, bonusCardShownAt) {
    drawPopupOverlay(ctx, canvas);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.textAlign = 'center';

    if (epistasisCard === 0) {
        ctx.fillText('EPISTASIS!', cx, cy - 175);
        if (selectedEmber && selectedEmber.parent1 && selectedEmber.parent2) {
            drawParentVisual(ctx, cx, cy - 110, selectedEmber.parent1, selectedEmber.parent2);
        }
        ctx.font = '16px sans-serif';
        ctx.fillStyle = 'white';
        ctx.fillText('Something unusual happened.', cx, cy - 20);
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('An unusual ember was born.', cx, cy + 10);
        ctx.font = '16px sans-serif';
        ctx.fillText('Can you find it?', cx, cy + 40);
        if (!epistasisEmberFound) {
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fillText('Click the ember to continue.', cx, cy + 80);
        }
        ctx.fillStyle = 'white';
        ctx.fillText(`${epistasisCard + 1} / ${epistasisCards.length}`, cx, cy + 115);
    } else {
        ctx.fillText('EPISTASIS!', cx, cy - 80);
        ctx.font = '16px sans-serif';
        wrapText(ctx, epistasisCards[epistasisCard], cx, cy, 500, 28);
        ctx.font = '28px sans-serif';
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 10;
        ctx.fillText('◀', cx - 200, cy + 80);
        if (epistasisCard < epistasisCards.length - 1) {
            ctx.fillText('▶', cx + 200, cy + 80);
        }
        ctx.shadowBlur = 0;
        if (epistasisCard === epistasisCards.length - 1) {
            ctx.font = '16px sans-serif';
            ctx.fillText('Click anywhere to continue.', cx, cy + 50);
        }
        ctx.font = '16px sans-serif';
        ctx.fillText(`${epistasisCard + 1} / ${epistasisCards.length}`, cx, cy + 110);
    }

    drawEmberInfoPanel(ctx, canvas, selectedEmber, draggedEmber, true);
    if (showBonusCard) {
        drawBonusCard(ctx, canvas, selectedEmber, bonusCardShownAt);
    }
    if (selectedEmber) {
        selectedEmber.draw(ctx, true);
    }
    ctx.shadowBlur = 0;
}