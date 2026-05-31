import type { CategoryDefinition } from '$lib/types';

export const CATEGORIES: CategoryDefinition[] = [
    {
        id: 'car_class',
        label: 'Car Class',
        type: 'dynamic',
        group: 'Car'
    },
    {
        id: 'car_type',
        label: 'Car Type',
        type: 'dynamic',
        group: 'Car'
    },
    {
        id: 'broader_car_categories',
        label: 'Broader Car Categories',
        type: 'dynamic',
        group: 'Car'
    },
    {
        id: 'countries',
        label: 'Country',
        type: 'dynamic',
        group: 'Car'
    },
    {
        id: 'stock_tuned',
        label: 'Stock / Tuned',
        type: 'dynamic',
        group: 'Car'
    },
    {
        id: 'manufacturer',
        label: 'Manufacturer',
        type: 'dynamic', // Pulled from car data
        group: 'Car'
    },
    {
        id: 'decades',
        label: 'Decades',
        type: 'dynamic',
        group: 'Car'
    },
    {
        id: 'year',
        label: 'Specific Year',
        type: 'dynamic', // Pulled from car data
        group: 'Car'
    },
    {
        id: 'car_value',
        label: 'Car Value',
        type: 'dynamic',
        group: 'Car'
    },
    {
        id: 'drivetrain',
        label: 'Drivetrain',
        type: 'dynamic',
        group: 'Car'
    },
    {
        id: 'rarity',
        label: 'Rarity',
        type: 'dynamic',
        group: 'Car'
    },
    {
        id: 'specific_car',
        label: 'Specific Car',
        type: 'dynamic', // Pulled from car data
        group: 'Car'
    },
    {
        id: 'track',
        label: 'Specific Track',
        type: 'dynamic', // Pulled from track data
        group: 'Track'
    },
    {
        id: 'tracktype',
        label: 'Track Type',
        type: 'dynamic',
        group: 'Track'
    },
    {
        id: 'track_subtype',
        label: 'Track Subtype',
        type: 'dynamic',
        group: 'Track'
    },
    {
        id: 'laps',
        label: 'Amount of Laps',
        type: 'dynamic',
        group: 'Track'
    },
    {
        id: 'season',
        label: 'Season',
        type: 'dynamic',
        group: 'Track'
    },
    {
        id: 'weather',
        label: 'Weather',
        type: 'dynamic',
        group: 'Track'
    },
    {
        id: 'time_of_day',
        label: 'Time of Day',
        type: 'dynamic',
        group: 'Track'
    }
];
