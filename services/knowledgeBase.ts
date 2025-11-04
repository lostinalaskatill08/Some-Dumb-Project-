export const KNOWLEDGE_BASE = {
  calculators: {
    solar: {
      logic: "AC System Size (kW) = (Monthly kWh * 12) / (Avg Sun Hours * 365 * Derate Factor). Number of Panels = (AC System Size * 1000) / Panel Wattage. Roof Area = Number of Panels * 20 sq. ft. (avg panel size).",
      panelWattage: 400,
      derateFactor: 0.8,
      avgSunHours: 4.5,
    },
    wind: {
      logic: "Annual Energy Production (kWh) = 0.01328 * RotorDiameter^2 * WindSpeed^3. Uses a 5kW turbine with a 15-foot rotor diameter as a baseline.",
    },
    wasteToEnergy: {
      logic: "1 lb of food waste can produce about 1.5 cubic feet of biogas. 1 cubic foot of biogas can generate about 0.17 kWh of electricity. One hour of cooking on a single burner uses about 15 cubic feet of biogas. CO2 reduction is based on displacing grid electricity.",
    },
    hydro: {
      logic: "Power (Watts) ≈ Head (ft) × Flow (GPM) × Efficiency_Factor (0.113 for Omni calculator). Annual Energy (kWh) = Power (Watts) × 24 × 365 / 1000.",
    },
  },
  wind: {
    ridgeblade: {
      specifications: [
        { item: 'Typical configuration', rb1: '5 or 10 modular rotor units (1.2 m per rotor)', rb2: '10 modular rotor units (1.2 m per rotor)', notes: 'Modules mount along the roof ridge and scale with ridge length.' },
        { item: 'Nominal ridge length (typical system)', rb1: '5 rotors ≈ 6.5 m (≈21.3 ft); 10 rotors ≈ 13 m (≈42.7 ft)', rb2: '10 rotors ≈ 13 m (≈42.7 ft)', notes: 'For longer ridges, multiple strings can be used.' },
        { item: 'Rated/continuous output', rb1: '2 kW continuous per 5-rotor RB1 (peak ~2.7 kW)', rb2: '4 kW continuous per 10-rotor RB2', notes: 'Power scales with modules; site wind dictates actual energy.' },
        { item: 'Grid/off-grid options', rb1: 'Grid-tied, smart-grid/microgrid capable; battery/off-grid compatible', rb2: 'Same', notes: 'Requires compatible inverter/controls; vendor supplies package.' },
        { item: 'Mounting', rb1: 'Universal solar unistrut or proprietary hybrid mounting', rb2: 'Same', notes: 'Designed for roof-ridge installation; low profile.' },
        { item: 'Roof pitch suitability (indicative)', rb1: 'Suited to pitched roofs; (older brochures note RB1 for >30°)', rb2: 'Suited to a wide range incl. low-slope/flat (with hybrid frames)', notes: 'Confirm with installer for your roof geometry.' },
        { item: 'Start-up wind (company brochure)', rb1: '~2.6 knots (~1.3 m/s)', rb2: '~2.3 knots (~1.2 m/s)', notes: 'Promotional brochure values; use with caution—real sites need higher average wind to deliver energy.' },
        { item: 'Turbulence / wind direction', rb1: 'Bi-directional; claims full performance up to ±45° to wind; designed for turbulent urban flows', rb2: 'Same', notes: 'Stationary (doesn’t yaw).' },
        { item: 'Overspeed / survivability', rb1: 'Aerodynamic self-limiting; tested in 100+ mph winds', rb2: 'Same', notes: 'Company claims “full capacity at high winds” and self-regulated rotor speed.' },
        { item: 'Core principle', rb1: 'Aeolian wind-focus at the roof ridge accelerates flow over the ridge', rb2: 'Same', notes: '“≈3×” speed at ridge, implying up to ~9× available energy vs free-stream, per vendor.' }
      ],
      applications: [
        'Residential pitched roofs needing discreet, low-profile micro-wind. (RB1)',
        'Commercial/industrial buildings with long ridgelines or flat roofs (hybrid PV + RidgeBlade frames). (RB2 / Hybrid units)',
        'Agricultural structures such as barns/greenhouses with large roof spans.',
        'Government, sensitive, emergency, and military sites where low visual/noise impact and modular deployment matter.'
      ],
      preInstallationChecklist: {
        windResource: [
          'Average annual wind: small wind becomes practical around ≥ 4.5 m/s (≈10 mph) at hub height; turbulence can lower output 15–25%. Validate with maps/assessments—do not rely on nameplate alone.',
          'Roof exposure: ridgelines, hilltops, coastal sites perform better; nearby obstacles increase turbulence (affects energy and fatigue).'
        ],
        roofAndStructure: [
          'Roof pitch, length, and material: verify ridge length (e.g., 6.5 m for 5 modules), pitch compatibility, and attachment method (unistrut/proprietary).',
          'Structural loading & anchorage: rooftop equipment must meet ASCE 7 wind-load/uplift; check local building codes and use engineered attachment details.',
          'Waterproofing & access: penetrations, flashing, and safe maintenance access.'
        ],
        electricalAndInterconnection: [
          'Inverter/controls: choose grid-tie or battery system that meets local interconnect (IEEE 1547/utility rules) and the site’s voltage/phase.',
          'Net metering / rate plan: confirm compensation and export limits with your utility.'
        ],
        permittingAndCommunity: [
          'Zoning/HOA/planning: although low-profile, rooftop wind may still require permits; show noise and visual profiles. (Vendor positions it as “planning-friendly.”)',
          'Wind/hazard exposure: in hurricane/coastal zones, verify design loads and attachment per code; FEMA highlights rooftop-equipment failures from poor anchorage/corrosion.'
        ],
        performanceExpectations: [
          'Energy realism: vendor claims (e.g., “3× ridge speed,” very low start-up speeds) are site-dependent; model annual kWh using measured/estimated wind at your roof and consider seasonal patterns.',
          'Hybrid strategy: pairing with flat-roof PV (Hybrid Solar Units) evens seasonal output (wind at night/winter, solar by day/summer).'
        ]
      },
      howItWorks: 'RidgeBlade places a modular, low-profile turbine along the roof ridge. As wind flows over a pitched roof, it naturally accelerates at the ridge “pinch point” (the Aeolian wind-focus effect). By placing the rotor in this high-velocity zone, the turbine can tap higher effective wind speeds than the free-stream around the house. The design is bi-directional (no yawing), claims useful output across a ±45° wind-angle window, and self-limits rotor speed aerodynamically in storms. The company reports testing in 100+ mph winds. In practice, energy yield still depends on your site’s real wind and turbulence, plus roof geometry and array length.'
    }
  },
  financial: {
    costPerWatt: {
      solar: 3.0, // Average cost per watt for residential solar
    },
    avgElectricityCost: 0.17, // Average cost per kWh in the US
  },
  environmental: {
    gridCo2Factor: 0.85, // lbs of CO2 per kWh, US average
    epaEquivalents: {
      milesDriven: "1 metric ton of CO2 is equivalent to about 2,451 miles driven by an average gasoline-powered passenger vehicle.",
      carsOffRoad: "1 metric ton of CO2 is equivalent to the emissions from 0.22 gasoline-powered passenger vehicles driven for one year.",
      seedlingsGrown: "1 metric ton of CO2 is equivalent to the carbon sequestered by 16.5 tree seedlings grown for 10 years.",
    },
  },
  providers: {
    geothermal: ["TRANE", "ClimateMaster", "WaterFurnace"],
  },
  materials: {
    hempcrete: {
      description: "A bio-composite material made from hemp hurd and lime. It's an excellent insulator, fire-resistant, and carbon-negative. Best for new builds or major retrofits.",
    },
    aac: {
      description: "Autoclaved Aerated Concrete is a lightweight, precast, foam concrete. It provides structure, insulation, and fire resistance in one material. Good for both new builds and additions.",
    },
    highPerformanceWindows: {
      description: "Triple-pane windows with low-E coatings and insulated frames can significantly reduce heating and cooling costs. A great upgrade for older properties.",
    },
  },
};