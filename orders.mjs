//=== Order generation ===
let nextId = 1;

function randomCriteriaLine() {
    const countRoll = Math.random();
    const count = countRoll < 0.50 ? 1 : countRoll < 0.85 ? 2 : 3;

    const genderRoll = Math.random();
    const gender = genderRoll < 0.33 ? 'male' : genderRoll < 0.66 ? 'female' : null;

    const phenoRoll = Math.random();
    let phenotype;
    if      (phenoRoll < 0.20) { phenotype = null; }
    else if (phenoRoll < 0.38) { phenotype = 'crimson'; }
    else if (phenoRoll < 0.56) { phenotype = 'gold'; }
    else if (phenoRoll < 0.74) { phenotype = 'violet'; }
    else if (phenoRoll < 0.92) { phenotype = 'blue'; }
    else                       { phenotype = 'albino'; }

    return { count, gender, phenotype };
}

function calculateReward(criteria) {
    let points = 10;
    criteria.forEach((line, i) => {
        points += line.count * 10;
        if (line.phenotype === 'albino') { points += 20; }
        else if (line.phenotype !== null) { points += 10; }
        if (line.gender !== null) { points += 5; }
        if (i > 0) { points += 15; }
    });
    return points;
}

export function generateOrder() {
    const lineCount = Math.random() < 0.7 ? 1 : 2;
    const criteria = Array.from({ length: lineCount }, randomCriteriaLine);
    return {
        id: nextId++,
        criteria,
        reward: calculateReward(criteria),
        expiresIn: 300 + Math.random() * 180,
        fulfilled: false,
        seen: false,
    };
}

//=== Order logic ===
export function updateOrders(orders, dt) {
    orders.forEach(order => {
        if (!order.fulfilled) {
            order.expiresIn -= dt;
        }
    });
    return orders.filter(order => order.expiresIn > 0);
}

export function checkFulfilled(order, vialContents) {
    return order.criteria.every(line => {
        const matches = vialContents.filter(ember => {
            const alleleMatch = line.phenotype === null || (
                line.phenotype === 'albino'
                    ? ember.colorAlleles[0].strength === 0 && ember.colorAlleles[1].strength === 0
                    : ember.colorAlleles.some(a => a.value === line.phenotype)
            );
            const genderMatch = line.gender === null || ember.gender === line.gender;
            return alleleMatch && genderMatch;
        });
        return matches.length >= line.count;
    });
}
