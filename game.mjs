import Ember from "./ember.mjs";
import Germ from "./germ.mjs";
import Virus from "./virus.mjs";
import { CURSOR_OPEN, CURSOR_OPEN_GLOVE, CURSOR_REACH, CURSOR_REACH_GLOVE, CURSOR_PINCH, CURSOR_PINCH_GLOVE, CURSOR_POINT, CURSOR_POINT_GLOVE, CURSOR_POINT_PRESS, CURSOR_POINT_PRESS_GLOVE } from "./cursors.mjs";
import { BASE_COLORS, GAME_STATE, TUTORIAL_STEP } from "./constants.mjs";
import { spawnTutorialEmbers, isShowingIntro, isShowingMatingSuccess, isShowingGoalCards, isTutorialActive, getStep, draw as drawTutorial, handleClick as handleTutorialClick, update as updateTutorial, resetToPhase2 } from "./tutorial.mjs";



document.body.style.cursor = CURSOR_OPEN;

//--- Canvas setup ---
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//--- Start screen ---
const startScreen   = document.getElementById('start-screen');
const startButton   = document.getElementById('start-button');
const initialsInput = document.getElementById('initials');
const sourceInput   = document.getElementById('source');

// Pre-fill saved values
initialsInput.value = localStorage.getItem('genesis_initials') ?? '';
const savedMedium = localStorage.getItem('genesis_medium') ?? 'LB Agar';
document.querySelector(`input[name="medium"][value="${savedMedium}"]`).checked = true;

let playerInitials = '';
let playerSource   = '';
let playerMedium   = 'LB Agar';

startButton.addEventListener('click', () => {
    playerInitials = initialsInput.value.trim() || '—';
    playerSource   = sourceInput.value.trim()   || '—';
    playerMedium   = document.querySelector('input[name="medium"]:checked').value;
    localStorage.setItem('genesis_initials', playerInitials);
    localStorage.setItem('genesis_medium',   playerMedium);
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

// --- State ---
let mouseX = 0;
let mouseY = 0;
let selectedEmber = null;
let draggedEmber = null;
let squishedEmber = null;

// --- Embers --- 
// let embers = [];
// for (let i = 0; i < 10; i++){
//     embers.push(new Ember(Math.random() * canvas.width, Math.random() * canvas.height));
// }
let embers = spawnTutorialEmbers(canvas.width, canvas.height);


// --- Germs ---
let germs = [];

// --- Viruses ---
let viruses = [];
let virusOutbreakTimer = 0;
let virusOutbreakInterval = 180 + Math.random() * 120;

// --- flags and references ---
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
let squishMode = false; 
let lifetimeEmberCount = embers.length;
let clicksSinceLastGerm = 0;
let germSpawnThreshold = Math.floor(Math.random() * 26) + 15; 

// === popups ===
// --- epistasiscards --- 
let epistasisCards = [
    "Something just happened. An unusual ember was born. Can you find it?",
    "Even though the color alleles inherited from its parents did not change, a separate gene, 'the flicker gene', switched one color channel off at birth.",
    "This is called epistasis. One gene can silence another. The color is still in the DNA, just not showing. This is why appearance alone can't tell you what genes a creature carries."
];


canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (draggedEmber) {
        draggedEmber.x = mouseX;
        draggedEmber.y = mouseY;
    }
    const hoveringEmber = !draggedEmber && embers.find(ember => {
        const dx = ember.x - mouseX;
        const dy = ember.y - mouseY;
        return Math.sqrt(dx * dx + dy * dy) < ember.radius + 24;
    });
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
    const dx = squishedEmber.x - mouseX;
    const dy = squishedEmber.y - mouseY;
    if (Math.sqrt(dx * dx + dy * dy) > squishedEmber.radius + 5) {
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
        if (de && Math.sqrt((e.clientX - de.x) ** 2 + (e.clientY - de.y) ** 2) < de.radius + 5) {
            draggedEmber = de;
        }
        return;
    }

    if (phase2Started && (squishMode || e.shiftKey)) {
        const germIndex = germs.findIndex(germ => {
        const dx = germ.x - e.clientX;
        const dy = germ.y - e.clientY;
    return Math.sqrt(dx * dx + dy * dy) < germ.radius;
    });
    if (germIndex !== -1) {
        if (germs[germIndex].tutorialGerm && tutorialGermsActive) {
            tutorialGermsKilled++;
        }
        germs.splice(germIndex, 1);
        return;
    }
        squishedEmber = embers.find(ember => {
            const dx = ember.x - e.clientX;
            const dy = ember.y - e.clientY;
            return Math.sqrt(dx * dx + dy * dy) < ember.radius + 5;
        });
        if (squishedEmber && squishedEmber.squishTimer === 0){ 
            squishedEmber.squishTimer = 1.0; squishedEmber.squishHeld = true;
        }
        return;
    }
    draggedEmber = embers.find(ember => {
        const dx = ember.x - e.clientX;
        const dy = ember.y - e.clientY;
        return Math.sqrt(dx * dx + dy * dy) < ember.radius + 24;
    });
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
        const hoveringEmber = embers.find(ember => {
            const dx = ember.x - mouseX;
            const dy = ember.y - mouseY;
            return Math.sqrt(dx * dx + dy * dy) < ember.radius + 24;
        });
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
        restartPhase2();
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
            triggerVirusOutbreak();
        }
        return;
    }

    handleGermSpawn(e);
    const clickedEmber = embers.find(ember => {
    const dx = ember.x - e.offsetX;
    const dy = ember.y - e.offsetY;
    return Math.sqrt(dx * dx + dy * dy) < ember.radius + 24;
    });
    if (clickedEmber){
         selectedEmber = clickedEmber;    
    } else {
        selectedEmber = null;
    }
    
;})


let lastTime = 0;
function gameLoop(timestamp){
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showEpistasisPopup) {
        embers.forEach(ember => ember.draw(ctx, ember === selectedEmber));
        drawEpistasisPopup();
    } else if (showGermIntroPopup) {
        embers.forEach(ember => ember.draw(ctx, ember === selectedEmber));
        drawGermIntroPopup();
    } else if (showGlovesPopup) {
        embers.forEach(ember => ember.draw(ctx, ember === selectedEmber));
        drawGlovesPopup();
    } else if (showExtinctPopup) {
        embers.forEach(ember => ember.draw(ctx, ember === selectedEmber));
        drawExtinctPopup();
    } else if (showPhase2Win) {
        embers.forEach(ember => ember.draw(ctx, ember === selectedEmber));
        drawPhase2Win();
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
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (
            distance < 50 &&
            a.gender !== b.gender &&
            a.age > 10 && b.age > 10 &&
            a.matingCooldown <= 0 && b.matingCooldown <= 0 &&
             a.matingWith === null && b.matingWith === null
        ) {

            a.matingWith  = b;
            b.matingWith = a;
            
            const targetDist = a.radius + b.radius;
            b.x = a.x - dx / distance * targetDist;
            b.y = a.y - dy / distance * targetDist;

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

            if (offspring.flickeredChannel !== null && !epistasisSeen && !isTutorialActive()) {
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


// --- Tutorial germ: detect both squished, start glove popup timer ---
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

// --- Recurring virus outbreaks (post-tutorial) ---
if (phase2WinSeen) {
    virusOutbreakTimer += dt;
    if (virusOutbreakTimer >= virusOutbreakInterval) {
        triggerVirusOutbreak();
        virusOutbreakTimer = 0;
        virusOutbreakInterval = 180 + Math.random() * 120;
    }
}

// --- Update, spread, and kill viruses ---
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
        const dx = ember.x - virus.host.x;
        const dy = ember.y - virus.host.y;
        if (Math.sqrt(dx * dx + dy * dy) < 50) {
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

// --- Draw viruses on top ---
viruses.forEach(virus => virus.draw(ctx));

    //Fixation
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

    if (phase2Started && !showExtinctPopup && !showPhase2Win && !phase2WinSeen) {
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
            drawEmberInfoPanel();
            drawPopulationPanel(alleleCounts, avgFlicker, avgSize, maleCount, femaleCount);
            drawModeButtons();
        }  // end: not showing tutorial cards
    }  // end: not showing popup

    drawLabel();
    requestAnimationFrame(gameLoop);
}


//=== Functions === 

function drawLabel() {
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
}

function drawEpistasisPopup(){
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EPISTASIS!', canvas.width / 2, canvas.height / 2 - 80);
    ctx.font = '16px sans-serif';
    wrapText(ctx, epistasisCards[epistasisCard], canvas.width / 2, canvas.height / 2, 500, 28);
    
    if (epistasisCard > 0) {
        ctx.fillText('◀', canvas.width / 2 - 200, canvas.height / 2 + 80);
    }
    if (epistasisEmberFound && epistasisCard < epistasisCards.length - 1) {
        ctx.fillText('▶', canvas.width / 2 + 200, canvas.height / 2 + 80);
    } else if (!epistasisEmberFound){
    ctx.fillText('Click the ember to continue.',canvas.width / 2, canvas.height / 2 + 80); 
    } else {
        ctx.fillText('Click anywhere to continue.', canvas.width / 2, canvas.height / 2 + 80);
    }
    ctx.fillText(`${epistasisCard + 1} / ${epistasisCards.length}`, canvas.width / 2, canvas.height / 2 + 110);

    drawEmberInfoPanel();

    if (showBonusCard){
        drawBonusCard();
    }
    if (selectedEmber) {
        selectedEmber.draw(ctx, true);
    }
    ctx.shadowBlur = 0;
}

function drawEmberInfoPanel(){
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

function drawBonusCard() {
    const de = selectedEmber;
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fillRect(canvas.width / 2 - 250, canvas.height / 2 - 130, 500, 260);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('You found it!', canvas.width / 2, canvas.height / 2 - 90);
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    const x = canvas.width / 2 - 220;
    ctx.fillText(`Allele 1: ${de.colorAlleles[0].value} (${de.colorAlleles[0].strength.toFixed(2)})`, x, canvas.height / 2 - 55);
    ctx.fillText(`Allele 2: ${de.colorAlleles[1].value} (${de.colorAlleles[1].strength.toFixed(2)})`, x, canvas.height / 2 - 30);
    ctx.fillText(`RGB: ${Math.round(de.r)}, ${Math.round(de.g)}, ${Math.round(de.b)}`, x, canvas.height / 2 - 5);
    ctx.fillText(`Flickered: ${de.flickeredChannel}`, x, canvas.height / 2 + 20);
    ctx.fillText(`Gender: ${de.gender}`, x, canvas.height / 2 + 45);
    ctx.textAlign = 'center';
    ctx.fillText('[ Close ]', canvas.width / 2, canvas.height / 2 + 100);
}

function drawPopulationPanel(alleleCounts, avgFlicker, avgSize, maleCount, femaleCount){
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

function drawModeButtons(){
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
    const onEmber = de && Math.sqrt((e.clientX - de.x) ** 2 + (e.clientY - de.y) ** 2) < de.radius + 5;
    if (onEmber) { 
    epistasisEmberFound = true;
    showBonusCard = true; 
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

function drawPhase2Win() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const navY = canvas.height * 0.70;
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
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

function drawExtinctPopup() {
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'red';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`The ${extinctColor} allele went extinct.`, canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Click anywhere to try again.', canvas.width / 2, canvas.height / 2 + 20);
}

function drawGermIntroPopup() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const navY = canvas.height * 0.70;
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
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

function drawGlovesPopup() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const navY = canvas.height * 0.70;
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
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
            const dx = ember.x - germ.x;
            const dy = ember.y - germ.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < germ.radius + ember.radius) {
                ember.lifespan -= 15 * dt;
                ember.damageTint = 50;
            }
        });
    });

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
