import type { CategoryDefinition } from '$lib/types';

export const CATEGORIES: CategoryDefinition[] = [
    {
        id: 'car_class',
        label: 'Class',
        type: 'dynamic',
        group: 'Car'
    },
    {
        id: 'car_type',
        label: 'Type',
        type: 'dynamic',
        group: 'Car'
    },
    {
        id: 'broader_car_categories',
        label: 'Category',
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
        label: 'Tuning',
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
        label: 'Decade',
        type: 'dynamic',
        group: 'Car'
    },
    {
        id: 'year',
        label: 'Year',
        type: 'dynamic', // Pulled from car data
        group: 'Car'
    },
    {
        id: 'car_value',
        label: 'Value',
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
        id: 'camera',
        label: 'Camera',
        type: 'dynamic',
        group: 'Car'
    },
    {
        id: 'specific_car',
        label: 'Car',
        type: 'dynamic', // Pulled from car data
        group: 'Car'
    },
    {
        id: 'track',
        label: 'Track',
        type: 'dynamic', // Pulled from track data
        group: 'Track'
    },
    {
        id: 'tracktype',
        label: 'Type',
        type: 'dynamic',
        group: 'Track'
    },
    {
        id: 'track_subtype',
        label: 'Subtype',
        type: 'dynamic',
        group: 'Track'
    },
    {
        id: 'laps',
        label: 'Laps',
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
        label: 'Time',
        type: 'dynamic',
        group: 'Track'
    },
    {
        id: 'horizon_play_type',
        label: 'Play Type',
        type: 'dynamic',
        group: 'Horizon Play'
    },
    {
        id: 'horizon_track_type',
        label: 'Track Type',
        type: 'dynamic',
        group: 'Horizon Play'
    },
    {
        id: 'horizon_class',
        label: 'Class',
        type: 'dynamic',
        group: 'Horizon Play'
    },
    {
        id: 'horizon_drivetrain',
        label: 'Drivetrain',
        type: 'dynamic',
        group: 'Horizon Play'
    },
    {
        id: 'horizon_collisions',
        label: 'Collisions',
        type: 'dynamic',
        group: 'Horizon Play'
    }
];
