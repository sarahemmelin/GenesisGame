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

// --- Mouse tracking and drag (the god haaaand) ---
let mouseX = 0;
let mouseY = 0;
let draggedEmber = null;

canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (draggedEmber) {
        draggedEmber.x = mouseX;
        draggedEmber.y = mouseY;
}
});

canvas.addEventListener('mousedown', (e) => {
    draggedEmber = embers.find(ember => {
        const dx = ember.x - e.clientX;
        const dy = ember.y - e.clientY;
        return Math.sqrt(dx * dx + dy * dy) < 15;
    });
});

canvas.addEventListener('mouseup', () => {
    draggedEmber = null;
});


let embers = [];
for (let i = 0; i < 10; i++){
    embers.push(new Ember(Math.random() * canvas.width, Math.random() * canvas.height));
}

function gameLoop(){
//--- Clear canvas and cull dead embers ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    embers = embers.filter(ember => ember.age < ember.lifespan);

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
        ember.update(canvas.width, canvas.height);
        ember.draw(ctx);       
    })

    ctx.fillStyle = 'white';
    ctx.font = '12px serif';
    ctx.fillText('← GOD', mouseX + 40, mouseY);

    //Fixation
    const collectAlleleColors = [];
    embers.forEach(ember => {
       collectAlleleColors.push(ember.colorAlleles[0].value);
       collectAlleleColors.push(ember.colorAlleles[1].value);
    })

    const firstColor = collectAlleleColors[0];
    const isFixed = collectAlleleColors.every(value => value === firstColor);


    if (isFixed && embers.length >= 10){
        ctx.fillStyle = 'orange';
        ctx.font = 'bold 72px serif';
        ctx.textAlign = 'center';
        ctx.fillText('FIXATION', canvas.width / 2, canvas.height / 2);
        return;
    }



    requestAnimationFrame(gameLoop);
}
