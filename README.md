# Forza Horizon 6 Randomiser
(or Forza Horizon 6 Randomizer if you speak American English)

[![Tests](https://github.com/m4st3rp/ForzaHorizon6Randomiser/actions/workflows/test.yml/badge.svg)](https://github.com/m4st3rp/ForzaHorizon6Randomiser/actions/workflows/test.yml)
[![Deploy](https://github.com/m4st3rp/ForzaHorizon6Randomiser/actions/workflows/deploy.yml/badge.svg)](https://github.com/m4st3rp/ForzaHorizon6Randomiser/actions/workflows/deploy.yml)

*Disclaimer: This code was mostly written by an AI and has not been thoroughly checked by a human.*

[**Click here to use the Randomiser**](https://m4st3rp.github.io/ForzaHorizon6Randomiser/)

A web-based tool built with SvelteKit to randomly generate event constraints for Forza Horizon 6. Whether you are looking for a unique racing challenge or simply want variety in your cruising, this tool provides endless possible combinations for your next session.

## Features

- **Grouped Categories**: Customise your experience by selecting categories from three distinct groups:
    - **Car**: Class, Type, Country, Manufacturer, Year, Value, Drivetrain, and more.
    - **Track**: Track Name, Subtype, Laps, Season, Weather, and Time of Day.
    - **Horizon Play**: Play Type, Collisions, and specific Horizon-themed constraints.
- **Activity Presets**: Quickly apply curated sets of categories for different playstyles, such as *Racing*, *Cruising*, *Authentic*, or *Horizon Play*.
- **Collection Filtering**: Tailor the car pool to your garage by enabling or disabling cars based on how they are acquired (e.g., excluding "Hard-to-Find" or "DLC" cars).
- **Deterministic Seeds**: Every roll generates a unique seed in the URL. Share the link with friends to ensure everyone is racing with the exact same constraints.
- **Multi-Output Rolls**: Roll for multiple results per category (e.g., 3 different cars to choose from for a single race).
- **Result Locking**: Lock specific results you like while re-rolling the rest of the event.

## Data Configuration

The randomiser is entirely data-driven. All configuration is stored in the `static/data/` directory as CSV files.

### Primary Data Files

- **`cars.csv`**: The master list of vehicles.
    - *Columns*: `Make`, `Car Name`, `Car Type`, `Car Class`, `Country`, `Collection`, `Add-Ons`.
- **`races.csv`**: All available race events and routes.
    - *Columns*: `Name`, `Type`, `Subtype`.
- **`car_type_mapping.csv`**: Maps granular car types to broader categories.
    - *Columns*: `Car_Type`, `Category`.

### Standalone Categories

Simple, single-column CSVs (with a `Value` header) define options for categories like `weather.csv`, `season.csv`, `car_class.csv`, and `drivetrain.csv`. Adding a new option is as simple as adding a new line to the corresponding file.

## Technical Stack

This project is built using modern web technologies to ensure a fast and responsive experience:

- **Svelte 5**: Utilising the latest "Runes" API (`$state`, `$derived`) for efficient reactivity.
- **Tailwind CSS v4**: For high-performance, utility-first styling.
- **Vite**: The underlying build tool and development server.
- **TypeScript**: Ensuring code reliability and better developer experience.
- **Vitest & Playwright**: Comprehensive testing suite covering unit, component, and end-to-end scenarios.

### Automated Car Data Updates

The application pulls car data directly from the **Official Forza Horizon 6 Car List**.

To refresh the car data with the latest additions from the official website, run:

```sh
pnpm run update-cars
```

This script scrapes the latest information, updates `static/data/cars.csv`, and refreshes the "Data Date" displayed in the application footer.

## Local Development

If you wish to run the project locally or contribute:

1. **Install Dependencies**:
   ```sh
   pnpm install
   ```

2. **Start Development Server**:
   ```sh
   pnpm run dev
   ```

3. **Run Tests**:
   ```sh
   pnpm run test        # Unit & Component tests
   pnpm run test:e2e    # End-to-End tests
   ```

4. **Build for Production**:
   ```sh
   pnpm run build
   ```
