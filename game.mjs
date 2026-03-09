import Ember from "./ember.mjs";

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ember = new Ember(200,200);
ember.draw(ctx);