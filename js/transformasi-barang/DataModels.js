/**
 * Data Models untuk Sistem Transformasi Barang
 */

class TransformationItem {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.unit = data.unit;
        this.quantity = data.quantity;
        this.stockBefore = data.stockBefore;
        this.stockAfter = data.stockAfter;
        this.baseProduct = data.baseProduct;
        this._validate();
    }

    _validate() {
        const errors = [];
        if (!this.id || typeof this.id !== 'string') {
            errors.push('ID harus berupa string yang valid');
        }
        if (!this.name || typeof this.name !== 'string') {
            errors.push('Nama harus berupa string yang valid');
        }
        if (!this.unit || typeof this.unit !== 'string') {
            errors.push('Unit harus berupa string yang valid');
        }
        if (typeof this.quantity !== 'number' || this.quantity < 0) {
            errors.push('Quantity harus berupa angka non-negatif');
        }
        if (typeof this.stockBefore !== 'number' || this.stockBefore < 0) {
            errors.push('Stock before harus berupa angka non-negatif');
        }
        if (typeof this.stockAfter !== 'number' || this.stockAfter < 0) {
            errors.push('Stock after harus berupa angka non-negatif');
        }
        if (errors.length > 0) {
            throw new Error(`TransformationItem validation error: ${errors.join(', ')}`);
        }
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            unit: this.unit,
            quantity: this.quantity,
            stockBefore: this.stockBefore,
            stockAfter: this.stockAfter,
            baseProduct: this.baseProduct
        };
    }

    static fromJSON(data) {
        return new TransformationItem(data);
    }
}

class ConversionRatio {
    constructor(data) {
        this.baseProduct = data.baseProduct;
        this.fromUnit = data.fromUnit;
        this.toUnit = data.toUnit;
        this.ratio = data.ratio;
        this.isActive = data.isActive !== false; // default true
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this._validate();
    }

    _validate() {
        const errors = [];
        if (!this.baseProduct || typeof this.baseProduct !== 'string') {
            errors.push('Base product harus berupa string yang valid');
        }
        if (!this.fromUnit || typeof this.fromUnit !== 'string') {
            errors.push('From unit harus berupa string yang valid');
        }
        if (!this.toUnit || typeof this.toUnit !== 'string') {
            errors.push('To unit harus berupa string yang valid');
        }
        if (typeof this.ratio !== 'number' || this.ratio <= 0) {
            errors.push('Ratio harus berupa angka positif');
        }
        if (this.fromUnit === this.toUnit) {
            errors.push('From unit dan to unit tidak boleh sama');
        }
        if (errors.length > 0) {
            throw new Error(`ConversionRatio validation error: ${errors.join(', ')}`);
        }
    }

    toJSON() {
        return {
            baseProduct: this.baseProduct,
            fromUnit: this.fromUnit,
            toUnit: this.toUnit,
            ratio: this.ratio,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromJSON(data) {
        return new ConversionRatio(data);
    }
}

class TransformationRecord {
    constructor(data) {
        this.id = data.id || this._generateId();
        this.timestamp = data.timestamp || new Date().toISOString();
        this.user = data.user;
        this.sourceItem = data.sourceItem instanceof TransformationItem ? 
            data.sourceItem : new TransformationItem(data.sourceItem);
        this.targetItem = data.targetItem instanceof TransformationItem ? 
            data.targetItem : new TransformationItem(data.targetItem);
        this.conversionRatio = data.conversionRatio;
        this.status = data.status || 'pending';
        this._validate();
    }

    _validate() {
        const errors = [];
        if (!this.user || typeof this.user !== 'string') {
            errors.push('User harus berupa string yang valid');
        }
        if (!this.sourceItem || !(this.sourceItem instanceof TransformationItem)) {
            errors.push('Source item harus berupa TransformationItem yang valid');
        }
        if (!this.targetItem || !(this.targetItem instanceof TransformationItem)) {
            errors.push('Target item harus berupa TransformationItem yang valid');
        }
        if (!this.conversionRatio || typeof this.conversionRatio !== 'number' || this.conversionRatio <= 0) {
            errors.push('Conversion ratio harus berupa angka positif');
        }
        if (!['pending', 'completed', 'failed'].includes(this.status)) {
            errors.push('Status harus berupa pending, completed, atau failed');
        }
        if (errors.length > 0) {
            throw new Error(`TransformationRecord validation error: ${errors.join(', ')}`);
        }
    }

    _generateId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `TRF-${timestamp}-${random}`;
    }

    toJSON() {
        return {
            id: this.id,
            timestamp: this.timestamp,
            user: this.user,
            sourceItem: this.sourceItem.toJSON(),
            targetItem: this.targetItem.toJSON(),
            conversionRatio: this.conversionRatio,
            status: this.status
        };
    }

    static fromJSON(data) {
        return new TransformationRecord({
            ...data,
            sourceItem: TransformationItem.fromJSON(data.sourceItem),
            targetItem: TransformationItem.fromJSON(data.targetItem)
        });
    }
}

// Browser compatibility
if (typeof window !== 'undefined') {
    window.TransformationItem = TransformationItem;
    window.TransformationRecord = TransformationRecord;
    window.ConversionRatio = ConversionRatio;
}

// ES6 exports (commented out for browser compatibility)
// export { TransformationItem, TransformationRecord, ConversionRatio };
// export default { TransformationItem, TransformationRecord, ConversionRatio };