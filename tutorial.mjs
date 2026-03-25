import Ember from "./ember.mjs";
import { TUTORIAL_STEP } from "./constants.mjs";

// --- State ---
let step = TUTORIAL_STEP.FIND_AND_MATE;
let introCard = 0;


// --- flags and references ---
let showIntro = true;

// --- introcards --- 
const introCardsText = [
    "This is a male Ember. It's a tiny creature living in your petri dish.",
    "Embers are diploid, meaning each carries two color alleles, one inherited from each parent.",
    "Each allele has a strength, how loudly it expresses. Here, blue (0.70) dominates gold (0.30), blending into green. The stronger allele expresses itself louder.",
    "An allele with strength 0.00 is still there, just 'silent'. It can be passed on and grow stronger in future generations.",
    "Click on an Ember to inspect it. Find a male with a blue allele and drag it to a female with a gold allele."
];

export function draw(ctx) {
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

export function spawnTutorialEmbers(canvasWidth, canvasHeight) {
    const embers = [];
    let ember = new Ember(Math.random() * canvasWidth, Math.random() *canvasHeight, null, null, { color: 'blue', gender: 'male'});
    ember.immortal = true;
    embers.push(ember);
return embers;
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


export function handleClick(e, ctx) {
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

export function update(embers) {};