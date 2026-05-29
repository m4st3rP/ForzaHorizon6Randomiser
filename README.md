# Forza Horizon 6 Randomiser

*Disclaimer: This code was mostly written by an AI and has not been thoroughly checked by a human.*

[Click here to use](https://m4st3rp.github.io/ForzaHorizon6Randomiser/)

A web-based tool built with SvelteKit to randomly generate event constraints for Forza Horizon 6. Roll for cars, manufacturers, track types, weather, and more to create unique racing challenges!

## Features

- **Fully Dynamic Constraints**: Roll random combinations of Car Class, Type, Country, Stock/Tuned, Manufacturer, Decades, Value, Drivetrain, Rarity, Specific Car, Track, Track Type, Laps, Season, Weather, and Time of Day.
- **CSV-Driven Data**: Every single category and data point is dynamically loaded from easily editable `.csv` files.
- **Shareable Seeds**: Every roll generates a unique query parameter seed in the URL, allowing you to easily share the exact same event constraints with friends.
- **Customisable Roll Counts**: Generate multiple options per category (e.g., roll 1Track, but 3 different Cars to choose from).

## Data Configuration

All randomiser data is stored in the `static/data/` directory. To add or modify options without altering the codebase, simply edit the respective CSV files:

- `cars.csv` - Contains the list of cars, including makes, years/names, and classes.
- `car-types.csv` - Defines specific car types and their broader categories.
- `races.csv` - Contains all race events, specifying their primary Type (Road, Dirt, Drag, etc.) and Subtype (Circuit, Sprint).
- **Standalone Categories** - Small, single-column CSVs (e.g., `weather.csv`, `season.csv`, `car_class.csv`, `countries.csv`, etc.). To add a new weather condition, just add it on a new line in `weather.csv`.

## Developing

Once you've installed dependencies with `pnpm install`, start a development server:

```sh
pnpm run dev

# or start the server and open the app in a new browser tab
pnpm run dev -- --open
```

## Building

To create a production version:

```sh
pnpm run build
```

You can preview the production build with `pnpm run preview`.

## Credits

Car Data is sourced from [Aeqnx's Forza Horizon 6 Spreadsheet](https://docs.google.com/spreadsheets/d/1pz_hNeBiBwLn-ya1zLRhzvnaYk3lLfg9izmbCI82mW4/).
