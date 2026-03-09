class Ember {
    constructor(x,y){
        this.x = x;
        this.y = y;
        this.size = 10;
        this.color = "blue";
        this.gender = Math.random() < 0.5 ? 'male' : 'female';

    }


}

export default Ember;