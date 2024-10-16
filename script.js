// Emission factors (kg CO2e per unit)
const emissionFactors = {
  // Transport (per km)
  car: 0.192,
  "electric-car": 0.053,
  "hybrid-car": 0.106,
  bus: 0.105,
  bike: 0,
  walk: 0,
  // Energy (per kWh)
  coal: 0.995,
  "natural-gas": 0.572,
  solar: 0.058,
  wind: 0.011,
  // Heating (per kWh)
  "heating-gas": 0.203,
  "heating-electric": 0.233,
  "heating-oil": 0.275,
  // Waste (per kg)
  waste: 0.586,
  // Diet (per day)
  omnivore: 3.3,
  vegetarian: 1.7,
  vegan: 1.5,
  // Water (per liter)
  water: 0.000298,
  // Company-specific (per unit specified in form)
  "company-electricity": 0.5, // per kWh
  "company-fuel": 2.68, // per liter
  "company-waste": 0.586, // per kg
  "company-fleet": 0.192, // per km (assuming average car)
  "company-shipping": 0.1, // per ton-km (assuming truck transport)
};

let historicalData = [];

// Function to calculate individual emissions
function calculateIndividualEmissions(formData) {
  let transportEmissions = 0;
  let electricityEmissions = 0;
  let heatingEmissions = 0;
  let wasteEmissions = 0;
  let dietEmissions = 0;
  let waterEmissions = 0;

  // Calculate transport emissions
  const distance = parseFloat(formData.get("distance"));
  const vehicleType = formData.get("vehicle-type");
  const frequency = formData.get("frequency");
  const daysPerYear =
    frequency === "daily" ? 365 : frequency === "weekly" ? 52 : 12;
  transportEmissions = distance * emissionFactors[vehicleType] * daysPerYear;

  // Calculate electricity emissions
  const electricity = parseFloat(formData.get("electricity"));
  const energySource = formData.get("energy-source");
  electricityEmissions = electricity * emissionFactors[energySource] * 12; // Assuming monthly input

  // Calculate heating emissions
  const heatingUsage = parseFloat(formData.get("heating-usage"));
  const heatingType = formData.get("heating-type");
  heatingEmissions =
    heatingUsage * emissionFactors[`heating-${heatingType}`] * 12; // Assuming monthly input

  // Calculate waste emissions
  const wasteAmount = parseFloat(formData.get("waste-amount"));
  wasteEmissions = wasteAmount * emissionFactors.waste * 52; // Assuming weekly input
  if (formData.get("recycling")) wasteEmissions *= 0.7; // 30% reduction for recycling
  if (formData.get("composting")) wasteEmissions *= 0.8; // 20% reduction for composting

  // Calculate diet emissions
  const diet = formData.get("diet");
  dietEmissions = emissionFactors[diet] * 365; // Yearly emissions

  // Calculate water emissions
  const waterUsage = parseFloat(formData.get("water-usage"));
  waterEmissions = waterUsage * emissionFactors.water * 365; // Yearly emissions

  return {
    transport: transportEmissions,
    electricity: electricityEmissions,
    heating: heatingEmissions,
    waste: wasteEmissions,
    diet: dietEmissions,
    water: waterEmissions,
  };
}

// Function to calculate company emissions
function calculateCompanyEmissions(formData) {
  let operationsEmissions = 0;
  let logisticsEmissions = 0;
  let supplyChainEmissions = 0;

  // Calculate operations emissions
  const electricityUsage = parseFloat(formData.get("electricity-usage"));
  const fuelConsumption = parseFloat(formData.get("fuel-consumption"));
  const wasteProduction = parseFloat(formData.get("waste-production"));
  operationsEmissions =
    (electricityUsage * emissionFactors["company-electricity"] +
      fuelConsumption * emissionFactors["company-fuel"] +
      wasteProduction * emissionFactors["company-waste"]) *
    12; // Yearly emissions

  // Calculate logistics emissions
  const fleetSize = parseFloat(formData.get("vehicle-fleet"));
  const fleetMileage = parseFloat(formData.get("fleet-mileage"));
  const shippingWeight = parseFloat(formData.get("shipping-weight"));
  logisticsEmissions =
    (fleetSize * fleetMileage * emissionFactors["company-fleet"] +
      shippingWeight * emissionFactors["company-shipping"]) *
    12; // Yearly emissions

  // Calculate supply chain emissions (if provided)
  const upstreamEmissions = parseFloat(formData.get("upstream-emissions")) || 0;
  const downstreamEmissions =
    parseFloat(formData.get("downstream-emissions")) || 0;
  supplyChainEmissions = (upstreamEmissions + downstreamEmissions) * 1000; // Convert to kg CO2e

  return {
    operations: operationsEmissions,
    logistics: logisticsEmissions,
    supplyChain: supplyChainEmissions,
  };
}

// Function to generate insights
function generateInsights(emissions, userType) {
  let insights =
    "Here are some ways you could reduce your carbon footprint:\n\n";

  if (userType === "individual") {
    if (emissions.transport > 1000) {
      insights +=
        "- Consider using public transport, carpooling, or switching to an electric vehicle to reduce your transport emissions.\n";
    }
    if (emissions.electricity > 2000) {
      insights +=
        "- Try to reduce your electricity consumption or switch to a renewable energy provider.\n";
    }
    if (emissions.heating > 2000) {
      insights +=
        "- Improve your home's insulation or consider a more efficient heating system.\n";
    }
    if (emissions.waste > 500) {
      insights +=
        "- Increase your recycling and composting efforts to reduce waste emissions.\n";
    }
    if (emissions.diet > 1000) {
      insights +=
        "- Consider reducing your meat consumption or trying a more plant-based diet to lower your dietary emissions.\n";
    }
    if (emissions.water > 100) {
      insights +=
        "- Try to reduce your water consumption, especially hot water usage.\n";
    }
  } else {
    if (emissions.operations > 10000) {
      insights +=
        "- Look into energy efficiency measures for your operations and consider renewable energy sources.\n";
    }
    if (emissions.logistics > 5000) {
      insights +=
        "- Optimize your logistics network and consider low-emission or electric vehicles for your fleet.\n";
    }
    if (emissions.supplyChain > 20000) {
      insights +=
        "- Work with your suppliers and customers to reduce emissions throughout your supply chain.\n";
    }
  }

  return insights;
}

// Function to update charts
function updateCharts(emissions, userType) {
  const ctx = document.getElementById("emissions-chart").getContext("2d");
  const historyCtx = document
    .getElementById("historical-chart")
    .getContext("2d");

  // Destroy existing charts if they exist
  if (window.emissionsChart instanceof Chart) {
    window.emissionsChart.destroy();
  }
  if (window.historicalChart instanceof Chart) {
    window.historicalChart.destroy();
  }

  // Create new emissions breakdown chart
  window.emissionsChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(emissions),
      datasets: [
        {
          data: Object.values(emissions),
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Carbon Footprint Breakdown",
        },
        legend: {
          position: "bottom",
        },
      },
    },
  });

  // Update historical data
  const totalEmissions = Object.values(emissions).reduce(
    (sum, val) => sum + val,
    0
  );
  historicalData.push({ date: new Date(), emissions: totalEmissions });

  // Create new historical chart
  window.historicalChart = new Chart(historyCtx, {
    type: "line",
    data: {
      labels: historicalData.map((d) => d.date.toLocaleDateString()),
      datasets: [
        {
          label: "Total Emissions",
          data: historicalData.map((d) => d.emissions),
          fill: false,
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Historical Emissions Trend",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "kg CO2e",
          },
        },
      },
    },
  });
}

// Event listeners for user type selection
document
  .getElementById("individual-btn")
  .addEventListener("click", function () {
    document.getElementById("individual-form").classList.remove("hidden");
    document.getElementById("company-form").classList.add("hidden");
  });

document.getElementById("company-btn").addEventListener("click", function () {
  document.getElementById("company-form").classList.remove("hidden");
  document.getElementById("individual-form").classList.add("hidden");
});

// Event listener for individual form submission
document
  .getElementById("individual-carbon-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const emissions = calculateIndividualEmissions(formData);
    const totalEmissions = Object.values(emissions).reduce(
      (sum, val) => sum + val,
      0
    );

    // Update results section
    document.getElementById(
      "total-emissions"
    ).textContent = `Your total yearly carbon footprint: ${totalEmissions.toFixed(
      2
    )} kg CO2e`;
    document.getElementById("results-section").classList.remove("hidden");

    // Generate and display insights
    const insights = generateInsights(emissions, "individual");
    document.getElementById("insights").textContent = insights;

    // Update charts
    updateCharts(emissions, "individual");
  });

// Event listener for company form submission
document
  .getElementById("company-carbon-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const emissions = calculateCompanyEmissions(formData);
    const totalEmissions = Object.values(emissions).reduce(
      (sum, val) => sum + val,
      0
    );

    // Update results section
    document.getElementById(
      "total-emissions"
    ).textContent = `Your company's total yearly carbon footprint: ${totalEmissions.toFixed(
      2
    )} kg CO2e`;
    document.getElementById("results-section").classList.remove("hidden");

    // Generate and display insights
    const insights = generateInsights(emissions, "company");
    document.getElementById("insights").textContent = insights;

    // Update charts
    updateCharts(emissions, "company");
  });

// Function to reset forms and results
function resetCalculator() {
  document.getElementById("individual-carbon-form").reset();
  document.getElementById("company-carbon-form").reset();
  document.getElementById("results-section").classList.add("hidden");
  historicalData = [];
}

// Add event listener for reset functionality (you can add a reset button in HTML)
document.getElementById("reset-btn").addEventListener("click", resetCalculator);
