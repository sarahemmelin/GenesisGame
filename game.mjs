import Ember from "./ember.mjs";

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

// --- Stats ---
let mouseX = 0;
let mouseY = 0;
let selectedEmber = null;
let draggedEmber = null;
const navY = canvas.height * 0.70;

// --- flags and references ---
let epistasisSeen = false;
let epistasisEmber = null;
let showEpistasisPopup = false;
let epistasisCard = 0;
let showBonusCard = false;
let introSeen = false;
let showIntroPopup = false;
let introCard = 0;

// === popups ===
// --- epistasiscards --- 
let epistasisCards = [
    "Something just happened. An unusual ember was born. Can you find it?",
    "Even though the color alleles inherited from its parents did not change, a separate gene, 'the flicker gene', switched one color channel off at birth.",
    "This is called epistasis. One gene can silence another. The color is still in the DNA, just not showing. This is why appearance alone can't tell you what genes a creature carries."
];

// --- introcards --- 
const introCards = [
    "This is an Ember. It's a tiny creature living in your petri dish.",
    "These Embers are diploid, meaning each carries two color alleles, one inherited from each parent.",
    "Each allele has a strength, how loudly it expresses. Here, blue (0.70) dominates gold (0.30), blending into green. The stronger allele expresses itself louder.",
    "An allele with strength 0.00 is still there, just 'silent'. It can be passed on and grow stronger in future generations.",
    "Click any Ember to inspect its genes. Then watch what happens when they meet."
];


canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (draggedEmber) {
        draggedEmber.x = mouseX;
        draggedEmber.y = mouseY;
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
    draggedEmber = embers.find(ember => {
        const dx = ember.x - e.clientX;
        const dy = ember.y - e.clientY;
        return Math.sqrt(dx * dx + dy * dy) < 15;
    });
    if (draggedEmber) selectedEmber = draggedEmber;
});


canvas.addEventListener('mouseup', () => {
    draggedEmber = null;
});

canvas.addEventListener('click', (e) => {
    if (showIntroPopup) {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const clickedBack = introCard > 0 && Math.abs(e.clientX - (cx - 200)) < 50 && Math.abs(e.clientY - navY) < 30;
        const clickedForward = introCard < introCards.length - 1 && Math.abs(e.clientX - (cx + 280)) < 50 && Math.abs(e.clientY - navY) < 30;

        if (clickedBack) {
            introCard--;
        } else if (clickedForward) {
            introCard++;
        } else if (introCard === introCards.length - 1) {
            showIntroPopup = false;
            introCard = 0;
        }
    return;
}


    if (showEpistasisPopup) {
        const de = selectedEmber;
        const onEmber = de && Math.sqrt((e.clientX - de.x) ** 2 + (e.clientY - de.y) ** 2) < de.radius + 5;

    if (showBonusCard) {
        const closeX = canvas.width / 2;
        const closeY = canvas.height / 2 + 100;
        if (Math.abs(e.clientX - closeX) < 60 && Math.abs(e.clientY - closeY) < 20) {
            showBonusCard = false;
        }
    return;
    }


        if (onEmber) {
            showBonusCard = true;
            return;
        }
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        const clickedBack = epistasisCard > 0 && Math.abs(e.clientX - (cx - 200)) < 50 && Math.abs(e.clientY - (cy + 80)) < 30;
        const clickedForward = epistasisCard < epistasisCards.length - 1 && Math.abs(e.clientX - (cx + 200)) < 50 && Math.abs(e.clientY - (cy + 80)) < 30;

        if (clickedBack) {
            epistasisCard--;

        } else if (clickedForward) {
            epistasisCard++;
        } else if (epistasisCard === epistasisCards.length - 1) {
            showEpistasisPopup = false;
            epistasisCard = 0;
        }
    }
});



let embers = [];
for (let i = 0; i < 10; i++){
    embers.push(new Ember(Math.random() * canvas.width, Math.random() * canvas.height));
}

function gameLoop(){
//--- Clear canvas and cull dead embers ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
if (showEpistasisPopup) {
    embers.forEach(ember => ember.draw(ctx));
    drawEpistasisPopup();
    requestAnimationFrame(gameLoop);
    return;
}


    embers = embers.filter(ember => ember.age < ember.lifespan);

    if (!introSeen && embers.every(ember => ember.age >= 600)) {
        introSeen = true;
        showIntroPopup = true;
    }

    if (showIntroPopup) {
        embers.forEach(ember => ember.draw(ctx));
        drawIntroPopup();
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

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (
            distance < 50 &&
            a.gender !== b.gender &&
            a.age > 600 && b.age > 600 &&
            a.matingCooldown === 0 && b.matingCooldown === 0 &&
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
    if (ember.gender === 'male' && ember.matingTimer >= 600) {
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

            if (offspring.flickeredChannel !== null && !epistasisSeen) {
                epistasisSeen = true;
                epistasisEmber = offspring;
                showEpistasisPopup = true;
                selectedEmber = offspring;
            }

        }
        const female = ember.matingWith;
        female.matingWith = null;
        female.matingCooldown = 1000;
        ember.matingWith = null;
        ember.matingTimer = 0;
        ember.matingCooldown = 200;


    }
});

//--- Update and draw all embers ---
    embers.forEach(ember => {
        if (ember !== draggedEmber){
            ember.update(canvas.width, canvas.height);
        }
        ember.draw(ctx);       
    })

    // ctx.fillStyle = 'white';
    // ctx.font = '12px serif';
    // ctx.fillText('← GOD', mouseX + 40, mouseY);

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


    const firstColor = collectAlleleColors[0];
    const isFixed = collectAlleleColors.every(value => value === firstColor);
    

    if (isFixed && embers.length >= 10){
        ctx.fillStyle = 'orange';
        ctx.font = 'bold 72px serif';
        ctx.textAlign = 'center';
        ctx.fillText('FIXATION', canvas.width / 2, canvas.height / 2);
        return;
    }

    //=== UI ===
    // Left-side single ember panel
   drawEmberInfoPanel();

    // Right-side population panel
    ctx.shadowBlur = 0;
    const panelWidth = 220;
    const panelX = canvas.width - panelWidth - 10;
    let panelY = 10;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(panelX, panelY, panelWidth, 110 + Object.keys(alleleCounts).length * 20);

    ctx.fillStyle = 'white';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Population: ${embers.length}`, panelX + 10, panelY + 20);

    ctx.fillText(`Allele pool:`, panelX + 10, panelY + 40);
    Object.entries(alleleCounts).forEach(([color, count], i) => {
        ctx.fillText(`${color}: ${count}`, panelX + 30, panelY + 60 + i * 20);
    });

    ctx.fillText(`Flicker avg: ${avgFlicker.toFixed(2)}`, panelX + 10, panelY + 60 + Object.keys(alleleCounts).length * 20 + 20);
    ctx.fillText(`Avg size: ${avgSize.toFixed(1)}`, panelX + 10, panelY + 60 + Object.keys(alleleCounts).length * 20 + 40);

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
    if (epistasisCard < epistasisCards.length - 1) {
        ctx.fillText('▶', canvas.width / 2 + 200, canvas.height / 2 + 80);
    } else {
        ctx.fillText('Click anywhere to continue.', canvas.width / 2, canvas.height / 2 + 80);
    }
    ctx.fillText(`${epistasisCard + 1} / ${epistasisCards.length}`, canvas.width / 2, canvas.height / 2 + 110);

    drawEmberInfoPanel();

    if (showBonusCard){
        drawBonusCard();
    }
    if (selectedEmber) {
        selectedEmber.draw(ctx);
    }
        if (epistasisEmber && !showBonusCard) {
        const pulse = 50 + Math.sin(Date.now() / 300) * 15;
        ctx.shadowColor = 'white';
        ctx.shadowBlur = pulse;
        ctx.beginPath();
        ctx.arc(epistasisEmber.x, epistasisEmber.y, epistasisEmber.displayRadius + 15, 0, Math.PI * 2);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}


function drawIntroPopup() {
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GENESIS: EMBER', canvas.width / 2, canvas.height / 2 - 120);

    if (introCard === 0 || introCard === 1 || introCard === 2 || introCard === 3) {
        // Ember diagram
        const ex = canvas.width / 2 - 150;
        const ey = canvas.height / 2;
        const er = 20;
        const color = introCard === 3 ? 'rgb(0, 180, 216)' : 'rgb(58, 157, 78)';

        ctx.shadowColor = color;
        ctx.shadowBlur = 35 + Math.sin(Date.now() /  300) * 15;
        ctx.beginPath();
        ctx.arc(ex, ey, er, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Allele labels only on cards 1 and 2
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


        // Right column: card text
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'white';
        ctx.font = '16px sans-serif';
        wrapText(ctx, introCards[introCard], canvas.width / 2 + 80, canvas.height / 2 - 20, 220, 28);
    } else {
        ctx.font = '16px sans-serif';
        wrapText(ctx, introCards[introCard], canvas.width / 2, canvas.height / 2, 500, 28);
    }
    ctx.textAlign = 'center';
    ctx.font = '28px sans-serif';
    ctx.shadowColor = 'white';
    ctx.shadowBlur = 10;
    if (introCard > 0) {
        ctx.fillText('◀', canvas.width / 2 - 200, navY);
    }
    if (introCard < introCards.length - 1) {
        ctx.fillText('▶', canvas.width / 2 + 280, navY);
    } else {
        ctx.shadowBlur = 0;
        ctx.font = '16px sans-serif';
        ctx.fillText('Click anywhere to continue.', canvas.width / 2, navY - 30);
    }
    ctx.shadowBlur = 0;
    ctx.font = '16px sans-serif';
    ctx.fillText(`${introCard + 1} / ${introCards.length}`, canvas.width / 2, navY );

}

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


function drawEmberInfoPanel(){
 if (!selectedEmber) {
    return;
 }
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.shadowColor = `rgb(${Math.round(selectedEmber.r)}, ${Math.round(selectedEmber.g)}, ${Math.round(selectedEmber.b)})`;
    ctx.shadowBlur = 20;
    ctx.fillRect(10, 10, 200, 100);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'white';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Allele 1: ${selectedEmber.colorAlleles[0].value} (${selectedEmber.colorAlleles[0].strength.toFixed(2)})`, 20, 30);
    ctx.fillText(`Allele 2: ${selectedEmber.colorAlleles[1].value} (${selectedEmber.colorAlleles[1].strength.toFixed(2)})`, 20, 50);
    ctx.fillText(`Flicker: ${selectedEmber.flickeredChannel ?? 'none'}`, 20, 70);
    ctx.fillText(`Gender: ${selectedEmber.gender}`, 20, 90);
      
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
