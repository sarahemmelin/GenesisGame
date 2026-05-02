export const SIZES = {
    small: 12, 
    large: 20
};

export const BASE_COLORS = {
    crimson:    {r: 230,    g: 57,  b:70},
    gold:       {r: 255,    g:215,  b: 0},
    violet:     {r: 155,    g: 93,  b: 229},
    blue:       {r: 0,      g: 180, b: 216} 
};

export const GAME_STATE = Object.freeze({
    TUTORIAL:    'tutorial',
    ROUND_INTRO: 'round_intro',
    PLAYING:     'playing',
    ROUND_WIN:   'round_win',
    GAME_OVER:   'game_over',
});

export const ROUND = Object.freeze({
    ROUND_1: 1,
    ROUND_2: 2,
    ROUND_3: 3,
    ROUND_4: 4,
    ROUND_5: 5,
});

export const TUTORIAL_STEP = Object.freeze({
    FIND_AND_MATE: 'find_and_mate',
    GROW: 'grow'
});
