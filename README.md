# Green Energy Candidate Analyzer

An AI-powered application to help users from homeowners to policymakers assess their potential for adopting green energy solutions through a step-by-step analysis of weatherization, solar, wind, and other renewable sources.

![Application Screenshot](https://storage.googleapis.com/aistudio-public/gallery/2f23851c-8e41-4c6e-826a-8d1979927b25/green-energy-analyzer.png)

## ✨ Features

- **Role-Based Workflows:** Tailored analysis paths for Homeowners, Community Organizers, Policymakers, Sales Professionals, and Developers.
- **AI-Powered Analysis:** Leverages the Google Gemini API to provide in-depth analysis on solar, wind, hydro, geothermal, and more.
- **Interactive Location Selection:** Uses an interactive map (Leaflet.js) to pinpoint locations, automatically fetching address data and performing preliminary analysis.
- **Automated Data Enrichment:** Integrates with public data sources (via AI search) to pre-fill information like solar potential and environmental insights.
- **Comprehensive Reporting:** Generates detailed reports, including financial projections, environmental impact, and actionable steps.
- **Sales Professional Playbook:** A unique workflow that generates a complete market analysis, ideal customer profile, selling points, and outreach strategy.
- **Project Management:** Save, load, rename, and manage multiple analysis projects locally in your browser.
- **Sharable Reports:** Generate a unique link to share a read-only version of your report with stakeholders.
- **AI Voice Assistant:** Discuss your report and get help navigating the app through a real-time voice conversation.

## 🛠️ Technology Stack

- **Frontend:** React, TypeScript
- **Styling:** Tailwind CSS
- **Mapping:** Leaflet.js, Esri Leaflet
- **AI Engine:** Google Gemini API (`@google/genai`)
- **Charting:** Recharts

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A valid Google Gemini API Key.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/green-energy-analyzer.git
    cd green-energy-analyzer
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    This application requires a Google Gemini API key to function. The application is configured to read this key from the environment.
    *   **Note:** In a development or production environment, you would typically use a `.env` file. However, for this specific project setup, the API key is expected to be provided by the hosting environment (like AI Studio). You do not need to create a `.env` file.

### Running the Development Server

This project is set up to run in an environment like Google's AI Studio and uses ES modules directly in the browser, so a local development server command like `npm run dev` may not be configured. To run it locally, you can use a simple static file server.

1.  **Install a static server (if you don't have one):**
    ```sh
    npm install -g serve
    ```

2.  **Run the server from the project root:**
    ```sh
    serve .
    ```
    The application should now be running on a local port (e.g., `http://localhost:3000`).

## 🧪 Testing

This project does not yet have a dedicated test suite. Future work could include adding unit tests for services and components using a framework like Vitest and React Testing Library.

## 📄 License

This project is licensed under the MIT License.

---

### GitHub Repository Setup

For improved discoverability, update your GitHub repository settings with the following:

-   **Description:** An AI-powered application to assess green energy potential for various user roles, from homeowners to policymakers.
-   **Topics:** `react`, `typescript`, `gemini-api`, `ai`, `tailwind-css`, `leaflet`, `renewable-energy`, `sustainability`, `green-tech`
