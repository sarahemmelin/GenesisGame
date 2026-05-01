const encode = svg => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

function sizeToHeight(svg, h) {
    const vbMatch = svg.match(/viewBox="[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)"/);
    const w = Math.round(parseFloat(vbMatch[1]) / parseFloat(vbMatch[2]) * h);
    return svg.replace('<svg ', `<svg width="${w}" height="${h}" `);
}

async function cur(path, h, hx, hy) {
    const svg = sizeToHeight(await (await fetch(path)).text(), h);
    return `${encode(svg)} ${hx} ${hy}, auto`;
}

//                                               h   hx  hy
export const [
    CURSOR_OPEN,        CURSOR_OPEN_GLOVE,
    CURSOR_REACH,       CURSOR_REACH_GLOVE,
    CURSOR_PINCH,       CURSOR_PINCH_GLOVE,
    CURSOR_POINT,       CURSOR_POINT_GLOVE,
    CURSOR_POINT_PRESS, CURSOR_POINT_PRESS_GLOVE,
] = await Promise.all([
    cur('./hand_icons/hand_open.svg',              64, 12,  8),
    cur('./hand_icons/hand_open_gloved.svg',        64, 12,  8),
    cur('./hand_icons/hand_reach.svg',             60, 24,  8),
    cur('./hand_icons/hand_reach_gloved.svg',       60, 24,  8),
    cur('./hand_icons/hand_grab.svg',              38, 24, 24),
    cur('./hand_icons/hand_grab_gloved.svg',        38, 24, 24),
    cur('./hand_icons/hand_point.svg',             64,  14,  2),
    cur('./hand_icons/hand_point_gloved.svg',       64,  14,  2),
    cur('./hand_icons/hand_point_press.svg',        58,  13,  0),
    cur('./hand_icons/hand_point_press_gloved.svg', 58,  13,  0),
]);
