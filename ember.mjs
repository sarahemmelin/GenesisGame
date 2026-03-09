import { SIZES, BASE_COLORS } from './constants.mjs';
import Allele from './allele.mjs';

class Ember {
    constructor(x,y){
        this.x = x;
        this.y = y;
        this.sizeAlleles = [
            new Allele('baseSize', 
            SIZES[Math.floor(Math.random() * SIZES.length)]),
            new Allele('baseSize',
            SIZES[Math.floor(Math.random() * SIZES.length)])
        ];
        this.colorAlleles = [
            new Allele('baseColor', 
            BASE_COLORS[Math.floor(Math.random() * BASE_COLORS.length)]),
            new Allele('baseColor',
            BASE_COLORS[Math.floor(Math.random() * BASE_COLORS.length)])
        ];
        this.saturationAlleles = [
            new Allele('baseSaturation', Math.random()),
            new Allele('baseSaturation', Math.random())
        ];
        this.glowAlleles = [
            new Allele('baseGlow', Math.random()),
            new Allele('baseGlow', Math.random())
        ];

        this.gender = Math.random() < 0.5 ? 'male' : 'female';
    }

    draw(ctx){
        ctx.shadowColor = 'crimson';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'crimson';
        ctx.fill();
    }

} 

export default Ember;