import type { CategoryDefinition } from '$lib/types';

export const CATEGORIES: CategoryDefinition[] = [
    {
        id: 'car_class',
        label: 'Car Class',
        type: 'dynamic'
    },
    {
        id: 'car_type',
        label: 'Car Type',
        type: 'dynamic'
    },
    {
        id: 'broader_car_categories',
        label: 'Broader Car Categories',
        type: 'dynamic'
    },
    {
        id: 'countries',
        label: 'Country',
        type: 'dynamic'
    },
    {
        id: 'stock_tuned',
        label: 'Stock / Tuned',
        type: 'dynamic'
    },
    {
        id: 'manufacturer',
        label: 'Manufacturer',
        type: 'dynamic' // Pulled from car data
    },
    {
        id: 'decades',
        label: 'Decades / Centuries',
        type: 'dynamic'
    },
    {
        id: 'year',
        label: 'Specific Year',
        type: 'dynamic' // Pulled from car data
    },
    {
        id: 'car_value',
        label: 'Car Value',
        type: 'dynamic'
    },
    {
        id: 'drivetrain',
        label: 'Drivetrain',
        type: 'dynamic'
    },
    {
        id: 'rarity',
        label: 'Rarity',
        type: 'dynamic'
    },
    {
        id: 'specific_car',
        label: 'Specific Car',
        type: 'dynamic' // Pulled from car data
    },
    {
        id: 'track',
        label: 'Specific Track',
        type: 'dynamic' // Pulled from track data
    },
    {
        id: 'tracktype',
        label: 'Track Type',
        type: 'dynamic'
    },
    {
        id: 'track_subtype',
        label: 'Track Subtype',
        type: 'dynamic'
    },
    {
        id: 'laps',
        label: 'Amount of Laps',
        type: 'dynamic'
    },
    {
        id: 'season',
        label: 'Season',
        type: 'dynamic'
    },
    {
        id: 'weather',
        label: 'Weather',
        type: 'dynamic'
    },
    {
        id: 'time_of_day',
        label: 'Time of Day',
        type: 'dynamic'
    }
];
