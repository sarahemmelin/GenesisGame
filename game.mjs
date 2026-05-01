import Ember from "./ember.mjs";
import Germ from "./germ.mjs";
import Virus from "./virus.mjs";
import { CURSOR_OPEN, CURSOR_OPEN_GLOVE, CURSOR_REACH, CURSOR_REACH_GLOVE, CURSOR_PINCH, CURSOR_PINCH_GLOVE, CURSOR_POINT, CURSOR_POINT_GLOVE, CURSOR_POINT_PRESS, CURSOR_POINT_PRESS_GLOVE } from "./cursors.mjs";
import { BASE_COLORS, GAME_STATE, TUTORIAL_STEP } from "./constants.mjs";
import { spawnTutorialEmbers, isShowingIntro, isShowingMatingSuccess, isShowingGoalCards, isTutorialActive, getStep, draw as drawTutorial, handleClick as handleTutorialClick, update as updateTutorial, resetToPhase2 } from "./tutorial.mjs";
import { distance } from "./utilities.mjs";
import { drawLabel, drawPopulationPanel, drawModeButtons, drawEmberInfoPanel, drawExtinctPopup, drawPopupOverlay, drawGermIntroPopup, drawGlovesPopup, drawPhase2Win, drawBonusCard, drawEpistasisPopup } from "./ui.mjs";


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
let epistasisSeen = false;
let epistasisEmberFound = false;
let showEpistasisPopup = false;
let epistasisCard = 0;
let showBonusCard = false;
let bonusCardShownAt = 0;
let squishMode = false; 
let clicksSinceLastGerm = 0;


//=== Popups ===
//--- Epistasis cards ---
let epistasisCards = [
    "Something just happened. An unusual ember was born. Can you find it?",
    "Even though the color alleles inherited from its parents did not change, a separate gene, 'the flicker gene', switched one color channel off at birth.",
    "This is called epistasis. One gene can silence another. The color is still in the DNA, just not showing. This is why appearance alone can't tell you what genes a creature carries."
];


//=== Event listeners ===
canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (draggedEmber) {
        draggedEmber.x = mouseX;
        draggedEmber.y = mouseY;
    }

    const hoveringEmber = !draggedEmber && embers.find(ember =>
        distance(ember.x, ember.y, mouseX, mouseY) < ember.radius + 24
    );

    const btnX = canvas.width - 370;
    const btnY = 10;
    const hoveringButton = phase2Started && (
        (mouseX >= btnX && mouseX <= btnX + 130 && mouseY >= btnY && mouseY <= btnY + 50) ||
        (glovesUnlocked && mouseX >= btnX && mouseX <= btnX + 160 && mouseY >= btnY + 58 && mouseY <= btnY + 88)
    );

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
    } else if (hoveringButton || hoveringArrow) {
        canvas.style.cursor = glovesActive ? CURSOR_POINT_GLOVE : CURSOR_POINT;
    } else if (hoveringEmber) {
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
    if (showEpistasisPopup) {
        const de = selectedEmber;
        if (de && distance(e.clientX, e.clientY, de.x, de.y) < de.radius + 5) {
            draggedEmber = de;
        }
        return;
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
        distance(ember.x, ember.y, e.clientX, e.clientY) < ember.radius + 24
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
            distance(ember.x, ember.y, mouseX, mouseY) < ember.radius + 24
        );
        canvas.style.cursor = hoveringEmber
            ? (glovesActive ? CURSOR_REACH_GLOVE : CURSOR_REACH)
            : (glovesActive ? CURSOR_OPEN_GLOVE : CURSOR_OPEN);
    }
});


canvas.addEventListener('click', (e) => {
    const btnX = canvas.width - 370;
    const btnY = 10;
    if (phase2Started && e.offsetX >= btnX && e.offsetX <= btnX + 130 &&
        e.offsetY >= btnY && e.offsetY <= btnY + 50) {
            squishMode = e.offsetY < btnY + 30 ? false : true;
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
    if (isShowingIntro() || isShowingMatingSuccess() || isShowingGoalCards()) { 
        handleTutorialClick(e, ctx); 
        return; 
    }

    if (showEpistasisPopup) {
        handleEpistasisClick(e);
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

    handleGermSpawn(e);
    const clickedEmber = embers.find(ember =>
        distance(ember.x, ember.y, e.offsetX, e.offsetY) < ember.radius + 24
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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showEpistasisPopup) {
        embers.forEach(ember => ember.draw(ctx, ember === selectedEmber));
        drawEpistasisPopup(ctx, canvas, epistasisCard, epistasisCards, epistasisEmberFound, showBonusCard, selectedEmber, draggedEmber, bonusCardShownAt);
    } else if (showGermIntroPopup) {
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
    } else {
        embers = embers.filter(ember => ember.immortal || (ember.age < ember.lifespan && !(ember.squishTimer > 0 && ember.squishTimer <= 0.05)));
        if (selectedEmber && !embers.includes(selectedEmber)) {
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

            if (offspring.flickeredChannel !== null && !epistasisSeen && currentGameState === GAME_STATE.PLAYING) {
                epistasisSeen = true;
                showEpistasisPopup = true;
                selectedEmber = offspring;
            }

        }
        const female = ember.matingWith;
        female.matingWith = null;
        female.matingCooldown = female.radius * 0.85;
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

//--- Population state ---
    const collectAlleleColors = [];
    embers.forEach(ember => {
       collectAlleleColors.push(ember.colorAlleles[0].value);
       collectAlleleColors.push(ember.colorAlleles[1].value);
    })

    const alleleCounts = {};
        collectAlleleColors.forEach(color => {
        alleleCounts[color] = (alleleCounts[color] || 0) + 1;
    });

    let flickerTotal = 0;
    embers.forEach(ember => {
        flickerTotal += (ember.flickerAlleles[0].strength + ember.flickerAlleles[1].strength) / 2;
    });
    const avgFlicker = flickerTotal / embers.length;

    let sizeTotal = 0;
    embers.forEach(ember => {
        sizeTotal += ember.radius;
    });
    const avgSize = sizeTotal / embers.length;
    const maleCount = embers.filter(e => e.gender === 'male').length;
    const femaleCount = embers.length - maleCount;
    const firstColor = collectAlleleColors[0];
    const isFixed = collectAlleleColors.every(value => value === firstColor);

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

    //--- drawing UI ----
            drawEmberInfoPanel(ctx, canvas, selectedEmber, draggedEmber, showEpistasisPopup);
            drawPopulationPanel(ctx, canvas, embers, alleleCounts, avgFlicker, avgSize, maleCount, femaleCount);
            drawModeButtons(ctx, canvas, phase2Started, squishMode, glovesUnlocked, glovesActive, glovesRemaining, glovesTimer);
        }
    }

    drawLabel(ctx, canvas, playerInitials, playerMedium, playerSource);
    requestAnimationFrame(gameLoop);
}


//=== Functions ===

function handleEpistasisClick(e) {
    if (showBonusCard) {
        const closeX = canvas.width / 2;
        const closeY = canvas.height / 2 + 100;
        if (Math.abs(e.clientX - closeX) < 60 && Math.abs(e.clientY - closeY) < 20) {
            showBonusCard = false;
            epistasisCard = 1; 
        }
        return;
    }
    const de = selectedEmber;
    const onEmber = de && distance(e.clientX, e.clientY, de.x, de.y) < de.radius + 5;
    if (onEmber) { 
    epistasisEmberFound = true;
    showBonusCard = true;
    bonusCardShownAt = Date.now();
    return;
    }
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const clickedBack = epistasisCard > 0 && Math.abs(e.clientX - (cx - 200)) < 50 && Math.abs(e.clientY - (cy + 80)) < 30;
    const clickedForward = epistasisCard < epistasisCards.length - 1 && Math.abs(e.clientX - (cx + 200)) < 50 && Math.abs(e.clientY - (cy + 80)) < 30;
    if (clickedBack){
     epistasisCard--;
     }
    else if (clickedForward  && epistasisEmberFound) {
    epistasisCard++;
    }
    else if (epistasisCard === epistasisCards.length - 1) { showEpistasisPopup = false; epistasisCard = 0; }
}


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

