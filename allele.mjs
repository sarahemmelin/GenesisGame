class Allele {
    constructor(gene, value, strength = null){
        if (!gene) {
            throw new Error(`Allele requires a gene, got: ${gene}`);
        }
        if (value === undefined || value === null) {
            throw new Error(`Allele requires a value, got: ${value}`);
        }
        
        this.gene = gene;
        this.value = value;
        this.strength = strength !== null ?
        Math.max(0, Math.min(1, (strength + ((Math.random() - 0.5) * 0.5))))
        : Math.random();
        
        //if gene strength is less than 0.1, consider 
        // if mutation occurs?
    }
}

export default Allele;