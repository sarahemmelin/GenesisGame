import Ember from "./ember.mjs";
import Germ from "./germ.mjs";
import { BASE_COLORS, GAME_STATE, TUTORIAL_STEP } from "./constants.mjs";
import { spawnTutorialEmbers, isShowingIntro, isShowingMatingSuccess, isShowingGoalCards, isTutorialActive, getStep, draw as drawTutorial, handleClick as handleTutorialClick, update as updateTutorial } from "./tutorial.mjs";



//--- Canvas setup ---
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//--- Start screen ---
const startScreen = document.getElementById('start-screen');
document.getElementById('start-button').addEventListener('click', () => {
    startScreen.style.display = 'none';
    requestAnimationFrame(gameLoop);
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

// --- flags and references ---
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
    if (squishMode) {
        canvas.style.cursor = 'pointer';
    } else if (draggedEmber) {
        canvas.style.cursor = 'grabbing';
    } else {
        canvas.style.cursor = 'grab';
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
    if (showEpistasisPopup) {
        const de = selectedEmber;
        if (de && Math.sqrt((e.clientX - de.x) ** 2 + (e.clientY - de.y) ** 2) < de.radius + 5) {
            draggedEmber = de;
        }
        return;
    }

    if (squishMode || e.shiftKey) {
        const germIndex = germs.findIndex(germ => {
        const dx = germ.x - e.clientX;
        const dy = germ.y - e.clientY;
    return Math.sqrt(dx * dx + dy * dy) < germ.radius;
    });
    if (germIndex !== -1) {
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
        return Math.sqrt(dx * dx + dy * dy) < 15;
    });
    if (draggedEmber) selectedEmber = draggedEmber;
});


canvas.addEventListener('mouseup', () => {
    draggedEmber = null;
    if (squishedEmber) { squishedEmber.squishHeld = false; squishedEmber = null; }
});


canvas.addEventListener('click', (e) => {
    const btnX = canvas.width - 370;
    const btnY = 10;
    if (e.offsetX >= btnX && e.offsetX <= btnX + 130 &&
        e.offsetY >= btnY && e.offsetY <= btnY + 50) {
            squishMode = e.offsetY < btnY + 30 ? false : true;
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

    handleGermSpawn(e);
    const clickedEmber = embers.find(ember => {
    const dx = ember.x - e.offsetX;
    const dy = ember.y - e.offsetY;
    return Math.sqrt(dx * dx + dy * dy) < ember.radius;
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

//--- Clear canvas and cull dead embers ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (showEpistasisPopup) {
        embers.forEach(ember => ember.draw(ctx, ember === selectedEmber));
        drawEpistasisPopup();
        requestAnimationFrame(gameLoop);
        return;
    }

    embers = embers.filter(ember => ember.immortal || (ember.age < ember.lifespan && !(ember.squishTimer > 0 && ember.squishTimer <= 0.05)));
    if (selectedEmber && !embers.includes(selectedEmber)){
        selectedEmber = null;
    };

    updateTutorial(embers, dt);

    if (isShowingIntro() || isShowingMatingSuccess() || isShowingGoalCards()) {
        embers.forEach(ember => ember.draw(ctx));
        drawTutorial(ctx);
        requestAnimationFrame(gameLoop);
    return;
    }

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



//--- Update and draw all embers ---
    embers.forEach(ember => {
        if (ember !== draggedEmber){
            ember.update(canvas.width, canvas.height, dt);
        }
        ember.draw(ctx, ember === selectedEmber);
    })

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
    requestAnimationFrame(gameLoop);
}


//=== Functions === 

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
    if (!selectedEmber || draggedEmber === selectedEmber || showEpistasisPopup) return;

    const panelWidth = 200;
    const panelHeight = 120;
    const offset = (selectedEmber.displayRadius ?? selectedEmber.radius) + 15;

    const placeOnRight = selectedEmber.x < canvas.width / 2;
    let panelX = placeOnRight
        ? selectedEmber.x + offset
        : selectedEmber.x - offset - panelWidth;
    let panelY = selectedEmber.y - panelHeight / 2;

    if (panelY < 0) panelY = 0;
    if (panelY + panelHeight > canvas.height) panelY = canvas.height - panelHeight;
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


function handleGermSpawn(e){
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
