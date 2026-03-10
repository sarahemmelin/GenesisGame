import Ember from "./ember.mjs";

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ember = new Ember(150, 150);

function gameLoop(){
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ember.update(canvas.width, canvas.height);
    ember.draw(ctx);
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
