export interface Car {
    Make: string;
    "Car Name": string;
    "Car Type": string;
    "Car Class": string;
    Country: string;
    Collection: string;
    "Add-Ons": string;
}

export interface Race {
    Name: string;
    Type: string;
    Subtype: string;
}

export interface PrStunt {
    Name: string;
    Type: string;
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
    group: 'Car' | 'Track' | 'Horizon Play' | 'PR Stunts';
}

export interface CategoryResult {
    categoryId: string;
    label: string;
    results: string[];
    group: 'Car' | 'Track' | 'Horizon Play' | 'PR Stunts';
}

export interface RandomizerSettings {
    activeCategories: string[];
    outputCount: number;
    disabledAcquiredVia: string[];
    lockedResults: Record<string, string[]>;
}

