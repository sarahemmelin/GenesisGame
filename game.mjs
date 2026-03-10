import Ember from "./ember.mjs";

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let embers = [];
for (let i = 0; i < 10; i++){
    embers.push(new Ember(Math.random() * canvas.width, Math.random() * canvas.height));
}

function gameLoop(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    embers = embers.filter(ember => ember.age < ember.lifespan);
    if (embers.length > 50) embers.length = 50;

    for (let i = 0; i < embers.length; i++) {
    for (let j = i + 1; j < embers.length; j++) {
        const a = embers[i];
        const b = embers[j];
        // check if a and b should mate
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (
            distance < 50 &&
            a.gender !== b.gender &&
            a.age > 100 && b.age > 100 &&
            a.matingCooldown === 0 && b.matingCooldown === 0
        ) {
        a.matingCooldown = 100;
        b.matingCooldown = 100;
        // mate!
        const offspring = new Ember(
            (a.x + b.x) / 2,
            (a.y + b.y) / 2,
            a,
            b
        );
    embers.push(offspring);

    }

    }
}


    embers.forEach(ember => {
        ember.update(canvas.width, canvas.height);
        ember.draw(ctx);       
    })
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
