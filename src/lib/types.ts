export interface Car {
    Make: string;
    "Car Name": string;
    "FH6 Class": string;
    "FH6 PI": string;
    "FH5 Class": string;
    "Class Change?": string;
    "New?": string;
    "Acquired via": string;
}

export interface Race {
    Name: string;
    Type: string;
    Subtype: string;
}

export interface CarType {
    Car_Type: string;
    Category: string;
}

export interface OptionData {
    Value: string;
}

export interface CategoryDefinition {
    id: string;
    label: string;
    type: 'dynamic';
    group: 'Car' | 'Track';
}

export interface CategoryResult {
    categoryId: string;
    label: string;
    results: string[];
    group: 'Car' | 'Track';
}

export interface RandomizerSettings {
    activeCategories: string[];
    outputCount: number;
    disabledAcquiredVia: string[];
}

