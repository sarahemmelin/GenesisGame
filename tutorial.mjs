import Ember from "./ember.mjs";
import { TUTORIAL_STEP, BASE_COLORS } from "./constants.mjs";

// --- State ---
let step = TUTORIAL_STEP.FIND_AND_MATE;

// --- Intro ---
let showIntro = true;
let introCard = 0;
const introCardsText = [
    "This is a male Ember. It's a tiny creature living in your petri dish.",
    "Embers are diploid, meaning each carries two color alleles, one inherited from each parent.",
    "Each allele has a strength, how loudly it expresses. Here, blue (0.70) dominates gold (0.30), blending into green. The stronger allele expresses itself louder.",
    "An allele with strength 0.00 is still there, just 'silent'. It can be passed on and grow stronger in future generations.",
    "Click on an Ember to inspect it. Find a male with a blue allele and drag it to a female with a gold allele."
];

// --- Phase 1: Find and mate ---
let showMatingSuccess = false;
let matingSuccessCard = 0;
let matingDetected = false;
let matingTimer = 0;
let phase1Complete = false;
const matingSuccessCards = [
    "Excellent! They're mating.",
];

// --- Phase 2: Grow the population ---
let showGoalCards = false;
let goalCard = 0;
const goalCards = [
    "Now they can age and die. Keep the population alive.",
    "There are four colors in this population. Lose all embers of one color and that allele is gone forever.",
    "New goal: Grow the population to 50 without losing all alleles of any one color.",
    "Be careful how much you touch the petri dish, you might introduce something unwanted."
];
const emberShowcase = [
    { color: 'crimson', gender: 'female', radius: 20 },
    { color: 'gold',    gender: 'male',   radius: 12 },
    { color: 'blue',    gender: 'female', radius: 12 },
    { color: 'violet',  gender: 'male',   radius: 20 },
];
let showcaseIndex = 0;
let showcaseTimer = 0;

export function draw(ctx) {
    if (showMatingSuccess) {
        drawMatingSuccess(ctx);
        return;
    }
    if (showGoalCards) {
        drawGoalCards(ctx);
        return;
    }
    let navY = ctx.canvas.height * 0.70;
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GENESIS: EMBER', ctx.canvas.width / 2, ctx.canvas.height / 2 - 120);

    if (introCard === 0 || introCard === 1 || introCard === 2 || introCard === 3) {
        const ex = ctx.canvas.width / 2 - 150;
        const ey = ctx.canvas.height / 2;
        const er = 20;
        const color = introCard === 3 ? 'rgb(0, 180, 216)' : 'rgb(70, 208, 98)';

        ctx.shadowColor = color;
        ctx.shadowBlur = 35 + Math.sin(Date.now() /  300) * 15;
        ctx.beginPath();
        ctx.arc(ex, ey, er, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.shadowBlur = 0;

    if (introCard === 1 || introCard === 2 || introCard === 3) {
        ctx.font = '13px monospace';
        ctx.textAlign = 'left';
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgb(0, 180, 216)';
        ctx.beginPath();
        ctx.arc(ex + er + 16, ey - 12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        const blueLabel = introCard === 3 ? 'Allele 1: blue (1.00)' : 'Allele 1: blue (0.70)';
        ctx.fillText(blueLabel, ex + er + 26, ey - 8);
        ctx.fillStyle = introCard === 3 ? 'rgb(100, 85, 0)' : 'rgb(255, 215, 0)';
        ctx.beginPath();
        ctx.arc(ex + er + 16, ey + 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        const goldLabel = introCard === 3 ? 'Allele 2: gold (0.00)' : 'Allele 2: gold (0.30)';
        ctx.fillText(goldLabel, ex + er + 26, ey + 12);
    }
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'white';
        ctx.font = '16px sans-serif';
        wrapText(ctx, introCardsText[introCard], ctx.canvas.width / 2 + 80, ctx.canvas.height / 2 - 20, 220, 28);
    } else {
        ctx.font = '16px sans-serif';
        wrapText(ctx, introCardsText[introCard], ctx.canvas.width / 2, ctx.canvas.height / 2, 500, 28);
    }
    ctx.textAlign = 'center';
    ctx.font = '28px sans-serif';
    ctx.shadowColor = 'white';
    ctx.shadowBlur = 10;
    if (introCard > 0) {
        ctx.fillText('◀', ctx.canvas.width / 2 - 200, navY);
    }
    if (introCard < introCardsText.length - 1) {
        ctx.fillText('▶', ctx.canvas.width / 2 + 280, navY);
    } else {
        ctx.shadowBlur = 0;
        ctx.font = '16px sans-serif';
        ctx.fillText('Click anywhere to continue.', ctx.canvas.width / 2, navY - 30);
    }
    ctx.shadowBlur = 0;
    ctx.font = '16px sans-serif';
    ctx.fillText(`${introCard + 1} / ${introCardsText.length}`, ctx.canvas.width / 2, navY );

}

export function isShowingIntro() {
    return showIntro;
}

export function isTutorialActive() {
    return step === TUTORIAL_STEP.FIND_AND_MATE || step === TUTORIAL_STEP.GROW;
}

export function getStep() { return step; }

export function resetToPhase2() {
    step = TUTORIAL_STEP.GROW;
    showIntro = false;
    showMatingSuccess = false;
    showGoalCards = false;
    matingDetected = true;
    phase1Complete = true;
    matingTimer = 0;
    introCard = 0;
    goalCard = 0;
    showcaseIndex = 0;
    showcaseTimer = 0;
}

export function isShowingGoalCards() { return showGoalCards; }

export function isShowingMatingSuccess() {
    return showMatingSuccess;
}

export function spawnTutorialEmbers(canvasWidth, canvasHeight) {
    const embers = [];
    const blueMale = makeEmber('blue', 'male', canvasWidth, canvasHeight);
    blueMale.tutorialId = 'target';
    embers.push(blueMale);
    const goldFemale = makeEmber('gold', 'female', canvasWidth, canvasHeight);
    goldFemale.tutorialId = 'target';
    embers.push(goldFemale);
    embers.push(makeEmber('crimson', 'male', canvasWidth, canvasHeight));
    embers.push(makeEmber('violet', 'female', canvasWidth, canvasHeight));
    embers.push(makeEmber('blue', 'female', canvasWidth, canvasHeight));
    embers.push(makeEmber('crimson', 'male', canvasWidth, canvasHeight));
    return embers;
}


function drawGoalCards(ctx) {
    const cx = ctx.canvas.width / 2;
    const cy = ctx.canvas.height / 2;
    const navY = ctx.canvas.height * 0.70;
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GENESIS: EMBER', cx, cy - 120);

    // Card 2 (index 1): animated ember showcase
    if (goalCard === 1) {
        const ex = cx - 150;
        const ey = cy;
        const e = emberShowcase[showcaseIndex];
        const rgb = BASE_COLORS[e.color];
        const color = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        ctx.shadowColor = color;
        ctx.shadowBlur = 35 + Math.sin(Date.now() / 300) * 15;
        ctx.beginPath();
        if (e.gender === 'female') {
            ctx.roundRect(ex - e.radius, ey - e.radius, e.radius * 2, e.radius * 2, e.radius * 0.35);
        } else {
            ctx.arc(ex, ey, e.radius, 0, Math.PI * 2);
        }
        ctx.fillStyle = color;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    if (goalCard === 1) {
        wrapText(ctx, goalCards[goalCard], cx + 80, cy - 20, 220, 28);
    } else {
        wrapText(ctx, goalCards[goalCard], cx, cy, 500, 28);
    }

    ctx.textAlign = 'center';
    ctx.font = '28px sans-serif';
    ctx.shadowColor = 'white';
    ctx.shadowBlur = 10;
    if (goalCard > 0) {
        ctx.fillText('◀', cx - 200, navY);
    }
    if (goalCard < goalCards.length - 1) {
        ctx.fillText('▶', cx + 280, navY);
    } else {
        ctx.shadowBlur = 0;
        ctx.font = '16px sans-serif';
        ctx.fillText('Click anywhere to begin.', cx, navY - 30);
    }
    ctx.shadowBlur = 0;
    ctx.font = '16px sans-serif';
    ctx.fillText(`${goalCard + 1} / ${goalCards.length}`, cx, navY);
}

function drawMatingSuccess(ctx) {
    const cx = ctx.canvas.width / 2;
    const cy = ctx.canvas.height / 2;
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(matingSuccessCards[matingSuccessCard], cx, cy - 20);
    ctx.font = '16px sans-serif';
    if (matingSuccessCard < matingSuccessCards.length - 1) {
        ctx.fillText('▶', cx + 200, cy + 20);
    } else {
        ctx.fillText('Click anywhere to continue.', cx, cy + 20);
    }
}

//help functions
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
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

function makeEmber(color, gender, canvasWidth, canvasHeight) {
    const e = new Ember(Math.random() * canvasWidth, Math.random() * canvasHeight, null, null, {color, gender})
    e.immortal = true;
    return e;
};

export function handleClick(e, ctx) {
    if (showMatingSuccess) {
        const cx = ctx.canvas.width / 2;
        const cy = ctx.canvas.height / 2;
        if (matingSuccessCard < matingSuccessCards.length - 1) {
            const clickedForward = Math.abs(e.clientX - (cx + 200)) < 50 && Math.abs(e.clientY - (cy + 20)) < 30;
            if (clickedForward) matingSuccessCard++;
        } else {
            showMatingSuccess = false;
            matingSuccessCard = 0;
            showGoalCards = true;
        }
        return;
    }
    if (showGoalCards) {
        const cx = ctx.canvas.width / 2;
        const navY = ctx.canvas.height * 0.70;
        const clickedBack = goalCard > 0 && Math.abs(e.clientX - (cx - 200)) < 50 && Math.abs(e.clientY - navY) < 30;
        const clickedForward = goalCard < goalCards.length - 1 && Math.abs(e.clientX - (cx + 280)) < 50 && Math.abs(e.clientY - navY) < 30;
        if (clickedBack) {
            goalCard--;
        } else if (clickedForward) {
            goalCard++;
        } else if (goalCard === goalCards.length - 1) {
            showGoalCards = false;
            goalCard = 0;
        }
        return;
    }
    const cx = ctx.canvas.width / 2;
    const navY = ctx.canvas.height * 0.70;
    const clickedBack = introCard > 0 && Math.abs(e.clientX - (cx - 200)) < 50 && Math.abs(e.clientY - navY) < 30;
    const clickedForward = introCard < introCardsText.length - 1 && Math.abs(e.clientX - (cx + 280)) < 50 && Math.abs(e.clientY - navY) < 30;
    if (clickedBack) {
        introCard--;
    } else if (clickedForward) {
        introCard++;
    } else if (introCard === introCardsText.length - 1) {
        showIntro = false;
        introCard = 0;
    }
}

export function update(embers, dt) {
    const match = embers.find(ember =>
        ember.gender === 'male' &&
        ember.matingWith !== null &&
        ember.colorAlleles.some(a => a.value === 'blue') &&
        ember.matingWith.colorAlleles.some(a => a.value === 'gold')
    );
    if (match && !matingDetected) {
        matingDetected = true;
    }
    if (matingDetected && !showMatingSuccess && !phase1Complete) {
        matingTimer += dt;
        if (matingTimer >= 3) {
            step = TUTORIAL_STEP.GROW;
            showMatingSuccess = true;
            phase1Complete = true;
        }
    }
    if (showGoalCards && goalCard === 1) {
        showcaseTimer += dt;
        if (showcaseTimer >= 1) {
            showcaseIndex = (showcaseIndex + 1) % emberShowcase.length;
            showcaseTimer = 0;
        }
    }
};