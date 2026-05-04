import { BASE_COLORS, GAME_STATE, UI_FONT, UI_COLORS, SHOP_ITEMS } from "./constants.mjs";
import { wrapText } from "./utilities.mjs";

//=== Cache ===
let _populationPanelCache = null;
let _populationPanelKey = null;
let _labelCache = null;
let _vialGlassCache = null;

//=== Constants ===
export const VIAL_WIDTH   = 54;
const        VIAL_HEIGHT_MAX = 340;

export function getVialHeight(canvas) {
    return Math.min(VIAL_HEIGHT_MAX, canvas.height - getVialY(canvas) - 90);
}

export function getVialEmberR(canvas, vialCapacity) {
    const available = getVialHeight(canvas) - 16;
    return Math.min(12, Math.max(5, Math.floor((available - (vialCapacity - 1) * 4) / (vialCapacity * 2))));
}

//=== Vial ===
export function initVialCache(canvas) {
    const pad = 10;
    const cw  = VIAL_WIDTH + pad * 2;
    const ch  = getVialHeight(canvas) + pad * 2;
    _vialGlassCache = new OffscreenCanvas(cw, ch);
    const gc  = _vialGlassCache.getContext('2d');

    const cx = cw / 2;
    const r  = VIAL_WIDTH / 2;
    const bodyTop = pad;
    const bodyBottom = ch - pad - r;

    // Outer tube border (left, bottom arc, right)
    gc.beginPath();
    gc.moveTo(cx - r, bodyTop);
    gc.lineTo(cx - r, bodyBottom);
    gc.arc(cx, bodyBottom, r, Math.PI, 0, true);
    gc.lineTo(cx + r, bodyTop);
    gc.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    gc.lineWidth = 1.5;
    gc.stroke();

    // Left inner highlight (the glass wall catching light)
    gc.beginPath();
    gc.moveTo(cx - r + 4, bodyTop);
    gc.lineTo(cx - r + 4, bodyBottom - 4);
    gc.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    gc.lineWidth = 1.5;
    gc.stroke();

    // Rim
    gc.beginPath();
    gc.moveTo(cx - r, bodyTop);
    gc.lineTo(cx + r, bodyTop);
    gc.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    gc.lineWidth = 2;
    gc.stroke();

    gc.beginPath();
    gc.moveTo(cx - r, bodyTop + 8);
    gc.lineTo(cx + r, bodyTop + 8);
    gc.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    gc.lineWidth = 1;
    gc.stroke();
}

export function getVialX(canvas) {
    return canvas.width - 230 + (230 - VIAL_WIDTH) / 2 - 10;
}

export function getUIScale(canvas) {
    return canvas.width < 1100 ? 0.85 : 1;
}

export function getOrdersPanelHeight(canvas, criteriaCount) {
    const s    = getUIScale(canvas);
    const tabH = Math.round(26 * s);
    const lineH = Math.round(20 * s);
    const contentH = criteriaCount > 0
        ? criteriaCount * lineH + lineH * 2
        : lineH * 2;
    return 28 + tabH + 10 + contentH + 20;
}

export function getVialY(canvas) {
    return 248 + getOrdersPanelHeight(canvas, 2) + 47;
}

export function drawVialContents(ctx, canvas, vialContents, vialCapacity) {
    if (vialContents.length === 0) { return; }

    const vx     = getVialX(canvas);
    const vy     = getVialY(canvas);
    const r      = getVialEmberR(canvas, vialCapacity);
    const bottom = vy + getVialHeight(canvas) - r - 6;

    vialContents.forEach((ember, i) => {
        const ex = vx + VIAL_WIDTH / 2;
        const ey = bottom - i * (r * 2 + 4);
        const color = `rgb(${Math.round(ember.r)}, ${Math.round(ember.g)}, ${Math.round(ember.b)})`;

        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = color;

        if (ember.gender === 'female') {
            ctx.beginPath();
            ctx.roundRect(ex - r, ey - r, r * 2, r * 2, r * 0.35);
        } else {
            ctx.beginPath();
            ctx.arc(ex, ey, r, 0, Math.PI * 2);
        }
        ctx.fill();
    });

    ctx.shadowBlur = 0;
}

export function drawVial(ctx, canvas) {
    if (!_vialGlassCache) { return; }
    const x = getVialX(canvas);
    const y = getVialY(canvas);
    ctx.drawImage(_vialGlassCache, x - 10, y - 10);
}

export function drawVialUI(ctx, canvas, vialContents, vialCapacity, showEmptyConfirm, canShip) {
    const vx   = getVialX(canvas);
    const vy   = getVialY(canvas);
    const cx   = vx + VIAL_WIDTH / 2;
    const full = vialContents.length >= vialCapacity;
    const s    = getUIScale(canvas);
    const fsm  = Math.max(9, Math.round(UI_FONT.SM * s));
    const fxs  = Math.max(9, Math.round(UI_FONT.XS * s));

    // Counter above vial
    ctx.font = `${fsm}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = full ? UI_COLORS.DANGER : 'rgba(255,255,255,0.7)';
    ctx.fillText(`${vialContents.length} / ${vialCapacity}`, cx, vy - 10);

    // Buttons below vial
    const vh    = getVialHeight(canvas);
    const btnY1 = vy + vh + 22;
    const btnY2 = vy + vh + 52;
    const btnW  = 110;
    const btnH  = 24;
    const btnX  = cx - btnW / 2;

    ctx.fillStyle = UI_COLORS.PANEL_BG;
    ctx.fillRect(btnX, btnY1 - 16, btnW, btnH);
    ctx.fillRect(btnX, btnY2 - 16, btnW, btnH);

    ctx.font = `${fsm}px monospace`;
    ctx.fillStyle = vialContents.length > 0 ? 'white' : UI_COLORS.TEXT_DISABLED;
    ctx.fillText('[ empty vial ]', cx, btnY1);

    ctx.fillStyle = canShip ? UI_COLORS.ACCENT : UI_COLORS.TEXT_DISABLED;
    ctx.fillText('[ ship sample ]', cx, btnY2);

    // Confirmation popup
    if (showEmptyConfirm) {
        ctx.fillStyle = UI_COLORS.OVERLAY_BG;
        ctx.fillRect(btnX - 10, btnY1 - 50, btnW + 20, 90);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(btnX - 10, btnY1 - 50, btnW + 20, 90);

        ctx.fillStyle = 'white';
        ctx.font = `${fxs}px monospace`;
        ctx.fillText('Empty vial?', cx, btnY1 - 30);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText('Samples are lost.', cx, btnY1 - 14);

        ctx.fillStyle = UI_COLORS.PANEL_BG;
        ctx.fillRect(btnX, btnY1 + 2, 48, 20);
        ctx.fillRect(btnX + 62, btnY1 + 2, 48, 20);

        ctx.font = `${fxs}px monospace`;
        ctx.fillStyle = UI_COLORS.DANGER;
        ctx.fillText('[ yes ]', cx - 30, btnY1 + 16);
        ctx.fillStyle = 'white';
        ctx.fillText('[ no ]', cx + 38, btnY1 + 16);
    }
}

//=== Label ===
export function initLabelCache(playerInitials, playerMedium, playerSource) {
    const pad     = 10;
    const today   = new Date();
    const dateStr = today.toLocaleDateString('en-GB');
    const line1   = `PETRI DISH   ${playerInitials}   ${dateStr}`;
    const line2   = `Medium: ${playerMedium}   Source: ${playerSource}`;

    const measure = new OffscreenCanvas(1, 1).getContext('2d');
    measure.font = 'bold 12px monospace';
    const w = Math.ceil(Math.max(measure.measureText(line1).width, measure.measureText(line2).width) + pad * 2);
    const h = 44;

    _labelCache = new OffscreenCanvas(w, h);
    const gc = _labelCache.getContext('2d');

    gc.fillStyle = UI_COLORS.PARCH_BG;
    gc.fillRect(0, 0, w, h);
    gc.strokeStyle = 'rgba(0,0,0,0.25)';
    gc.lineWidth = 1;
    gc.strokeRect(0, 0, w, h);

    gc.fillStyle = UI_COLORS.PARCH_TEXT;
    gc.textAlign = 'left';
    gc.textBaseline = 'top';
    gc.font = 'bold 12px monospace';
    gc.fillText(line1, pad, pad);
    gc.font = `${UI_FONT.XS}px monospace`;
    gc.fillText(line2, pad, pad + 17);
}

export function drawLabel(ctx) {
    if (_labelCache) {
        ctx.drawImage(_labelCache, 20, 20);
    }
}

export function drawGoalIndicator(ctx, goalText) {
    if (!goalText) { return; }
    ctx.save();
    ctx.shadowBlur   = 0;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.font         = `${UI_FONT.XS}px monospace`;
    ctx.fillStyle    = UI_COLORS.TEXT_MUTED;
    ctx.fillText('GOAL', 20, 110);
    ctx.font         = `${UI_FONT.SM}px monospace`;
    ctx.fillStyle    = UI_COLORS.TEXT;
    ctx.fillText(goalText, 20, 124);
    ctx.restore();
}

//=== Tutorial ===
export function drawSkipButton(ctx, canvas) {
    const fsm = Math.max(9, Math.round(UI_FONT.SM * getUIScale(canvas)));
    ctx.shadowBlur = 0;
    ctx.fillStyle = UI_COLORS.PANEL_BG;
    ctx.fillRect(20, 74, 130, 24);
    ctx.font = `${fsm}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('[ skip tutorial ]', 30, 90);
}

//=== Panels ===

//--- Orders ---
export function drawOrdersPanel(ctx, canvas, orders, activeOrderIndex, pendingSlots, slotCooldowns, researchPoints) {
    const s    = getUIScale(canvas);
    const fbase = Math.max(9, Math.round(UI_FONT.BASE * s));
    const fsm   = Math.max(9, Math.round(UI_FONT.SM   * s));

    const px  = canvas.width - 230;
    const py  = 248;
    const pw  = 220;
    const criteriaCount = (activeOrderIndex !== null && orders[activeOrderIndex])
        ? orders[activeOrderIndex].criteria.length
        : 0;
    const ph  = getOrdersPanelHeight(canvas, criteriaCount);

    ctx.shadowBlur = 0;
    ctx.textAlign  = 'left';

    ctx.fillStyle = UI_COLORS.PANEL_BG;
    ctx.fillRect(px, py, pw, ph);

    ctx.font      = `${fsm}px monospace`;
    ctx.fillStyle = UI_COLORS.TEXT_DIM;
    ctx.fillText(`SAMPLE ORDERS · ${researchPoints} reputation`, px + 10, py + 18);

    // Tabs
    const tabY = py + 28;
    const tabH = Math.round(26 * s);
    const tabW = 68;
    let   tx   = px + 6;

    // --- Layout constants ---
    const BORDER_R    = 4;   // dark strip visible on right edge
    const CONTENT_PAD = 8;   // text inset from left of content rect
    const lineH       = Math.round(20 * s);
    const contentY    = tabY + tabH + 18;
    const activeOrder  = orders[activeOrderIndex] ?? null;
    const contentRectX = px + 6;
    const contentRectW = pw - 6 - BORDER_R;
    const contentRectH = ph - 53 - tabH;

    ctx.fillStyle = activeOrder ? UI_COLORS.PARCH_BG : UI_COLORS.PARCH_DIM;
    ctx.fillRect(contentRectX, tabY + tabH, contentRectW, contentRectH);

    for (let i = 0; i < 3; i++) {
        const order    = orders[i] ?? null;
        const isActive = i === activeOrderIndex;

        if (order) {
            const isExpiring = order.expiresIn < 120;
            ctx.fillStyle = isActive ? UI_COLORS.PARCH_BG : UI_COLORS.PARCH_DIM;
            ctx.fillRect(tx, tabY, tabW, tabH);

            const pheno = order.criteria[0].phenotype;
            ctx.fillStyle = (pheno && pheno !== 'albino' && BASE_COLORS[pheno])
                ? `rgb(${BASE_COLORS[pheno].r},${BASE_COLORS[pheno].g},${BASE_COLORS[pheno].b})`
                : UI_COLORS.PARCH_MUTED;
            ctx.beginPath();
            ctx.arc(tx + 10, tabY + tabH / 2, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.font      = `${fsm}px monospace`;
            ctx.fillStyle = isExpiring ? UI_COLORS.DANGER : (isActive ? UI_COLORS.PARCH_TEXT : UI_COLORS.PARCH_MUTED);
            ctx.fillText(order.seen ? 'Order' : '! Order', tx + 18, tabY + Math.round(tabH * 0.65));

        } else {
            ctx.fillStyle = UI_COLORS.PARCH_DIM;
            ctx.fillRect(tx, tabY, tabW, tabH);
            ctx.font      = `${fsm}px monospace`;
            if (pendingSlots[i]) {
                const mins = Math.floor(slotCooldowns[i] / 60);
                const secs = Math.floor(slotCooldowns[i] % 60);
                ctx.fillStyle = UI_COLORS.PARCH_TEXT;
                ctx.fillText(`[${mins}:${String(secs).padStart(2, '0')}]`, tx + 4, tabY + Math.round(tabH * 0.65));
            } else {
                ctx.fillStyle = UI_COLORS.PARCH_TEXT;
                ctx.fillText('[ + ]', tx + 6, tabY + Math.round(tabH * 0.65));
            }
        }

        tx += tabW + 3;
    }

    // Active order content
    if (activeOrder) {
        const textX = contentRectX + CONTENT_PAD;
        let   lineY = contentY;

        ctx.font      = `${fsm}px monospace`;
        //ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillStyle = UI_COLORS.PARCH_TEXT;
        ctx.textAlign = 'right';
        ctx.fillText('[ x ]', px + pw - BORDER_R - 6, contentY);
        ctx.textAlign = 'left';

        ctx.font = `${fbase}px monospace`;
        activeOrder.criteria.forEach(line => {
            const genderStr = line.gender ? `${line.gender} ` : '';
            const phenoStr  = line.phenotype ?? 'any';
            ctx.fillStyle   = UI_COLORS.PARCH_TEXT;
            ctx.fillText(`• ${line.count}× ${genderStr}${phenoStr}`, textX, lineY);
            lineY += lineH;
        });

        ctx.font      = `${fsm}px monospace`;
        ctx.fillStyle = UI_COLORS.PARCH_TEXT;
        ctx.fillText('collect in vial', px + 10, lineY + 4);

        const mins    = Math.floor(activeOrder.expiresIn / 60);
        const secs    = Math.floor(activeOrder.expiresIn % 60);
        ctx.fillStyle = activeOrder.expiresIn < 120 ? UI_COLORS.DANGER : UI_COLORS.PARCH_TEXT;
        ctx.fillText(`expires: ${mins}:${String(secs).padStart(2, '0')}`, px + 10, lineY + lineH);
        ctx.fillStyle = UI_COLORS.ACCENT;
        ctx.fillText(`reward: ${activeOrder.reward} reputation`, px + 10, lineY + lineH * 2);

    } else if (orders.length === 0) {
        ctx.font      = `${fbase}px monospace`;
        ctx.fillStyle = UI_COLORS.PARCH_TEXT;
        if (pendingSlots.some(p => p)) {
            ctx.fillText('Pending order incoming...', contentRectX + CONTENT_PAD, contentY);
        } else {
            ctx.fillText('No active orders.', contentRectX + CONTENT_PAD, contentY);
            ctx.fillText('Click [ + ] to request.', contentRectX + CONTENT_PAD, contentY + lineH);
        }
    }
}

//--- Population ---
export function drawPopulationPanel(ctx, canvas, embers, alleleCounts, avgFlicker, avgSize, maleCount, femaleCount) {
    const s         = getUIScale(canvas);
    const fbase     = Math.max(9, Math.round(UI_FONT.BASE * s));
    const colorKeys = Object.keys(BASE_COLORS);
    const alleleKey = colorKeys.map(c => alleleCounts[c] || 0).join(',');
    const key = `${embers.length}|${alleleKey}|${avgFlicker.toFixed(2)}|${avgSize.toFixed(1)}|${maleCount}|${s}`;

    if (key !== _populationPanelKey) {
        _populationPanelKey = key;
        const lh         = Math.round(20 * s);
        const panelWidth  = 220;
        const panelHeight = Math.round((150 + colorKeys.length * 20) * s);
        _populationPanelCache = new OffscreenCanvas(panelWidth, panelHeight);
        const gc = _populationPanelCache.getContext('2d');

        gc.fillStyle = UI_COLORS.PANEL_BG;
        gc.fillRect(0, 0, panelWidth, panelHeight);

        gc.fillStyle = 'white';
        gc.font = `${fbase}px monospace`;
        gc.textAlign = 'left';
        gc.fillText(`Population: ${embers.length}`, 10, lh);
        gc.fillText('Allele pool:', 10, lh * 2);

        colorKeys.forEach((color, i) => {
            const count = alleleCounts[color];
            gc.fillStyle = count ? 'white' : 'red';
            gc.fillText(count ? `${color}: ${count}` : `${color}: extinct`, 30, lh * 3 + i * lh);
        });

        gc.fillStyle = 'white';
        const statsY = lh * 3 + colorKeys.length * lh;
        gc.fillText(`Flicker avg: ${avgFlicker.toFixed(2)}`, 10, statsY + lh);
        gc.fillText(`Avg size: ${avgSize.toFixed(1)}`,       10, statsY + lh * 2);
        gc.fillText(`Males: ${maleCount}`,                   10, statsY + lh * 3);
        gc.fillText(`Females: ${femaleCount}`,               10, statsY + lh * 4);
    }

    ctx.shadowBlur = 0;
    ctx.drawImage(_populationPanelCache, canvas.width - 230, 10);
}

//--- Mode buttons ---
export function drawModeButtons(ctx, canvas, phase2Started, squishMode, glovesUnlocked, glovesActive, glovesRemaining, glovesTimer, researchPoints, antibioticSprays, hormoneDrops, hormoneActive, hormoneTimer){
    if (!phase2Started) {
        return;
    }
    const s     = getUIScale(canvas);
    const fbase = Math.max(9, Math.round(UI_FONT.BASE * s));
    const btnX  = canvas.width - 370;
    const btnY  = 10;

    ctx.fillStyle = UI_COLORS.PANEL_BG;
    ctx.fillRect(btnX - 130, btnY, 120, 30);
    ctx.font = `${fbase}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillStyle = UI_COLORS.ACCENT;
    ctx.fillText(`${researchPoints} reputation`, btnX - 110, btnY + 20);

    ctx.fillStyle = UI_COLORS.PANEL_BG;
    ctx.fillRect(btnX, btnY, 130, 50);
    ctx.font = `${fbase}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillStyle = squishMode ? UI_COLORS.TEXT_DISABLED : 'white';
    ctx.fillText('[ grab ]', btnX + 10, btnY + 20);
    ctx.fillStyle = squishMode ? 'white' : UI_COLORS.TEXT_DISABLED;
    ctx.fillText('[ squish ]', btnX + 10, btnY + 40);

    if (!glovesUnlocked) {
        return;
    }
    ctx.fillStyle = UI_COLORS.PANEL_BG;
    ctx.fillRect(btnX, btnY + 58, 130, 30);
    ctx.font = `${fbase}px monospace`;
    ctx.textAlign = 'left';
    const glovesLabel = glovesActive
        ? `[ gloves ${Math.ceil(glovesTimer)}s ]`
        : glovesRemaining > 0 ? `[ gloves x${glovesRemaining} ]` : '[ gloves x0 ]';
    ctx.fillStyle = glovesActive ? UI_COLORS.GLOVES : (glovesRemaining > 0 ? 'white' : UI_COLORS.TEXT_DISABLED);
    ctx.fillText(glovesLabel, btnX + 10, btnY + 78);

    if (antibioticSprays > 0) {
        ctx.fillStyle = UI_COLORS.PANEL_BG;
        ctx.fillRect(btnX, btnY + 96, 130, 30);
        ctx.font      = `${fbase}px monospace`;
        ctx.textAlign = 'left';
        ctx.fillStyle = 'white';
        ctx.fillText(`[ spray x${antibioticSprays} ]`, btnX + 10, btnY + 116);
    }

    if (hormoneDrops > 0 || hormoneActive) {
        ctx.fillStyle = UI_COLORS.PANEL_BG;
        ctx.fillRect(btnX, btnY + 134, 130, 30);
        ctx.font      = `${fbase}px monospace`;
        ctx.textAlign = 'left';
        const hormoneLabel = hormoneActive
            ? `[ drops ${Math.ceil(hormoneTimer)}s ]`
            : `[ drops x${hormoneDrops} ]`;
        ctx.fillStyle = hormoneActive ? UI_COLORS.ACCENT : 'white';
        ctx.fillText(hormoneLabel, btnX + 10, btnY + 154);
    }
}

//--- Pause / fast-forward ---
export function drawPauseForwardButtons(ctx, canvas, paused, fastForward) {
    const cx    = canvas.width / 2;
    const btnY  = 10;
    const s     = getUIScale(canvas);
    const fbase = Math.max(9, Math.round(UI_FONT.BASE * s));

    ctx.shadowBlur = 0;

    ctx.fillStyle = UI_COLORS.PANEL_BG;
    ctx.fillRect(cx - 73, btnY, 82, 30);
    ctx.font      = `${fbase}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = paused ? UI_COLORS.ACCENT : 'white';
    ctx.fillText(paused ? '[ play ]' : '[ pause ]', cx - 32, btnY + 20);

    ctx.fillStyle = UI_COLORS.PANEL_BG;
    ctx.fillRect(cx + 15, btnY, 58, 30);
    ctx.fillStyle = paused          ? UI_COLORS.TEXT_DISABLED
                  : fastForward     ? UI_COLORS.ACCENT
                  :                   'white';
    ctx.fillText(fastForward ? '[ 1x ]' : '[ >> ]', cx + 44, btnY + 20);
}

//--- Shop ---
export function drawShopButton(ctx, canvas) {
    const s     = getUIScale(canvas);
    const fbase = Math.max(9, Math.round(UI_FONT.BASE * s));
    const btnX  = canvas.width - 370;
    const btnY  = 10;
    ctx.shadowBlur = 0;
    ctx.fillStyle  = UI_COLORS.PANEL_BG;
    ctx.fillRect(btnX - 130, btnY + 34, 120, 28);
    ctx.font      = `${fbase}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'white';
    ctx.fillText('[ shop ]', btnX - 110, btnY + 51);
}

export function drawShopPopup(ctx, canvas, researchPoints, microscopeUnlocked) {
    const cx  = canvas.width / 2;
    const cy  = canvas.height / 2;
    const pw  = 380;
    const ph  = 400;
    const px  = cx - pw / 2;
    const py  = cy - ph / 2;

    ctx.shadowBlur = 0;
    ctx.fillStyle  = UI_COLORS.OVERLAY_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(15, 15, 15, 0.98)';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, pw, ph);

    ctx.font      = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'white';
    ctx.fillText('RESEARCH STORE', px + 16, py + 26);

    ctx.font      = '13px monospace';
    ctx.fillStyle = UI_COLORS.ACCENT;
    ctx.fillText(`Balance: ${researchPoints} reputation`, px + 16, py + 46);

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(px, py + 58);
    ctx.lineTo(px + pw, py + 58);
    ctx.stroke();

    const itemH = 70;
    SHOP_ITEMS.forEach((item, i) => {
        const iy        = py + 66 + i * itemH;
        const canAfford = researchPoints >= item.cost;
        const isOwned   = item.id === 'microscope' && microscopeUnlocked;

        ctx.font      = '14px monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = isOwned ? UI_COLORS.TEXT_DISABLED : 'white';
        ctx.fillText(item.label, px + 16, iy + 18);

        ctx.textAlign = 'right';
        ctx.fillStyle = isOwned   ? UI_COLORS.TEXT_DISABLED
                      : canAfford ? UI_COLORS.ACCENT
                      : UI_COLORS.TEXT_MUTED;
        ctx.fillText(isOwned ? '— owned —' : `${item.cost} rep`, px + pw - 16, iy + 18);

        ctx.textAlign = 'left';
        ctx.font      = '12px monospace';
        ctx.fillStyle = UI_COLORS.TEXT_MUTED;
        ctx.fillText(item.desc, px + 16, iy + 36);

        if (!isOwned) {
            ctx.fillStyle = canAfford ? UI_COLORS.PANEL_BG : 'rgba(0,0,0,0.2)';
            ctx.fillRect(px + pw - 76, iy + 42, 60, 20);
            ctx.font      = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = canAfford ? 'white' : UI_COLORS.TEXT_DISABLED;
            ctx.fillText('[ buy ]', px + pw - 46, iy + 56);
        }

        if (i < SHOP_ITEMS.length - 1) {
            ctx.strokeStyle = 'rgba(255,255,255,0.07)';
            ctx.lineWidth   = 1;
            ctx.beginPath();
            ctx.moveTo(px + 16, iy + 67);
            ctx.lineTo(px + pw - 16, iy + 67);
            ctx.stroke();
        }
    });

    const closeY = py + 66 + SHOP_ITEMS.length * itemH + 12;
    ctx.fillStyle = UI_COLORS.PANEL_BG;
    ctx.fillRect(cx - 44, closeY, 88, 24);
    ctx.font      = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.fillText('[ close ]', cx, closeY + 16);
}

//--- Ember info ---
export function drawEmberInfoPanel(ctx, canvas, selectedEmber, draggedEmber, showEpistasisPopup){
    if (!selectedEmber || draggedEmber === selectedEmber || showEpistasisPopup) {
        return;
    }

    const s          = getUIScale(canvas);
    const fbase      = Math.max(9, Math.round(UI_FONT.BASE * s));
    const lh         = Math.round(20 * s);
    const panelWidth  = Math.round(200 * s);
    const panelHeight = Math.round(120 * s);
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
    ctx.fillStyle = UI_COLORS.PANEL_BG;
    ctx.shadowColor = `rgb(${Math.round(selectedEmber.r)}, ${Math.round(selectedEmber.g)}, ${Math.round(selectedEmber.b)})`;
    ctx.shadowBlur = 20;
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'white';
    ctx.font = `${fbase}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`Allele 1: ${selectedEmber.colorAlleles[0].value} (${selectedEmber.colorAlleles[0].strength.toFixed(2)})`, panelX + 10, panelY + lh);
    ctx.fillText(`Allele 2: ${selectedEmber.colorAlleles[1].value} (${selectedEmber.colorAlleles[1].strength.toFixed(2)})`, panelX + 10, panelY + lh * 2);
    ctx.fillStyle = 'white';
    ctx.fillText('Flicker: ', panelX + 10, panelY + lh * 3);
    let flickerX = panelX + 10 + ctx.measureText('Flicker: ').width;
    const channelDefs = [
        { key: 'r', label: 'R', color: 'rgb(255, 80, 80)' },
        { key: 'g', label: 'G', color: 'rgb(80, 210, 80)' },
        { key: 'b', label: 'B', color: 'rgb(80, 150, 255)' },
    ];
    channelDefs.forEach(ch => {
        const isFlickered = ch.key === selectedEmber.flickeredChannel;
        ctx.fillStyle = isFlickered ? 'rgba(255,255,255,0.2)' : ch.color;
        ctx.fillText(ch.label, flickerX, panelY + lh * 3);
        const w = ctx.measureText(ch.label).width;
        if (isFlickered) {
            ctx.strokeStyle = 'rgba(255,255,255,0.45)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(flickerX, panelY + lh * 3 - 5);
            ctx.lineTo(flickerX + w, panelY + lh * 3 - 5);
            ctx.stroke();
        }
        flickerX += ctx.measureText(ch.label + ' ').width;
    });
    ctx.fillStyle = 'white';
    ctx.fillText(`Gender: ${selectedEmber.gender}`, panelX + 10, panelY + lh * 4);
    const cooldownText = selectedEmber.matingCooldown > 0
        ? `Ready in: ${Math.ceil(selectedEmber.matingCooldown)}s`
        : selectedEmber.age < 10 ? 'Too young' : 'Ready';
    ctx.fillText(`Mate: ${cooldownText}`, panelX + 10, panelY + lh * 5);
}

//--- Microscope ---
export function drawMicroscopeOverlay(ctx, embers) {
    ctx.shadowBlur = 0;
    embers.forEach(ember => {
        const dotR = 3;
        const dotY = ember.y - (ember.displayRadius ?? ember.radius) - 10;
        ember.colorAlleles.forEach((allele, i) => {
            const rgb   = BASE_COLORS[allele.value];
            const alpha = 0.3 + allele.strength * 0.7;
            ctx.beginPath();
            ctx.arc(ember.x + (i === 0 ? -5 : 5), dotY, dotR, 0, Math.PI * 2);
            ctx.fillStyle = rgb
                ? `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`
                : `rgba(255,255,255,${alpha})`;
            ctx.fill();
        });
    });
}

//=== Popups ===
export function drawPopupOverlay(ctx, canvas) {
    ctx.shadowBlur = 0;
    ctx.fillStyle = UI_COLORS.OVERLAY_BG;
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

//=== Legacy (epistasis popup — keep for microscope reuse later sometime) ===
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

    ctx.font = `${UI_FONT.BASE}px monospace`;
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
    ctx.font = `${UI_FONT.SM}px monospace`;
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
        ctx.textAlign = 'center';
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
            ctx.fillText('Click anywhere to continue.', cx, cy + 115);
        }
        ctx.font = '16px sans-serif';
        ctx.fillText(`${epistasisCard + 1} / ${epistasisCards.length}`, cx, cy + 145);
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
