
export interface FinancingItem {
  title: string;
  summary: string;
  linkText: string;
  url: string;
  tags?: string[];
  stateScoped?: boolean;
}

export interface FinancingSection {
  id: "grants-rebates" | "state-federal" | "loans-financing";
  title: string;
  items: FinancingItem[];
}

export const FINANCING_DATA: FinancingSection[] = [
  {
    id: "grants-rebates",
    title: "Grants & Rebates",
    items: [
      {
        title: "DSIRE – Database of State Incentives for Renewables & Efficiency",
        summary: "The most complete database of clean-energy & efficiency incentives. Search by ZIP/state and filter by technology (solar, HVAC, insulation, appliances, etc.).",
        linkText: "dsireusa.org",
        url: "https://www.dsireusa.org/",
        tags: ["Homeowner", "Business", "Developer", "Community", "Policymaker"],
        stateScoped: true,
      },
      {
        title: "ENERGY STAR® Rebate Finder",
        summary: "Enter your ZIP to see retail/utility rebates for ENERGY STAR heat pumps, water heaters, washers/dryers, smart thermostats, windows, and more.",
        linkText: "energystar.gov/rebate-finder",
        url: "https://www.energystar.gov/rebate-finder",
        tags: ["Homeowner", "Developer"],
        stateScoped: true,
      },
      {
        title: "DOE Home Energy Rebates (HOMES & HEAR)",
        summary: "State-run rebates for whole-home efficiency and electrification (e.g., up to $8,000 for heat pumps, $4,000 for panel upgrades; caps vary by state and income). Use the portal to check your state’s status.",
        linkText: "Energy Savings Hub – Check Status",
        url: "https://www.energy.gov/save/home-energy-rebates-and-tax-credits",
        tags: ["Homeowner", "Low-income"],
        stateScoped: true,
      },
      {
        title: "Weatherization Assistance Program (WAP)",
        summary: "Free/low-cost weatherization (air sealing, insulation, HVAC tune-ups) administered locally for income-eligible households.",
        linkText: "How to apply",
        url: "https://www.energy.gov/scep/weatherization-assistance-program",
        tags: ["Homeowner", "Low-income"],
        stateScoped: true,
      },
    ],
  },
  {
    id: "state-federal",
    title: "State & Federal Incentives & Grants",
    items: [
      {
        title: "Residential Clean Energy Credit (IRC §25D) – 30%",
        summary: "A 30% tax credit through 2032 (then phases down) for solar, battery storage (≥3 kWh), geothermal, wind, and more. Claimed on IRS Form 5695.",
        linkText: "IRS explainer: Residential Clean Energy Credit",
        url: "https://www.irs.gov/credits-deductions/residential-clean-energy-credit",
        tags: ["Homeowner"],
      },
      {
        title: "Energy Efficient Home Improvement Credit (IRC §25C)",
        summary: "Annual credit for qualifying efficiency upgrades (e.g., heat pump HVAC/water heaters, windows/doors, insulation). Claimed on Form 5695.",
        linkText: "DOE overview & “How to claim” flow",
        url: "https://www.energy.gov/policy/articles/making-our-homes-more-efficient-clean-energy-tax-credits-consumers",
        tags: ["Homeowner"],
      },
      {
        title: "Energy-Efficient Commercial Buildings Deduction (IRC §179D)",
        summary: "Deduction for qualified efficiency measures in commercial buildings (claimed via Form 7205; amounts indexed and depend on savings and wage/apprenticeship compliance).",
        linkText: "IRS – Instructions for Form 7205",
        url: "https://www.irs.gov/instructions/i7205",
        tags: ["Business", "Developer", "Policymaker"],
      },
      {
        title: "New Energy Efficient Home Credit (IRC §45L)",
        summary: "For eligible contractors: up to $5,000 per home (Energy Star / DOE Zero Energy Ready tiers).",
        linkText: "IRS – 45L credit",
        url: "https://www.irs.gov/credits-deductions/new-energy-efficient-home-credit",
        tags: ["Developer"],
      },
      {
        title: "USDA Rural Energy for America Program (REAP)",
        summary: "Grants/guaranteed loans for agricultural producers & rural small businesses to install renewables and efficiency measures.",
        linkText: "USDA REAP",
        url: "https://www.rd.usda.gov/programs-services/energy-programs/rural-energy-america-program-renewable-energy-systems-energy-efficiency-improvement-guaranteed-loans-grants",
        tags: ["Business"],
      },
    ],
  },
  {
    id: "loans-financing",
    title: "Loans & Financing Options",
    items: [
      {
        title: "C-PACE (Commercial Property Assessed Clean Energy)",
        summary: "Long-term, fixed-rate financing repaid via a property tax assessment; can fund HVAC, envelope, solar, resiliency, and even new construction capital stacks in many states.",
        linkText: "DOE toolkit & fact sheet",
        url: "https://betterbuildingssolutioncenter.energy.gov/toolkits/commercial-property-assessed-clean-energy-c-pace",
        tags: ["Business", "Developer", "Policymaker"],
      },
      {
        title: "On-Bill Financing/Repayment (OBF/OBR)",
        summary: "Finance upgrades and repay on the utility bill; tariffed models are tied to the meter, not the customer, and many programs report very low default rates.",
        linkText: "ACEEE overview: On-Bill Energy Efficiency",
        url: "https://www.aceee.org/topics/bill-energy-efficiency-programs",
        tags: ["Homeowner", "Business"],
      },
      {
        title: "SBA 504 “Green” Projects",
        summary: "Long-term, fixed-rate financing for major assets; energy-related projects can qualify, and SBA removed aggregate caps to expand clean-energy lending.",
        linkText: "Program page: SBA 504 Loans",
        url: "https://www.sba.gov/funding-programs/loans/504-loans",
        tags: ["Business"],
      },
      {
        title: "Fannie Mae & Freddie Mac – Multifamily “Green”",
        summary: "Fannie Mae Green Rewards offers a lower interest rate + extra proceeds for energy/water savings. Freddie Mac Green Advantage offers better pricing with documented savings.",
        linkText: "Fannie Mae Green Rewards",
        url: "https://multifamily.fanniemae.com/financing-options/specialty-financing/green-financing",
        tags: ["Developer", "Business"],
      },
      {
        title: "Power Purchase Agreements (PPAs)/Leases & RECs",
        summary: "Businesses can use PPAs or leases to avoid upfront capital; projects may also generate RECs (or SRECs in some states) that can be sold for revenue.",
        linkText: "EPA: Green Power Pricing (PPAs overview)",
        url: "https://www.epa.gov/green-power-markets/green-power-partnership-pricing-and-purchasing-options",
        tags: ["Business", "Developer", "Community", "Policymaker"],
      },
      {
        title: "Fannie Mae HomeStyle® Energy Mortgage",
        summary: "Roll energy upgrades (or pay off PACE) into your mortgage; can finance up to 15% of the as-completed value.",
        linkText: "Consumer page: HomeStyle Energy",
        url: "https://www.fanniemae.com/mortgage-lenders/homestyle-energy",
        tags: ["Homeowner"],
      },
      {
        title: "Freddie Mac GreenCHOICE® Mortgage",
        summary: "Finance energy/water efficiency improvements (up to 15% of as-completed value) with flexible LTVs.",
        linkText: "GreenCHOICE Mortgage",
        url: "https://sf.freddiemac.com/working-with-us/origination-underwriting/mortgage-products/greenchoice-mortgages",
        tags: ["Homeowner"],
      },
      {
        title: "FHA 203(k) Rehabilitation Mortgage",
        summary: "FHA-insured purchase/refi that bundles renovations; eligible projects can include energy-efficiency measures.",
        linkText: "HUD 203(k)",
        url: "https://www.hud.gov/program_offices/housing/sfh/203k/203k--df",
        tags: ["Homeowner"],
      },
    ],
  },
];
