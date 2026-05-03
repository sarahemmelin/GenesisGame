import Ember from "./ember.mjs";
import Germ from "./germ.mjs";
import Virus from "./virus.mjs";
import { CURSOR_OPEN, CURSOR_OPEN_GLOVE, CURSOR_REACH, CURSOR_REACH_GLOVE, CURSOR_PINCH, CURSOR_PINCH_GLOVE, CURSOR_POINT, CURSOR_POINT_GLOVE, CURSOR_POINT_PRESS, CURSOR_POINT_PRESS_GLOVE } from "./cursors.mjs";
import { BASE_COLORS, GAME_STATE, TUTORIAL_STEP, SHOP_ITEMS } from "./constants.mjs";
import { generateOrder, updateOrders, checkFulfilled } from "./orders.mjs";
import { spawnTutorialEmbers, isShowingIntro, isShowingMatingSuccess, isShowingGoalCards, isTutorialActive, getStep, draw as drawTutorial, handleClick as handleTutorialClick, update as updateTutorial, resetToPhase2, completeTutorial } from "./tutorial.mjs";
import { distance } from "./utilities.mjs";
import { initLabelCache, drawLabel, drawSkipButton, initVialCache, drawVial, drawVialContents, drawVialUI, getVialX, getVialY, getVialHeight, getVialEmberR, getUIScale, VIAL_WIDTH, drawPopulationPanel, drawModeButtons, drawShopButton, drawShopPopup, drawMicroscopeOverlay, drawEmberInfoPanel, drawExtinctPopup, drawPopupOverlay, drawGermIntroPopup, drawGlovesPopup, drawPhase2Win, drawOrdersPanel } from "./ui.mjs";


//=== Canvas setup ===
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//=== Start screen ===
document.body.style.cursor = CURSOR_OPEN;
const startScreen   = document.getElementById('start-screen');
const startButton   = document.getElementById('start-button');
const initialsInput = document.getElementById('initials');
const sourceInput   = document.getElementById('source');

let playerInitials = '';
let playerSource   = '';
let playerMedium   = 'LB Agar';

const MEDIUM_COLORS = {
    'LB Agar':        '#1a1a14',
    'Blood Agar':     '#1a0a0a',
    'MacConkey Agar': '#1a1008',
    'Chocolate Agar': '#1a1208',
};

// Pre-fill saved values
initialsInput.value = localStorage.getItem('genesis_initials') ?? '';
const savedMedium = localStorage.getItem('genesis_medium') ?? 'LB Agar';
document.querySelector(`input[name="medium"][value="${savedMedium}"]`).checked = true;
canvas.style.backgroundColor = MEDIUM_COLORS[savedMedium] ?? '#1a1a14';

startButton.addEventListener('click', () => {
    playerInitials = initialsInput.value.trim() || '—';
    playerSource   = sourceInput.value.trim()   || '—';
    playerMedium   = document.querySelector('input[name="medium"]:checked').value;
    localStorage.setItem('genesis_initials', playerInitials);
    localStorage.setItem('genesis_medium',   playerMedium);
    canvas.style.backgroundColor = MEDIUM_COLORS[playerMedium] ?? '#1a1a14';
    startScreen.style.display = 'none';
    initLabelCache(playerInitials, playerMedium, playerSource);
    initVialCache(canvas);
    requestAnimationFrame(gameLoop);
});
startButton.addEventListener('mouseenter', () => { document.body.style.cursor = CURSOR_POINT; });
startButton.addEventListener('mouseleave', () => { document.body.style.cursor = CURSOR_OPEN; });

document.querySelectorAll('.medium-options label').forEach(label => {
    label.addEventListener('mouseenter',  () => { document.body.style.cursor = CURSOR_POINT; });
    label.addEventListener('mouseleave',  () => { document.body.style.cursor = CURSOR_OPEN; });
    label.addEventListener('mousedown',   () => { document.body.style.cursor = CURSOR_POINT_PRESS; });
    label.addEventListener('mouseup',     () => { document.body.style.cursor = CURSOR_POINT; });
});

document.querySelectorAll('input[name="medium"]').forEach(radio => {
    radio.addEventListener('change', () => {
        canvas.style.backgroundColor = MEDIUM_COLORS[radio.value] ?? '#1a1a14';
    });
});

//=== Constants ===
const EMBER_HIT_PADDING = 30;

//=== State ===
let mouseX = 0;
let mouseY = 0;
let selectedEmber = null;
let draggedEmber = null;
let squishedEmber = null;

//--- Embers ---
let embers = spawnTutorialEmbers(canvas.width, canvas.height);


//--- Germs ---
let germs = [];
let germSpawnThreshold = Math.floor(Math.random() * 26) + 15; 
let lifetimeEmberCount = embers.length;

//--- Viruses ---
let viruses = [];
let virusOutbreakTimer = 0;
let virusOutbreakInterval = 180 + Math.random() * 120;

//--- Flags and references ---
let currentGameState = GAME_STATE.TUTORIAL;
let phase2Started = false;
let glovesRemaining = 3;
let glovesActive = false;
let glovesTimer = 0;
let glovesUnlocked = false;
let petriClickCount = 0;
let showGermIntroPopup = false;
let germIntroSeen = false;
let germIntroCard = 0;
let tutorialGermsActive = false;
let tutorialGermsKilled = 0;
let glovePopupTimer = 0;
let showGlovesPopup = false;
let glovesPopupCard = 0;
let showExtinctPopup = false;
let extinctColor = '';
let showPhase2Win = false;
let phase2WinSeen = false;
let phase2WinCard = 0;
let squishMode = false;
let clicksSinceLastGerm = 0;

//--- Vial ---
let vialContents = [];
let vialCapacity = 10;
let showEmptyConfirm = false;

//--- Orders ---
let orders = [];
let activeOrderIndex = 0;
let requestCooldown = 0;
let orderPending = false;
let researchPoints = 0;
let canShip = false;

//--- Shop ---
let showShop           = false;
let microscopeUnlocked = false;
let hormoneDrops       = 0;
let hormoneActive      = false;
let hormoneTimer       = 0;
let antibioticSprays   = 0;


//=== Popups ===


//=== Event listeners ===
canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (draggedEmber) {
        draggedEmber.x = mouseX;
        draggedEmber.y = mouseY;
    }

    const hoveringEmber = !draggedEmber && embers.find(ember =>
        distance(ember.x, ember.y, mouseX, mouseY) < ember.radius + EMBER_HIT_PADDING
    );

    const btnX = canvas.width - 370;
    const btnY = 10;
    const hoveringButton = phase2Started && (
        (mouseX >= btnX && mouseX <= btnX + 130 && mouseY >= btnY && mouseY <= btnY + 50) ||
        (glovesUnlocked && mouseX >= btnX && mouseX <= btnX + 160 && mouseY >= btnY + 58 && mouseY <= btnY + 88) ||
        (glovesUnlocked && antibioticSprays > 0 && mouseX >= btnX && mouseX <= btnX + 130 && mouseY >= btnY + 96 && mouseY <= btnY + 126) ||
        (glovesUnlocked && (hormoneDrops > 0 || hormoneActive) && mouseX >= btnX && mouseX <= btnX + 130 && mouseY >= btnY + 134 && mouseY <= btnY + 164)
    );
    const hoveringSkip = currentGameState === GAME_STATE.TUTORIAL &&
        mouseX >= 20 && mouseX <= 150 && mouseY >= 74 && mouseY <= 98;

    let hoveringOrdersPanel = false;
    if (phase2Started) {
        const opx  = canvas.width - 230;
        const tabY = 248 + 28;
        const tabH = Math.round(26 * getUIScale(canvas));
        const tabW = 68;
        const tabsEnd = opx + 6 + orders.length * (tabW + 3);
        hoveringOrdersPanel =
            mouseY >= tabY && mouseY <= tabY + tabH && (
                mouseX >= opx + 6 && mouseX <= tabsEnd ||
                (orders.length < 3 && mouseX >= tabsEnd && mouseX <= tabsEnd + 50)
            );
    }

    let hoveringShopUI = false;
    if (phase2Started) {
        const shopBtnX = canvas.width - 490;
        if (mouseX >= shopBtnX && mouseX <= shopBtnX + 110 && mouseY >= 44 && mouseY <= 68) {
            hoveringShopUI = true;
        }
    }
    if (showShop) {
        const scx = canvas.width / 2;
        const scy = canvas.height / 2;
        const spx = scx - 190;
        const spy = scy - 200;
        const itemH = 70;
        SHOP_ITEMS.forEach((item, i) => {
            const iy      = spy + 66 + i * itemH;
            const isOwned = item.id === 'microscope' && microscopeUnlocked;
            if (!isOwned && researchPoints >= item.cost &&
                mouseX >= spx + 380 - 76 && mouseX <= spx + 380 - 16 &&
                mouseY >= iy + 42 && mouseY <= iy + 62) {
                hoveringShopUI = true;
            }
        });
        const closeY = spy + 66 + SHOP_ITEMS.length * itemH + 12;
        if (mouseX >= scx - 44 && mouseX <= scx + 44 && mouseY >= closeY && mouseY <= closeY + 24) {
            hoveringShopUI = true;
        }
    }

    let hoveringVialButton = false;
    let hoveringVialEmber = false;
    if (currentGameState === GAME_STATE.PLAYING) {
        const vvx  = getVialX(canvas);
        const vvy  = getVialY(canvas);
        const vvcx = vvx + VIAL_WIDTH / 2;
        const vBtnX1 = vvcx - 55;
        const vvh    = getVialHeight(canvas);
        const vBtnY1 = vvy + vvh + 22;
        const vBtnY2 = vvy + vvh + 52;
        if (showEmptyConfirm) {
            hoveringVialButton = mouseY >= vBtnY1 + 2 && mouseY <= vBtnY1 + 22 &&
                ((mouseX >= vvcx - 55 && mouseX <= vvcx - 7) ||
                 (mouseX >= vvcx + 14 && mouseX <= vvcx + 62));
        } else {
            const overEmpty = mouseX >= vBtnX1 && mouseX <= vBtnX1 + 110 && mouseY >= vBtnY1 - 16 && mouseY <= vBtnY1 + 8;
            const overShip  = mouseX >= vBtnX1 && mouseX <= vBtnX1 + 110 && mouseY >= vBtnY2 - 16 && mouseY <= vBtnY2 + 8;
            hoveringVialButton = (overEmpty && vialContents.length > 0) || (overShip && canShip);
        }
        const vialEmberR = getVialEmberR(canvas, vialCapacity);
        const vialBottom = vvy + vvh - vialEmberR - 6;
        hoveringVialEmber = vialContents.some((_, i) => {
            const ey = vialBottom - i * (vialEmberR * 2 + 4);
            return distance(mouseX, mouseY, vvcx, ey) < vialEmberR + 6;
        });
    }

    const cx = canvas.width / 2;
    const navY = canvas.height * 0.70;
    const cy = canvas.height / 2;
    const showingCardPopup = showGermIntroPopup || showGlovesPopup || showPhase2Win || isShowingIntro() || isShowingGoalCards();
    const hoveringArrow = showingCardPopup &&
        (Math.abs(mouseX - (cx + 280)) < 50 && Math.abs(mouseY - navY) < 30 ||
         Math.abs(mouseX - (cx - 200)) < 50 && Math.abs(mouseY - navY) < 30) ||
        isShowingMatingSuccess() &&
        (Math.abs(mouseX - (cx + 200)) < 50 && Math.abs(mouseY - (cy + 20)) < 30);

    if (phase2Started && (squishMode || e.shiftKey)) {
        canvas.style.cursor = glovesActive ? CURSOR_POINT_GLOVE : CURSOR_POINT;
    } else if (draggedEmber) {
        canvas.style.cursor = glovesActive ? CURSOR_PINCH_GLOVE : CURSOR_PINCH;
    } else if (hoveringButton || hoveringArrow || hoveringSkip || hoveringVialButton || hoveringOrdersPanel || hoveringShopUI) {
        canvas.style.cursor = glovesActive ? CURSOR_POINT_GLOVE : CURSOR_POINT;
    } else if (hoveringEmber || hoveringVialEmber) {
        canvas.style.cursor = glovesActive ? CURSOR_REACH_GLOVE : CURSOR_REACH;
    } else {
        canvas.style.cursor = glovesActive ? CURSOR_OPEN_GLOVE : CURSOR_OPEN;
    }

    if (squishedEmber) {
        if (distance(squishedEmber.x, squishedEmber.y, mouseX, mouseY) > squishedEmber.radius + 5) {
            squishedEmber.squishHeld = false;
            squishedEmber = null;
        }
    }

});

canvas.addEventListener('mousedown', (e) => {
    const btnX = canvas.width - 370;
    const btnY = 10;
    const overButton = phase2Started && (
        (e.clientX >= btnX && e.clientX <= btnX + 130 && e.clientY >= btnY && e.clientY <= btnY + 50) ||
        (glovesUnlocked && e.clientX >= btnX && e.clientX <= btnX + 160 && e.clientY >= btnY + 58 && e.clientY <= btnY + 88)
    );
    if (squishMode || e.shiftKey || overButton) {
        canvas.style.cursor = glovesActive ? CURSOR_POINT_PRESS_GLOVE : CURSOR_POINT_PRESS;
    }
    if (phase2Started && (squishMode || e.shiftKey)) {
        const germIndex = germs.findIndex(germ =>
            distance(germ.x, germ.y, e.clientX, e.clientY) < germ.radius
        );
    if (germIndex !== -1) {
        if (germs[germIndex].tutorialGerm && tutorialGermsActive) {
            tutorialGermsKilled++;
        }
        germs.splice(germIndex, 1);
        return;
    }
        squishedEmber = embers.find(ember => {
            return distance(ember.x, ember.y, e.clientX, e.clientY) < ember.radius + 5;
        });
        if (squishedEmber && squishedEmber.squishTimer === 0) {
            squishedEmber.squishTimer = 1.0;
            squishedEmber.squishHeld = true;
        }
        return;
    }
    draggedEmber = embers.find(ember =>
        distance(ember.x, ember.y, e.clientX, e.clientY) < ember.radius + EMBER_HIT_PADDING
    );
    if (draggedEmber) {
        selectedEmber = draggedEmber;
    }
});


document.addEventListener('keydown', (e) => {
    if (e.key === 'Shift' && phase2Started) {
        canvas.style.cursor = glovesActive ? CURSOR_POINT_GLOVE : CURSOR_POINT;
    }
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'Shift' && phase2Started) {
        canvas.style.cursor = squishMode
            ? (glovesActive ? CURSOR_POINT_GLOVE : CURSOR_POINT)
            : (glovesActive ? CURSOR_OPEN_GLOVE  : CURSOR_OPEN);
    }
});

canvas.addEventListener('mouseup', (e) => {
    const vx = getVialX(canvas);
    const vy = getVialY(canvas);
    const overVial = e.clientX >= vx && e.clientX <= vx + VIAL_WIDTH &&
                     e.clientY >= vy && e.clientY <= vy + getVialHeight(canvas);

    if (draggedEmber && overVial && vialContents.length < vialCapacity && currentGameState === GAME_STATE.PLAYING) {
        vialContents.push(draggedEmber);
        embers = embers.filter(e => e !== draggedEmber);
        selectedEmber = null;
    }

    draggedEmber = null;
    if (squishedEmber) {
        squishedEmber.squishHeld = false;
        squishedEmber = null;
    }
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const navY = canvas.height * 0.70;
    const btnX = canvas.width - 370;
    const btnY = 10;
    const overButton = phase2Started && (
        (mouseX >= btnX && mouseX <= btnX + 130 && mouseY >= btnY && mouseY <= btnY + 50) ||
        (glovesUnlocked && mouseX >= btnX && mouseX <= btnX + 160 && mouseY >= btnY + 58 && mouseY <= btnY + 88)
    );
    const overArrow =
        (showGermIntroPopup || showGlovesPopup || showPhase2Win || isShowingIntro() || isShowingGoalCards()) &&
        (Math.abs(mouseX - (cx + 280)) < 50 && Math.abs(mouseY - navY) < 30 ||
         Math.abs(mouseX - (cx - 200)) < 50 && Math.abs(mouseY - navY) < 30) ||
        isShowingMatingSuccess() && (Math.abs(mouseX - (cx + 200)) < 50 && Math.abs(mouseY - (cy + 20)) < 30);
    if (squishMode || e.shiftKey) {
        canvas.style.cursor = glovesActive ? CURSOR_POINT_GLOVE : CURSOR_POINT;
    } else if (overButton || overArrow) {
        canvas.style.cursor = glovesActive ? CURSOR_POINT_GLOVE : CURSOR_POINT;
    } else {
        const hoveringEmber = embers.find(ember =>
            distance(ember.x, ember.y, mouseX, mouseY) < ember.radius + EMBER_HIT_PADDING
        );
        canvas.style.cursor = hoveringEmber
            ? (glovesActive ? CURSOR_REACH_GLOVE : CURSOR_REACH)
            : (glovesActive ? CURSOR_OPEN_GLOVE : CURSOR_OPEN);
    }
});


canvas.addEventListener('click', (e) => {
    if (showShop) {
        const scx   = canvas.width / 2;
        const scy   = canvas.height / 2;
        const spx   = scx - 190;
        const spy   = scy - 200;
        const itemH = 70;
        SHOP_ITEMS.forEach((item, i) => {
            const iy        = spy + 66 + i * itemH;
            const isOwned   = item.id === 'microscope' && microscopeUnlocked;
            const canAfford = researchPoints >= item.cost;
            if (!isOwned && canAfford &&
                e.clientX >= spx + 380 - 76 && e.clientX <= spx + 380 - 16 &&
                e.clientY >= iy + 42 && e.clientY <= iy + 62) {
                researchPoints -= item.cost;
                if (item.id === 'antibiotic_spray') {
                    antibioticSprays++;
                } else if (item.id === 'gloves_refill') {
                    glovesRemaining += 3;
                } else if (item.id === 'hormonal_drops') {
                    hormoneDrops++;
                } else if (item.id === 'microscope') {
                    microscopeUnlocked = true;
                }
            }
        });
        const closeY = spy + 66 + SHOP_ITEMS.length * itemH + 12;
        if (e.clientX >= scx - 44 && e.clientX <= scx + 44 &&
            e.clientY >= closeY && e.clientY <= closeY + 24) {
            showShop = false;
        }
        return;
    }

    if (currentGameState === GAME_STATE.TUTORIAL &&
        e.clientX >= 20 && e.clientX <= 150 && e.clientY >= 74 && e.clientY <= 98) {
        skipTutorial();
        return;
    }

    if (currentGameState === GAME_STATE.PLAYING) {
        const vx   = getVialX(canvas);
        const vy   = getVialY(canvas);
        const vcx  = vx + VIAL_WIDTH / 2;
        const btnW = 110;
        const btnX1 = vcx - btnW / 2;
        const vh    = getVialHeight(canvas);
        const btnY1 = vy + vh + 22;
        const btnY2 = vy + vh + 52;

        if (showEmptyConfirm) {
            const yesX = vcx - 55;
            const noX  = vcx + 14;
            if (e.clientX >= yesX && e.clientX <= yesX + 48 && e.clientY >= btnY1 + 2 && e.clientY <= btnY1 + 22) {
                vialContents = [];
                showEmptyConfirm = false;
                return;
            }
            if (e.clientX >= noX && e.clientX <= noX + 48 && e.clientY >= btnY1 + 2 && e.clientY <= btnY1 + 22) {
                showEmptyConfirm = false;
                return;
            }
            showEmptyConfirm = false;
            return;
        }

        if (e.clientX >= btnX1 && e.clientX <= btnX1 + btnW && e.clientY >= btnY1 - 16 && e.clientY <= btnY1 + 8) {
            if (vialContents.length > 0) { showEmptyConfirm = true; }
            return;
        }
        if (e.clientX >= btnX1 && e.clientX <= btnX1 + btnW && e.clientY >= btnY2 - 16 && e.clientY <= btnY2 + 8) {
            const activeOrder = orders[activeOrderIndex] ?? null;
            if (activeOrder) {
                const totalNeeded = activeOrder.criteria.reduce((sum, line) => sum + line.count, 0);
                if (vialContents.length === totalNeeded && checkFulfilled(activeOrder, vialContents)) {
                    researchPoints += activeOrder.reward;
                    orders.splice(activeOrderIndex, 1);
                    activeOrderIndex = Math.max(0, activeOrderIndex - 1);
                    vialContents = [];
                }
            }
            return;
        }

        // Click ember inside vial to select it
        const vialEmberR = getVialEmberR(canvas, vialCapacity);
        const vialBottom = vy + vh - vialEmberR - 6;
        for (let i = 0; i < vialContents.length; i++) {
            const ex = vx + VIAL_WIDTH / 2;
            const ey = vialBottom - i * (vialEmberR * 2 + 4);
            if (distance(e.clientX, e.clientY, ex, ey) < vialEmberR + 6) {
                selectedEmber = vialContents[i];
                return;
            }
        }
    }

    const btnX = canvas.width - 370;
    const btnY = 10;
    if (phase2Started && e.offsetX >= btnX && e.offsetX <= btnX + 130 &&
        e.offsetY >= btnY && e.offsetY <= btnY + 50) {
            squishMode = e.offsetY < btnY + 30 ? false : true;
            return;
        }
    if (phase2Started &&
        e.clientX >= btnX - 120 && e.clientX <= btnX - 10 &&
        e.clientY >= btnY + 34  && e.clientY <= btnY + 58) {
        showShop = true;
        return;
    }
    if (glovesUnlocked && !glovesActive && glovesRemaining > 0 &&
        e.offsetX >= btnX && e.offsetX <= btnX + 160 &&
        e.offsetY >= btnY + 58 && e.offsetY <= btnY + 88) {
            glovesActive = true;
            glovesTimer = 60;
            glovesRemaining--;
            return;
        }
    if (glovesUnlocked && antibioticSprays > 0 &&
        e.offsetX >= btnX && e.offsetX <= btnX + 130 &&
        e.offsetY >= btnY + 96 && e.offsetY <= btnY + 126) {
        germs = [];
        antibioticSprays--;
        return;
    }
    if (glovesUnlocked && !hormoneActive && hormoneDrops > 0 &&
        e.offsetX >= btnX && e.offsetX <= btnX + 130 &&
        e.offsetY >= btnY + 134 && e.offsetY <= btnY + 164) {
        hormoneActive = true;
        hormoneTimer  = 120;
        hormoneDrops--;
        return;
    }
    if (isShowingIntro() || isShowingMatingSuccess() || isShowingGoalCards()) { 
        handleTutorialClick(e, ctx); 
        return; 
    }

    if (showGlovesPopup) {
        const cx = canvas.width / 2;
        const navY = canvas.height * 0.70;
        const clickedForward = glovesPopupCard === 0 && Math.abs(e.clientX - (cx + 280)) < 50 && Math.abs(e.clientY - navY) < 30;
        const clickedBack = glovesPopupCard === 1 && Math.abs(e.clientX - (cx - 200)) < 50 && Math.abs(e.clientY - navY) < 30;
        if (clickedForward) {
            glovesPopupCard = 1;
        } else if (clickedBack) {
            glovesPopupCard = 0;
        } else if (glovesPopupCard === 1) {
            showGlovesPopup = false;
            glovesPopupCard = 0;
        }
        return;
    }
    if (showGermIntroPopup) {
        const cx = canvas.width / 2;
        const navY = canvas.height * 0.70;
        const clickedForward = germIntroCard === 0 && Math.abs(e.clientX - (cx + 280)) < 50 && Math.abs(e.clientY - navY) < 30;
        const clickedBack = germIntroCard === 1 && Math.abs(e.clientX - (cx - 200)) < 50 && Math.abs(e.clientY - navY) < 30;
        if (clickedForward) {
            germIntroCard = 1;
        } else if (clickedBack) {
            germIntroCard = 0;
        } else if (germIntroCard === 1) {
            showGermIntroPopup = false;
            germIntroCard = 0;
            tutorialGermsActive = true;
            germs.push(new Germ(Math.random() * canvas.width * 0.6 + canvas.width * 0.2, Math.random() * canvas.height * 0.6 + canvas.height * 0.2));
            germs.push(new Germ(Math.random() * canvas.width * 0.6 + canvas.width * 0.2, Math.random() * canvas.height * 0.6 + canvas.height * 0.2));
            germs[germs.length - 2].tutorialGerm = true;
            germs[germs.length - 1].tutorialGerm = true;
        }
        return;
    }
    if (showExtinctPopup) {
        if (currentGameState === GAME_STATE.PLAYING) {
            showExtinctPopup = false;
            extinctColor = '';
        } else {
            restartPhase2();
        }
        return;
    }
    if (showPhase2Win) {
        const cx = canvas.width / 2;
        const navY = canvas.height * 0.70;
        const clickedForward = phase2WinCard === 0 && Math.abs(e.clientX - (cx + 280)) < 50 && Math.abs(e.clientY - navY) < 30;
        const clickedBack = phase2WinCard === 1 && Math.abs(e.clientX - (cx - 200)) < 50 && Math.abs(e.clientY - navY) < 30;
        if (clickedForward) {
            phase2WinCard = 1;
        } else if (clickedBack) {
            phase2WinCard = 0;
        } else if (phase2WinCard === 1) {
            showPhase2Win = false;
            phase2WinCard = 0;
            phase2WinSeen = true;
            currentGameState = GAME_STATE.PLAYING;
            triggerVirusOutbreak();
        }
        return;
    }

    // Orders panel — order tabs + request button
    if (phase2Started) {
        const px   = canvas.width - 230;
        const py   = 248;
        const tabY = py + 28;
        const tabH = Math.round(26 * getUIScale(canvas));
        const tabW = 68;
        orders.forEach((order, i) => {
            const tx = px + 6 + i * (tabW + 3);
            if (e.clientX >= tx && e.clientX <= tx + tabW && e.clientY >= tabY && e.clientY <= tabY + tabH) {
                activeOrderIndex = i;
                order.seen = true;
            }
        });
        const reqTx = px + 6 + orders.length * (tabW + 3);
        const reqW  = 50;
        if (orders.length < 3 && !orderPending &&
            e.clientX >= reqTx && e.clientX <= reqTx + reqW &&
            e.clientY >= tabY  && e.clientY <= tabY + tabH) {
            orderPending    = true;
            requestCooldown = 30;
        }
    }

    if (e.clientX < canvas.width - 370) { handleGermSpawn(e); }
    const clickedEmber = embers.find(ember =>
        distance(ember.x, ember.y, e.offsetX, e.offsetY) < ember.radius + EMBER_HIT_PADDING
    );
    if (clickedEmber){
         selectedEmber = clickedEmber;    
    } else {
        selectedEmber = null;
    }

});

let lastTime = 0;

//=== Game loop ===
function gameLoop(timestamp){
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;
    canShip = false;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showGermIntroPopup) {
        embers.forEach(ember => ember.draw(ctx, ember === selectedEmber));
        drawGermIntroPopup(ctx, canvas, germIntroCard);
    } else if (showGlovesPopup) {
        embers.forEach(ember => ember.draw(ctx, ember === selectedEmber));
        drawGlovesPopup(ctx, canvas, glovesPopupCard);
    } else if (showExtinctPopup) {
        embers.forEach(ember => ember.draw(ctx, ember === selectedEmber));
        drawExtinctPopup(ctx, canvas, currentGameState, extinctColor);
    } else if (showPhase2Win) {
        embers.forEach(ember => ember.draw(ctx, ember === selectedEmber));
        drawPhase2Win(ctx, canvas, phase2WinCard);
    } else if (showShop) {
        embers.forEach(ember => ember.draw(ctx, ember === selectedEmber));
        drawShopPopup(ctx, canvas, researchPoints, microscopeUnlocked);
    } else {
        embers = embers.filter(ember => ember.immortal || (ember.age < ember.lifespan && !(ember.squishTimer > 0 && ember.squishTimer <= 0.05)));
        if (selectedEmber && !embers.includes(selectedEmber) && !vialContents.includes(selectedEmber)) {
            selectedEmber = null;
        }
        embers.forEach(ember => {
            if (ember.matingWith !== null && !embers.includes(ember.matingWith)) {
                ember.matingWith = null;
            }
        });

        updateTutorial(embers, dt);

        if (!phase2Started && getStep() === TUTORIAL_STEP.GROW && !isShowingGoalCards() && !isShowingMatingSuccess()) {
            phase2Started = true;
            embers.forEach(ember => {
                ember.immortal = false;
                ember.age = 10;
            });
        }

        if (isShowingIntro() || isShowingMatingSuccess() || isShowingGoalCards()) {
            embers.forEach(ember => ember.draw(ctx));
            drawTutorial(ctx);
        } else {
            if (embers.length === 0) {
                ctx.fillStyle = 'red';
                ctx.font = 'bold 72px serif';
                ctx.textAlign = 'center';
                ctx.fillText('EXTINCT', canvas.width / 2, canvas.height / 2);
                return;
            }


    if (embers.length > 50){
        embers.length = 50;
    }

//--- Mating detection --- 
    for (let i = 0; i < embers.length; i++) {
    for (let j = i + 1; j < embers.length; j++) {
        const a = embers[i];
        const b = embers[j];

    if (a.squishTimer > 0 || b.squishTimer > 0){
        continue;
    }

    if (getStep() === TUTORIAL_STEP.FIND_AND_MATE && !(a.tutorialId && b.tutorialId)) {
        continue;
    }

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = distance(a.x, a.y, b.x, b.y);

        if (
            dist < 50 &&
            a.gender !== b.gender &&
            a.age > 10 && b.age > 10 &&
            a.matingCooldown <= 0 && b.matingCooldown <= 0 &&
             a.matingWith === null && b.matingWith === null
        ) {

            a.matingWith  = b;
            b.matingWith = a;
            
            const targetDist = a.radius + b.radius;
            b.x = a.x - dx / dist * targetDist;
            b.y = a.y - dy / dist * targetDist;

            if (draggedEmber === a || draggedEmber === b) {
                draggedEmber = null;
            }
        }
    }
    }

//--- After mating: Spawn offspring + separate embers ---
    embers.forEach(ember => {
    if (ember.gender === 'male' && ember.matingTimer >= 10) {
        const roll = Math.random();
        let count;
        if (roll < 0.05) {
            count = 0;
        } else if (roll < 0.65) {
            count = 1;
        } else if (roll < 0.95) {
            count = 2;
        } else {
            count = 3;
        }

        for (let i = 0; i < count; i++) {
            const offspring = new Ember(
                (ember.x + ember.matingWith.x) / 2,
                (ember.y + ember.matingWith.y) / 2,
                ember,
                ember.matingWith
            );
            embers.push(offspring);
            lifetimeEmberCount++;


        }
        const female = ember.matingWith;
        female.matingWith = null;
        female.matingCooldown = female.radius * 0.85 * (hormoneActive ? 0.25 : 1);
        ember.matingWith = null;
        ember.matingTimer = 0;
        ember.matingCooldown = ember.radius * 0.15;
    }
});

germs = germs.filter(germ => germ.age < germ.lifespan);
germs.forEach(germ => {
    germ.update(canvas.width, canvas.height, dt);
    germ.draw(ctx);
});
applyGermDamage(dt);

if (glovesActive) {
    glovesTimer -= dt;
    if (glovesTimer <= 0) {
        glovesActive = false;
        glovesTimer = 0;
    }
}
if (hormoneActive) {
    hormoneTimer -= dt;
    if (hormoneTimer <= 0) {
        hormoneActive = false;
        hormoneTimer  = 0;
    }
}


//--- Tutorial germ, glove timer ---
if (tutorialGermsActive && tutorialGermsKilled >= 2) {
    tutorialGermsActive = false;
    glovePopupTimer = 10;
}
if (glovePopupTimer > 0) {
    glovePopupTimer -= dt;
    if (glovePopupTimer <= 0) {
        glovePopupTimer = 0;
        glovesUnlocked = true;
        showGlovesPopup = true;
    }
}

//--- Recurring virus outbreaks ---
if (currentGameState === GAME_STATE.PLAYING) {
    virusOutbreakTimer += dt;
    if (virusOutbreakTimer >= virusOutbreakInterval) {
        triggerVirusOutbreak();
        virusOutbreakTimer = 0;
        virusOutbreakInterval = 180 + Math.random() * 120;
    }
}

//--- Virus update (kill, spread) ---
viruses = viruses.filter(v => embers.includes(v.host));
const toKill = [];
viruses.forEach(virus => {
    if (virus.update(dt)) {
        toKill.push(virus.host);
    }
    embers.forEach(ember => {
        if (ember === virus.host) { return; }
        if (viruses.some(v => v.host === ember)) { return; }
        if (!ember.colorAlleles.some(a => a.value === virus.targetAllele)) { return; }
        if (distance(ember.x, ember.y, virus.host.x, virus.host.y) < 50) {
            viruses.push(new Virus(ember, virus.targetAllele));
        }
    });
});
toKill.forEach(ember => { ember.age = ember.lifespan + 1; });

//--- Update and draw all embers ---
    embers.forEach(ember => {
        if (ember !== draggedEmber){
            ember.update(canvas.width, canvas.height, dt);
        }
        ember.draw(ctx, ember === selectedEmber);
    })

//--- Draw viruses on top ---
viruses.forEach(virus => virus.draw(ctx));

//--- Microscope overlay ---
if (microscopeUnlocked) { drawMicroscopeOverlay(ctx, embers); }

//--- Population state ---
    const alleleCounts = {};
    let flickerTotal = 0;
    let sizeTotal = 0;
    let maleCount = 0;
    embers.forEach(ember => {
        const c0 = ember.colorAlleles[0].value;
        const c1 = ember.colorAlleles[1].value;
        alleleCounts[c0] = (alleleCounts[c0] || 0) + 1;
        alleleCounts[c1] = (alleleCounts[c1] || 0) + 1;
        flickerTotal += (ember.flickerAlleles[0].strength + ember.flickerAlleles[1].strength) / 2;
        sizeTotal += ember.radius;
        if (ember.gender === 'male') { maleCount++; }
    });
    const avgFlicker = flickerTotal / embers.length;
    const avgSize = sizeTotal / embers.length;
    const femaleCount = embers.length - maleCount;
    const isFixed = Object.keys(alleleCounts).length === 1;

    if (phase2Started && !showExtinctPopup && !showPhase2Win && currentGameState === GAME_STATE.TUTORIAL) {
        const extinct = Object.keys(BASE_COLORS).find(color => !alleleCounts[color]);
        if (extinct) {
            showExtinctPopup = true;
            extinctColor = extinct;
        } else if (embers.length >= 50) {
            showPhase2Win = true;
        }
    }
    

    if (isFixed && embers.length >= 10){
        ctx.fillStyle = 'orange';
        ctx.font = 'bold 72px serif';
        ctx.textAlign = 'center';
        ctx.fillText('FIXATION', canvas.width / 2, canvas.height / 2);
        return;
    }

    //--- Orders update ---
            orders = updateOrders(orders, dt);
            if (activeOrderIndex >= orders.length) {
                activeOrderIndex = Math.max(0, orders.length - 1);
            }
            if (requestCooldown > 0) {
                requestCooldown -= dt;
                if (requestCooldown <= 0 && orderPending) {
                    orders.push(generateOrder());
                    activeOrderIndex = orders.length - 1;
                    orderPending     = false;
                    requestCooldown  = 0;
                }
            }

    //--- drawing UI ----
            const activeOrder = orders[activeOrderIndex] ?? null;
            const totalNeeded = activeOrder ? activeOrder.criteria.reduce((sum, line) => sum + line.count, 0) : 0;
            canShip = activeOrder !== null && vialContents.length === totalNeeded && checkFulfilled(activeOrder, vialContents);
            drawEmberInfoPanel(ctx, canvas, selectedEmber, draggedEmber, false);
            drawPopulationPanel(ctx, canvas, embers, alleleCounts, avgFlicker, avgSize, maleCount, femaleCount);
            drawModeButtons(ctx, canvas, phase2Started, squishMode, glovesUnlocked, glovesActive, glovesRemaining, glovesTimer, researchPoints, antibioticSprays, hormoneDrops, hormoneActive, hormoneTimer);
            if (phase2Started) { drawShopButton(ctx, canvas); }
            if (phase2Started) { drawOrdersPanel(ctx, canvas, orders, activeOrderIndex, requestCooldown, orderPending, researchPoints); }
        }
    }

    if (currentGameState === GAME_STATE.PLAYING) {
        drawVialContents(ctx, canvas, vialContents, vialCapacity);
        drawVial(ctx, canvas);
        drawVialUI(ctx, canvas, vialContents, vialCapacity, showEmptyConfirm, canShip);
    }
    drawLabel(ctx);
    if (currentGameState === GAME_STATE.TUTORIAL) {
        drawSkipButton(ctx, canvas);
    }
    requestAnimationFrame(gameLoop);
}


//=== Functions ===



function triggerVirusOutbreak() {
    const presentAlleles = [];
    embers.forEach(ember => {
        ember.colorAlleles.forEach(a => {
            if (!presentAlleles.includes(a.value)) {
                presentAlleles.push(a.value);
            }
        });
    });
    if (presentAlleles.length === 0) {
        return;
    }
    const targetAllele = presentAlleles[Math.floor(Math.random() * presentAlleles.length)];
    const carriers = embers.filter(ember =>
        ember.colorAlleles.some(a => a.value === targetAllele) &&
        !viruses.some(v => v.host === ember)
    );
    if (carriers.length === 0) {
        return;
    }
    const host = carriers[Math.floor(Math.random() * carriers.length)];
    viruses.push(new Virus(host, targetAllele));
}


function skipTutorial() {
    completeTutorial();
    embers.forEach(ember => {
        ember.immortal = false;
        ember.age = 10;
    });
    germs = [];
    viruses = [];
    phase2Started = true;
    germIntroSeen = true;
    glovesUnlocked = true;
    showGermIntroPopup = false;
    showGlovesPopup = false;
    showPhase2Win = false;
    showExtinctPopup = false;
    extinctColor = '';
    selectedEmber = null;
    currentGameState = GAME_STATE.PLAYING;
}

function restartPhase2() {
    resetToPhase2();
    embers = spawnTutorialEmbers(canvas.width, canvas.height);
    embers.forEach(ember => {
        ember.immortal = false;
        ember.age = 10;
    });
    germs = [];
    viruses = [];
    phase2Started = true;
    showExtinctPopup = false;
    extinctColor = '';
    selectedEmber = null;
}

function handleGermSpawn(e){
    if (phase2Started) {
        petriClickCount++;
        if (petriClickCount >= 10 && !germIntroSeen) {
            germIntroSeen = true;
            showGermIntroPopup = true;
        }
    }
    if (glovesActive) {
        return;
    }
    if (lifetimeEmberCount >= 15) {
    clicksSinceLastGerm++;
    if (clicksSinceLastGerm >= germSpawnThreshold) {
        const count = Math.floor(Math.random() * 10) + 5;
        for (let i = 0; i < count; i++) {
            germs.push(new Germ(e.offsetX, e.offsetY));
        }
        clicksSinceLastGerm = 0;
        germSpawnThreshold = Math.floor(Math.random() * 26) + 15;
        }
    }
}

function applyGermDamage(dt){
    germs.forEach(germ => {
        if (germ.tutorialGerm) {
            return;
        }
        embers.forEach(ember => {
            if (distance(ember.x, ember.y, germ.x, germ.y) < germ.radius + ember.radius) {
                ember.lifespan -= 15 * dt;
                ember.damageTint = 50;
            }
        });
    });

}

