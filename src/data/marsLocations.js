import {
  Droplet,
  Sun,
  Mountain,
  Wind,
  AlertTriangle,
  Radio,
  Navigation,
  Compass,
  ShieldCheck,
  Activity,
  Layers,
  Thermometer,
  Zap,
  Target,
  FileText
} from 'lucide-react';

export const MARS_LOCATIONS = {
  proposed_base: {
    id: 'proposed_base',
    name: 'Proposed Base Site',
    subtitle: 'Primary human landing and permanent habitat zone in Chryse Planitia.',
    coords: { lat: '14.6° N', lng: '32.3° E', elev: '-2,450 m' },
    coordsText: '14.6° N, 32.3° E',
    elevationVal: '-2,450 m',
    elevationNum: -2450,
    distanceKm: '324 km',
    rockType: 'Basaltic Regolith',
    solarExposure: 'High (5.8 kWh/m²/day)',
    waterIce: 'High probability (Subsurface 1.2m)',
    satelliteImg: '/assets/crater_satellite_thumb.jpg',
    landscapeImg: '/assets/mars_base_site.jpg',
    desc: 'Selected for its favorable flat terrain, shallow subsurface ice sheets confirmed by SHARAD radar, and optimal equatorial solar insolation for human habitation modules.',
    chartX: 390,
    chartY: 119,
    insights: [
      { icon: Droplet, title: 'Water Ice (Subsurface)', desc: 'High probability (1.2m depth)' },
      { icon: Sun, title: 'Solar Exposure', desc: 'Good (5.8 kWh/m²/day)' },
      { icon: Mountain, title: 'Favorable Terrain', desc: 'Slope < 4°, low boulder density' },
      { icon: Wind, title: 'Low Dust Activity', desc: 'Moderate seasonal dust drift' }
    ],
    terrain: {
      summary: 'Relatively smooth, low-relief alluvial plain with fine regolith and sparse boulders. Optimal for human outpost landing and surface vehicle traverses.',
      roughness: '0.14 (Low roughness)',
      maxSlope: '< 3.5° (Gentle ramp)',
      traverseLimit: '5.2 km',
      elevationRange: '-2,450 m to -2,380 m'
    },
    resources: {
      summary: 'SHARAD radar detects shallow buried sheet ice within 1.2m of surface. High solar insolation provides 5.8 kWh/m²/day for habitat photovoltaic arrays.',
      primaryMineral: 'Basaltic Regolith & Smectites',
      leadInstrument: 'SHARAD Radar & MRO HiRISE',
      waterHydration: 'High (Subsurface sheet at 1.2m)',
      isruPotential: 'Optimal (Water extraction & Base fuel)'
    },
    hazards: {
      summary: 'Moderate seasonal dust drift from Acidalia. Low seismic activity and smooth terrain present minimal mobility risk for astronauts.',
      radiationLevel: '0.21 mSv/day (Nominal GCR)',
      riskLevel: 'Low (Sheltered Plains)',
      thermalSwings: '-78°C to -12°C',
      atmosphericPressure: '620 Pa (Nominal)'
    }
  },
  olympus: {
    id: 'olympus',
    name: 'Olympus Mons',
    subtitle: 'The largest volcano in the Solar System, rising 21.3 km high.',
    coords: { lat: '18.7° N', lng: '133.8° W', elev: '21,287 m' },
    coordsText: '18.7° N, 133.8° W',
    elevationVal: '21,287 m',
    elevationNum: 21287,
    distanceKm: '1,420 km',
    rockType: 'Tholeiitic Basalt',
    solarExposure: 'Exceptional (Above 90% atmosphere)',
    waterIce: 'Trace (Atmospheric frost)',
    satelliteImg: '/assets/olympus_mons.jpg',
    landscapeImg: '/assets/olympus_mons.jpg',
    desc: 'Towering shield volcano featuring multi-tiered caldera depressions and subterranean lava tube skylights providing natural radiation shielding for human exploration.',
    chartX: 70,
    chartY: 28,
    insights: [
      { icon: Mountain, title: 'Extreme Altitude', desc: 'Above 90% of Mars atmosphere' },
      { icon: Sun, title: 'Solar Insolation', desc: 'Exceptional (6.4 kWh/m²/day)' },
      { icon: Wind, title: 'Lava Tubes', desc: 'Natural radiation shielding' },
      { icon: Droplet, title: 'Summit Frost', desc: 'Transient morning water vapor' }
    ],
    terrain: {
      summary: 'Colossal shield volcano flank with multi-tiered basalt lava flow terraces and scarp drops up to 6 km. Lava tube collapse pits offer subterranean access.',
      roughness: '0.38 (High scree & basalt blocks)',
      maxSlope: '7.8° (Flank ramp) / 32° (Basal Scarp)',
      traverseLimit: '3.2 km',
      elevationRange: '+18,500 m to +21,287 m'
    },
    resources: {
      summary: 'Pristine tholeiitic basalt samples and volcanic glass. Unfiltered solar radiation above 90% of the atmosphere yields peak solar flux of 6.4 kWh/m²/day.',
      primaryMineral: 'Tholeiitic Basalt & Olivine',
      leadInstrument: 'THEMIS IR & HRSC Altimeter',
      waterHydration: 'Trace (Morning summit frost)',
      isruPotential: 'High (Solar power & Basalt construction)'
    },
    hazards: {
      summary: 'Extreme near-vacuum atmospheric pressure (30 Pa) and heightened cosmic radiation due to negligible atmospheric overburden. Micro-meteoroid exposure.',
      radiationLevel: '0.48 mSv/day (High - Summit)',
      riskLevel: 'High (Altitude & Near-Vacuum)',
      thermalSwings: '-105°C to -25°C',
      atmosphericPressure: '30 Pa (Near Vacuum)'
    }
  },
  valles: {
    id: 'valles',
    name: 'Valles Marineris',
    subtitle: 'Colossal tectonic rift chasm stretching over 4,000 km across the equator.',
    coords: { lat: '14.0° S', lng: '59.3° W', elev: '-7,000 m' },
    coordsText: '14.0° S, 59.3° W',
    elevationVal: '-7,000 m',
    elevationNum: -7000,
    distanceKm: '880 km',
    rockType: 'Stratified Basaltic Layers',
    solarExposure: 'Moderate (Chasm shaded)',
    waterIce: 'Moderate (Deep canyon floor vapor)',
    satelliteImg: '/assets/valles_marineris.jpg',
    landscapeImg: '/assets/valles_marineris.jpg',
    desc: 'The grand canyon of Mars spanning equatorial depths with maximum surface atmospheric pressure (~750 Pa) and billions of years of exposed geologic stratigraphy.',
    chartX: 280,
    chartY: 135,
    insights: [
      { icon: Wind, title: 'Atmospheric Pressure', desc: 'Highest on Martian surface (~750 Pa)' },
      { icon: Mountain, title: 'Exposed Stratigraphy', desc: '3+ billion years of layered crust' },
      { icon: Droplet, title: 'Morning Fog / Frost', desc: 'Transient canyon floor vapor' },
      { icon: Sun, title: 'Thermal Moderation', desc: 'Shielded deep chasms' }
    ],
    terrain: {
      summary: 'Rift canyon walls plunging 7 km down to vast chasm floors. Terraced landslides, layered basalt strata, and canyon chasmata with localized sand dunes.',
      roughness: '0.45 (Canyon scree & talus slopes)',
      maxSlope: '24.5° (Wall gullies) / 4° (Floor)',
      traverseLimit: '4.0 km',
      elevationRange: '-7,000 m to -2,500 m'
    },
    resources: {
      summary: '3+ billion years of exposed crustal stratigraphy. CRISM confirms hydrated sulfates and clays. Morning canyon fog and frost condense in deep shadowed alcoves.',
      primaryMineral: 'Layered Basalt & Hydrated Sulfates',
      leadInstrument: 'MRO CRISM & HiRISE',
      waterHydration: 'Moderate (Deep chasm hydrated clays)',
      isruPotential: 'High (Structural stone & Mineral water)'
    },
    hazards: {
      summary: 'Steep scree slopes and frequent localized rockfalls. However, dense canyon atmosphere (~750 Pa) provides natural radiation shielding (+34%).',
      radiationLevel: '0.14 mSv/day (Shielded Chasm Floor)',
      riskLevel: 'Moderate (Slope & Rockfall)',
      thermalSwings: '-65°C to +2°C (Milder)',
      atmosphericPressure: '750 Pa (Highest on Mars)'
    }
  },
  jezero: {
    id: 'jezero',
    name: 'Jezero Crater',
    subtitle: 'Ancient river delta lake basin with prime biosignature preservation deposits.',
    coords: { lat: '18.4° N', lng: '77.6° E', elev: '-2,500 m' },
    coordsText: '18.4° N, 77.6° E',
    elevationVal: '-2,500 m',
    elevationNum: -2500,
    distanceKm: '610 km',
    rockType: 'Clay & Carbonate Sediments',
    solarExposure: 'Good (5.6 kWh/m²/day)',
    waterIce: 'Hydrated Phyllosilicates',
    satelliteImg: '/assets/jezero_crater.jpg',
    landscapeImg: '/assets/jezero_crater.jpg',
    desc: 'Ancient open-basin lake explored by Perseverance with confirmed lacustrine mudstone beds, deltaic front sedimentary fans, and cached core samples ready for astronaut collection.',
    chartX: 350,
    chartY: 112,
    insights: [
      { icon: Droplet, title: 'River Delta Fan', desc: 'Prime biosignature preservation' },
      { icon: Mountain, title: 'Carbonate Minerals', desc: 'Aqueous chemical indicators' },
      { icon: Sun, title: 'Solar Exposure', desc: 'Good (5.6 kWh/m²/day)' },
      { icon: Wind, title: 'Sample Depot', desc: '10 cached rock cores ready for pickup' }
    ],
    terrain: {
      summary: 'Crater floor containing a prominent ancient river delta fan with layered lacustrine mudstone terraces and scattered boulder conglomerates.',
      roughness: '0.22 (Sedimentary terraces)',
      maxSlope: '8.5° (Delta front scarp)',
      traverseLimit: '5.0 km',
      elevationRange: '-2,500 m to -2,350 m'
    },
    resources: {
      summary: 'High-priority astrobiology target. Lacustrine clays and carbonates preserve ancient organic molecules and biosignatures. 10 cached titanium sample tubes deposited by Perseverance.',
      primaryMineral: 'Mg-Carbonates & Smectite Clays',
      leadInstrument: 'Perseverance SuperCam & Mastcam-Z',
      waterHydration: 'Hydrated Phyllosilicates (Aqueous record)',
      isruPotential: 'Exceptional (Cached samples & Carbonate ISRU)'
    },
    hazards: {
      summary: 'Delta scarp edge drops and soft sand ripples along Neretva Vallis inlet. Predictable wind currents and low boulder interference.',
      radiationLevel: '0.20 mSv/day (Nominal)',
      riskLevel: 'Low to Moderate',
      thermalSwings: '-84°C to -18°C',
      atmosphericPressure: '610 Pa (Nominal)'
    }
  },
  gale: {
    id: 'gale',
    name: 'Gale Crater (Mount Sharp)',
    subtitle: 'Layered sediment mound featuring 2025 Curiosity boxwork formations.',
    coords: { lat: '5.4° S', lng: '137.8° E', elev: '-4,500 m' },
    coordsText: '5.4° S, 137.8° E',
    elevationVal: '-4,500 m',
    elevationNum: -4500,
    distanceKm: '940 km',
    rockType: 'Sulfate & Clay Mudstone',
    solarExposure: 'Good (5.7 kWh/m²/day)',
    waterIce: 'Hydrated Magnesium Sulfates',
    satelliteImg: '/assets/gale_crater.jpg',
    landscapeImg: '/assets/gale_crater.jpg',
    desc: 'Traverse site of Curiosity documenting ancient habitable lakes and continuous sediment stratification up Mount Sharp, featuring the newly studied boxwork mineral networks.',
    chartX: 430,
    chartY: 126,
    insights: [
      { icon: Mountain, title: 'Boxwork Formations', desc: 'Mineral fracture web studied in 2025' },
      { icon: Droplet, title: 'Mount Sharp Strata', desc: '5 km continuous aqueous timeline' },
      { icon: Sun, title: 'Organics Preserved', desc: 'Aromatics & sulfur compounds detected' },
      { icon: Wind, title: 'Habitability Window', desc: 'Prolonged groundwater era' }
    ],
    terrain: {
      summary: 'Impact basin centered on Mount Sharp (Aeolis Mons), a 5 km tall sediment mound featuring boxwork fracture ridges and ancient lake sediment terraces.',
      roughness: '0.28 (Eroded mudstone & ridges)',
      maxSlope: '12.4° (Boxwork ridge face)',
      traverseLimit: '3.8 km',
      elevationRange: '-4,500 m to -3,800 m'
    },
    resources: {
      summary: 'Boxwork mineral networks formed by prolonged groundwater percolation in 2025 Curiosity study. Magnesium and calcium sulfates hold key to ancient Martian climate transitions.',
      primaryMineral: 'Hydrated Mg/Ca Sulfates & Clays',
      leadInstrument: 'Curiosity ChemCam / Mastcam & CRISM',
      waterHydration: 'High (Hydrated sulfate minerals)',
      isruPotential: 'High (Sulfate water & Soil stabilizers)'
    },
    hazards: {
      summary: 'Sharp yardang terrain and fractured boxwork knife-edge ridges. Wheel abrasion risk on rover tires; astronauts require tether lines on upper slopes.',
      radiationLevel: '0.19 mSv/day (Lower slope)',
      riskLevel: 'Moderate (Ridge Incline)',
      thermalSwings: '-80°C to -14°C',
      atmosphericPressure: '630 Pa (Nominal)'
    }
  },
  waypoint_2: {
    id: 'waypoint_2',
    name: 'Highland Relay Alpha',
    subtitle: 'Highland reconnaissance outpost and line-of-sight communication relay.',
    coords: { lat: '16.2° N', lng: '44.8° E', elev: '-1,120 m' },
    coordsText: '16.2° N, 44.8° E',
    elevationVal: '-1,120 m',
    elevationNum: -1120,
    distanceKm: '185 km',
    rockType: 'Volcanic Breccia',
    solarExposure: 'High (5.9 kWh/m²/day)',
    waterIce: 'Low (Regolith bonded)',
    satelliteImg: '/assets/crater_satellite_thumb.jpg',
    landscapeImg: '/assets/mars_expanded_terrain.jpg',
    desc: 'Intermediate highland plateau staging post along the northern perimeter with line-of-sight orbital relay coverage to MRO and Odyssey orbiters.',
    chartX: 200,
    chartY: 82,
    insights: [
      { icon: Mountain, title: 'Highland Plateau', desc: 'Elevated strategic vantage' },
      { icon: Sun, title: 'Direct Line of Sight', desc: 'Unobstructed comm relay to orbiters' },
      { icon: Wind, title: 'Moderate Winds', desc: 'Stable atmospheric profile' },
      { icon: Droplet, title: 'Dry Regolith', desc: 'Solid foundation for high-gain antenna' }
    ],
    terrain: {
      summary: 'Elevated plateau with solid volcanic breccia pavement, providing 360° unobstructed line-of-sight across Chryse Basin.',
      roughness: '0.19 (Solid bedrock plateau)',
      maxSlope: '2.8° (Flat mesa)',
      traverseLimit: '3.5 km',
      elevationRange: '-1,120 m to -1,080 m'
    },
    resources: {
      summary: 'Volcanic breccia foundation suitable for heavy high-gain radio arrays and laser comm towers. High direct solar exposure (5.9 kWh/m²/day).',
      primaryMineral: 'Impact Breccia & Basaltic Sand',
      leadInstrument: 'MRO HiRISE & Relay Link Telemetry',
      waterHydration: 'Low (Dry bedrock)',
      isruPotential: 'Moderate (Telecom & Station base)'
    },
    hazards: {
      summary: 'Open exposure to thermal winds crossing plateau edge. Low boulder density ensures zero rover entrapment risk.',
      radiationLevel: '0.22 mSv/day',
      riskLevel: 'Low',
      thermalSwings: '-79°C to -15°C',
      atmosphericPressure: '580 Pa'
    }
  },
  rover_01: {
    id: 'rover_01',
    name: 'Pressurized Rover 01',
    subtitle: 'Heavy crew transport vehicle with mobile airlock and core sample storage.',
    coords: { lat: '11.8° S', lng: '52.1° W', elev: '-6,200 m' },
    coordsText: '11.8° S, 52.1° W',
    elevationVal: '-6,200 m',
    elevationNum: -6200,
    distanceKm: '412 km',
    rockType: 'Layered Smectite Clay',
    solarExposure: 'Moderate (Chasm shaded)',
    waterIce: 'Detected (Hydrated minerals)',
    satelliteImg: '/assets/valles_marineris.jpg',
    landscapeImg: '/assets/mars_expanded_terrain.jpg',
    desc: 'Pressurized crew transport supporting 2 astronauts for up to 14 days, equipped with autonomous obstacle avoidance, rock corer, and high-capacity battery pack.',
    chartX: 250,
    chartY: 130,
    insights: [
      { icon: Mountain, title: 'Traverse Capability', desc: 'Handles slopes up to 25°' },
      { icon: Droplet, title: 'Life Support Relay', desc: 'Emergency O2 & power docking' },
      { icon: Sun, title: 'Fuel Cell & Solar', desc: 'Range: 80 km per charge' },
      { icon: Wind, title: 'Autonomous Scout', desc: 'LiDAR pathfinding enabled' }
    ],
    terrain: {
      summary: 'Mobile heavy exploration vehicle capable of scaling 25° grades, traversing 0.8m boulders, and crossing 80 km per battery charge.',
      roughness: 'High mobility (6-wheel independent rocker-bogie)',
      maxSlope: '25.0° (Traverse capability)',
      traverseLimit: '80.0 km',
      elevationRange: '-7,000 m to -2,000 m'
    },
    resources: {
      summary: 'Equipped with onboard rock-coring drill, hermetic sample carousel, atmospheric methane sniffer, and 12 kWh auxiliary power output.',
      primaryMineral: 'Sample Processing & Core Caching',
      leadInstrument: 'LiDAR Scout, Micro-Drill, APXS',
      waterHydration: 'Onboard Life-Support Recycler (98% efficiency)',
      isruPotential: 'Field Laboratory & Core Cache Depot'
    },
    hazards: {
      summary: 'Provides pressurized cabin environment (1 atm equivalent) with polyethylene radiation shielding blankets protecting crew during solar particle events.',
      radiationLevel: '0.08 mSv/day (Cabin Shielded)',
      riskLevel: 'Nominal Life-Support Safe Zone',
      thermalSwings: '+21°C internal cabin regulated',
      atmosphericPressure: '101.3 kPa (Pressurized Cabin)'
    }
  },
  drone_02: {
    id: 'drone_02',
    name: 'Hexacopter Drone 02',
    subtitle: 'Autonomous aerial scout providing real-time HiRISE-scale pathfinding.',
    coords: { lat: '17.1° N', lng: '68.4° E', elev: '-1,850 m' },
    coordsText: '17.1° N, 68.4° E',
    elevationVal: '-1,850 m',
    elevationNum: -1850,
    distanceKm: '520 km',
    rockType: 'Crater Ejecta Melt',
    solarExposure: 'High (6.1 kWh/m²/day)',
    waterIce: 'Shallow Permafrost',
    satelliteImg: '/assets/jezero_crater.jpg',
    landscapeImg: '/assets/mars_expanded_terrain.jpg',
    desc: 'Successor to Ingenuity rotorcraft, providing 5cm/pixel forward scouting for Marswalk crew to spot boulder fields, scarp drops, and soft sand drifts in advance.',
    chartX: 320,
    chartY: 98,
    insights: [
      { icon: Mountain, title: 'Forward Scout', desc: 'Pre-flight route clearance' },
      { icon: Sun, title: 'Solar Wing Recharge', desc: 'Fast turnaround charging' },
      { icon: Wind, title: 'Dual Rotor Lift', desc: 'Operates in 650 Pa CO2 atmosphere' },
      { icon: Droplet, title: 'Multispectral Camera', desc: 'Identifies hydrated surface minerals' }
    ],
    terrain: {
      summary: 'Aerial rotorcraft flying up to 25 meters altitude at 12 m/s. Generates 5 cm/pixel digital elevation models of forward traverse paths.',
      roughness: 'Aerial (Bypasses all ground obstacles)',
      maxSlope: 'N/A (Aerial flight envelope)',
      traverseLimit: '2.4 km flight radius per sortie',
      elevationRange: 'Ground to +30 m AGL'
    },
    resources: {
      summary: 'Multispectral downward camera detects hydrated mineral outcroppings, identifying optimal sampling targets prior to astronaut foot deployment.',
      primaryMineral: 'Hyperspectral Aerial Survey',
      leadInstrument: 'Dual Stereo Navigation & Multispectral VIS/NIR',
      waterHydration: 'Thermal Inertia Water-Ice Detection',
      isruPotential: 'Forward Route & Resource Prospecting'
    },
    hazards: {
      summary: 'Subject to high-altitude wind shear and atmospheric dust density reductions during dust storm season. Autonomous forced landing if rotor RPM exceeds limit.',
      radiationLevel: '0.22 mSv/day',
      riskLevel: 'Low (Uncrewed Asset)',
      thermalSwings: '-85°C to -20°C',
      atmosphericPressure: '650 Pa (Aero lift baseline)'
    }
  },
  planum_boreum: {
    id: 'planum_boreum',
    name: 'Planum Boreum (North Polar Cap)',
    subtitle: 'Vast water-ice cap layered with atmospheric dust recording 5M years of climate history.',
    coords: { lat: '85.0° N', lng: '0.0° E', elev: '-2,100 m' },
    coordsText: '85.0° N, 0.0° E',
    elevationVal: '-2,100 m',
    elevationNum: -2100,
    distanceKm: '2,840 km',
    rockType: 'Perennial H2O Ice & Basaltic Dust',
    solarExposure: 'Low / Seasonal (Continuous Summer Sun)',
    waterIce: '99.5% Pure Water Ice Sheet (3 km thick)',
    satelliteImg: '/assets/planum_boreum.jpg',
    landscapeImg: '/assets/planum_boreum.jpg',
    desc: 'Martian northern polar dome spanning 1,000 km, composed of stacked water-ice layers cut by Chasma Boreale. Primary candidate for long-term astronaut ISRU water extraction.',
    chartX: 480,
    chartY: 20,
    insights: [
      { icon: Droplet, title: 'Massive Water Ice', desc: 'Estimated 1.6 million km³ of pure ice' },
      { icon: Thermometer, title: 'Cryogenic Climate', desc: 'Summer -60°C, Winter drops to -125°C' },
      { icon: Mountain, title: 'Spiral Troughs', desc: 'Katabatic wind-sculpted canyon terraces' },
      { icon: Wind, title: 'Dust Stratigraphy', desc: 'Continuous astronomical cycle record' }
    ],
    terrain: {
      summary: 'Massive dome of pure water ice and dust strata cut by radial spiral troughs and the deep chasm of Chasma Boreale. Sastrugi snowdrifts and ice terraces.',
      roughness: '0.16 (Glacial ice sheet with dunes)',
      maxSlope: '6.0° (Trough terraces)',
      traverseLimit: '8.0 km',
      elevationRange: '-2,100 m to -1,800 m'
    },
    resources: {
      summary: 'Estimated 1.6 million km³ of 99.5% pure water ice. Ultimate planetary ISRU reservoir for drinking water, oxygen generation, and hydrogen fuel production.',
      primaryMineral: 'Pure Water Ice (H2O) & Polar Dust',
      leadInstrument: 'SHARAD Radar & MARCI Weather',
      waterHydration: '99.5% Solid Water Ice (3 km thick)',
      isruPotential: 'Maximum Planetary Value (Endless H2O)'
    },
    hazards: {
      summary: 'Extreme cryogenic temperatures down to -125°C. High-velocity seasonal katabatic winds descending from polar summit. Thermal suit life-support critical.',
      radiationLevel: '0.26 mSv/day (Open Polar Horizon)',
      riskLevel: 'High (Cryogenic Cold & Polar Storms)',
      thermalSwings: '-125°C to -55°C (Extreme Cold)',
      atmosphericPressure: '580 Pa'
    }
  },
  korolev: {
    id: 'korolev',
    name: 'Korolev Crater Ice Mound',
    subtitle: '81-kilometer impact basin harboring a permanent 1.8-kilometer-thick water ice shield.',
    coords: { lat: '73.0° N', lng: '165.0° E', elev: '-3,900 m' },
    coordsText: '73.0° N, 165.0° E',
    elevationVal: '-3,900 m',
    elevationNum: -3900,
    distanceKm: '3,110 km',
    rockType: 'Clean Perennial Water Ice Shield',
    solarExposure: 'Seasonal (Low solar elevation)',
    waterIce: 'High (2,200 km³ perennial ice deposit)',
    satelliteImg: '/assets/korolev_crater.jpg',
    landscapeImg: '/assets/korolev_crater.jpg',
    desc: 'Deep impact crater functioning as a natural cold trap; air passing over the ice cools and sinks, forming a permanent protective layer that prevents ice sublimation year-round.',
    chartX: 520,
    chartY: 35,
    insights: [
      { icon: Droplet, title: 'Natural Cold Trap', desc: 'Air thermal inversion preserves pure ice' },
      { icon: Mountain, title: '1.8 km Ice Dome', desc: 'Thick domed reservoir filling crater floor' },
      { icon: ShieldCheck, title: 'ISRU Reservoir', desc: 'Readily accessible surface water for crew' },
      { icon: Wind, title: 'Katabatic Shielding', desc: 'Thermal buffer protects from dust storms' }
    ],
    terrain: {
      summary: 'Circular 81 km impact basin filled to its brim with a permanent, domed shield of water ice 1.8 km thick. Surrounded by smooth ejecta plains.',
      roughness: '0.12 (Polished cold-trap ice dome)',
      maxSlope: '< 2.5° (Ice dome crown)',
      traverseLimit: '7.5 km',
      elevationRange: '-3,900 m to -2,100 m'
    },
    resources: {
      summary: 'Cold-trap physics maintains 2,200 km³ of pristine water ice year-round. Air thermal inversion prevents sublimation, enabling open-pit ice harvesting.',
      primaryMineral: 'Pristine Glacial Water Ice',
      leadInstrument: 'Mars Express HRSC & THEMIS IR',
      waterHydration: '100% Surface Accessible Ice',
      isruPotential: 'Premier High-Yield Water Mine'
    },
    hazards: {
      summary: 'Perpetual sub-zero cold (-110°C to -40°C) and micro-fractures in ice surface. Low surface friction requires spiked suit crampons and spiked rover tires.',
      radiationLevel: '0.22 mSv/day',
      riskLevel: 'Moderate (Low Traction / Extreme Cold)',
      thermalSwings: '-110°C to -40°C',
      atmosphericPressure: '640 Pa'
    }
  },
  ascraeus: {
    id: 'ascraeus',
    name: 'Ascraeus Mons',
    subtitle: 'Northernmost and second tallest volcano of the Tharsis Montes triad, rising 18.2 km.',
    coords: { lat: '11.9° N', lng: '104.5° W', elev: '18,225 m' },
    coordsText: '11.9° N, 104.5° W',
    elevationVal: '18,225 m',
    elevationNum: 18225,
    distanceKm: '1,180 km',
    rockType: 'Tholeiitic Shield Basalt',
    solarExposure: 'Exceptional (Above 85% atmosphere)',
    waterIce: 'Orographic Morning Water Clouds',
    satelliteImg: '/assets/ascraeus_mons.jpg',
    landscapeImg: '/assets/ascraeus_mons.jpg',
    desc: 'Towering shield volcano featuring complex nested calderas and expansive low-viscosity lava flow aprons, often capped by bright morning water-ice clouds in the northern spring.',
    chartX: 130,
    chartY: 45,
    insights: [
      { icon: Mountain, title: 'Caldera Complex', desc: 'Multi-stage collapse depressions' },
      { icon: Sun, title: 'High Solar Flux', desc: 'Clean insolation for solar array recharge' },
      { icon: Droplet, title: 'Orographic Clouds', desc: 'Transient water-ice crystal clouds' },
      { icon: Wind, title: 'Lava Flow Aprons', desc: 'Low-slope volcanic access ramps' }
    ],
    terrain: {
      summary: 'Majestic volcanic shield with 8 nested collapse calderas spanning 24 km wide. Gentle flank slopes aproned with overlapping sheet basalt flows.',
      roughness: '0.32 (Volcanic pahoehoe slabs)',
      maxSlope: '6.5° (Flank ramp) / 28° (Caldera wall)',
      traverseLimit: '4.2 km',
      elevationRange: '+14,000 m to +18,225 m'
    },
    resources: {
      summary: 'Pristine shield basalts, pyroxene phenocrysts, and high-altitude solar flux (6.2 kWh/m²/day). Morning orographic water-ice cloud condensation.',
      primaryMineral: 'Tholeiitic Basalt & Pyroxene',
      leadInstrument: 'THEMIS IR & HRSC Stereo',
      waterHydration: 'Trace (Daily orographic vapor)',
      isruPotential: 'High (Solar power & Refractory minerals)'
    },
    hazards: {
      summary: 'Thin upper atmosphere (85 Pa). Increased solar proton and galactic cosmic ray flux. Caldera cliff collapses.',
      radiationLevel: '0.41 mSv/day (Elevated)',
      riskLevel: 'Moderate to High (Altitude)',
      thermalSwings: '-98°C to -22°C',
      atmosphericPressure: '85 Pa'
    }
  },
  tharsis_tubes: {
    id: 'tharsis_tubes',
    name: 'Tharsis Lava Tube Skylights',
    subtitle: 'Subsurface volcanic conduits providing natural radiation shielding and habitat volume.',
    coords: { lat: '14.2° N', lng: '112.8° W', elev: '6,400 m' },
    coordsText: '14.2° N, 112.8° W',
    elevationVal: '6,400 m',
    elevationNum: 6400,
    distanceKm: '1,050 km',
    rockType: 'Vesicular Basalt Overhangs',
    solarExposure: 'External Solar / Shielded Interior',
    waterIce: 'Deep Subsurface Trapped Ice Potential',
    satelliteImg: '/assets/tharsis_tubes.jpg',
    landscapeImg: '/assets/tharsis_tubes.jpg',
    desc: 'Collapsed ceiling pit craters leading into cavernous lava tubes spanning hundreds of meters wide. Natural rock ceiling absorbs cosmic rays and micrometeoroids.',
    chartX: 110,
    chartY: 55,
    insights: [
      { icon: ShieldCheck, title: 'Radiation Shielding', desc: '10+ meters of basalt bedrock overhead' },
      { icon: Thermometer, title: 'Thermal Stability', desc: 'Interior stays steady at ~ -45°C' },
      { icon: Mountain, title: 'Natural Caverns', desc: 'Vast volume for habitat modules' },
      { icon: Wind, title: 'Zero Dust Ingress', desc: 'Protected from surface dust storms' }
    ],
    terrain: {
      summary: 'Subterranean basaltic conduits and lava tubes up to 250 meters wide with stable arched ceilings. Vertical pit crater skylights provide crew entry points.',
      roughness: '0.20 (Cavern basalt floor)',
      maxSlope: '3.0° (Tube floor) / 90° (Skylight drop)',
      traverseLimit: '6.0 km (Subterranean)',
      elevationRange: '+6,200 m to +6,400 m'
    },
    resources: {
      summary: 'Pristine unweathered volcanic minerals, basaltic rock structural material, and potential trapped subterranean ice deposits protected from sunlight.',
      primaryMineral: 'Dense Vesicular Basalt & Zeolites',
      leadInstrument: 'HiRISE Pit Recon & SHARAD Subsurface',
      waterHydration: 'Moderate (Deep subterranean ice cold trap)',
      isruPotential: 'Maximum (Ready-made habitat volume)'
    },
    hazards: {
      summary: 'Zero surface weather inside tubes: 100% shielded from dust storms, micro-meteoroids, and cosmic rays. Requires artificial illumination and rappelling gear.',
      radiationLevel: '0.03 mSv/day (95% Natural Shielding)',
      riskLevel: 'Low (Safest habitat on Mars)',
      thermalSwings: '-48°C to -42°C (Ultra-stable)',
      atmosphericPressure: '220 Pa (Can be pressurized)'
    }
  }
};

export const getLocationById = (id) => {
  return MARS_LOCATIONS[id] || MARS_LOCATIONS.proposed_base;
};

// -----------------------------------------------------------------------------
// NASA SCIENCE MISSIONS & EVA SCENARIOS
// -----------------------------------------------------------------------------
export const NASA_MISSIONS = [
  {
    id: 'gale_boxwork',
    name: 'Gale Crater: Mount Sharp Boxwork Expedition',
    badge: 'Curiosity MSL Data',
    sol: 'Sol 689',
    objective: 'Survey and sample the 2025 boxwork mineral ridge formations to determine how long groundwater flowed on Mars.',
    targetLocationId: 'gale',
    evaDuration: '5h 15m',
    distanceTraverse: '3.8 km',
    primaryMineral: 'Hydrated Magnesium & Calcium Sulfates',
    leadInstrument: 'Curiosity ChemCam / Mastcam & MRO CRISM',
    riskLevel: 'Moderate (Ridge Incline 12°)',
    detailedObjectives: [
      'Ascend lower Mount Sharp to the 2025 Curiosity sulfate transition zone.',
      'Conduct LIBS laser interrogation on 4 boxwork fracture intersections.',
      'Extract and hermetically seal 2 micro-drill core tubes of mineralized veins.',
      'Maintain continuous UHF line-of-sight link with Pressurized Rover 01.',
      'Enforce strict BUMP Point of Safe Return before consumables fall below 35% reserve.'
    ],
    assignedCrew: 'EVA-1 (Dr. Vance - Coring Lead), EVA-2 (Cmdr. Rivera - Safety & Comms)',
    supportAssets: 'Pressurized Rover 01 (Heavy Mobile Lab) & Hexacopter Drone 02',
    payload: 'Diamond Core Micro-Drill, Handheld XRF Spectrometer, Multispectral Visor Lens',
    radiationEnv: '0.19 mSv/hr (Nominal GCR background; No solar flare event)',
    maxSlope: '12.4° (Sulfate Ridge Face)',
    keyInsights: [
      'Groundwater epoch extended into the Hesperian-Amazonian transition.',
      'Boxwork cementation preserved delicate organic sulfur signatures.',
      'Naturally shielded terrain reduces GCR exposure along north-facing scarps.'
    ]
  },
  {
    id: 'jezero_sample',
    name: 'Jezero Delta: Biosignature Sample Depot Retrieval',
    badge: 'Perseverance M2020 Data',
    sol: 'Sol 742',
    objective: 'Rendezvous with Perseverance Sample Depot "Three Forks" to collect cached core samples of deltaic mudstone.',
    targetLocationId: 'jezero',
    evaDuration: '4h 30m',
    distanceTraverse: '2.9 km',
    primaryMineral: 'Smectite Clays & Carbonates',
    leadInstrument: 'Perseverance SuperCam / SHERLOC & HiRISE DTM',
    riskLevel: 'Low (Flat Delta Floor)',
    detailedObjectives: [
      'Traverse Western Delta fan along flat lacustrine sediment floor.',
      'Inspect and catalog 10 hermetic titanium sample tubes at Three Forks Depot.',
      'Retrieve Sample Tubes #05 and #08 into rover cryogenic storage racks.',
      'Survey Kodiak Butte scarp for lacustrine shoreline stratification.',
      'Verify zero rover wheel entrapment across localized sand ripples.'
    ],
    assignedCrew: 'EVA-1 (Cmdr. Rivera - Depot Lead), EVA-2 (Dr. Vance - Sample Custodian)',
    supportAssets: 'Pressurized Rover 01 & Autonomous Sample Return Container',
    payload: 'Sample Gripper Arm, Deep-UV Raman Spectrometer, Ground-Penetrating Radar',
    radiationEnv: '0.22 mSv/hr (Open Basin Exposure)',
    maxSlope: '4.1° (Level Delta Plain)',
    keyInsights: [
      'Confirmed lacustrine mudstone beds with highest biosignature preservation potential.',
      'Carbonate minerals indicate benign pH water conditions in ancient Jezero Lake.',
      'Cached cores ready for transfer into Earth Ascent Vehicle (EAV).'
    ]
  },
  {
    id: 'olympus_shelter',
    name: 'Olympus Mons: Lava Tube Habitat Reconnaissance',
    badge: 'MRO / Odyssey SHARAD Data',
    sol: 'Sol 805',
    objective: 'Inspect collapsed lava tube skylight as a permanent human habitat candidate with natural radiation shielding.',
    targetLocationId: 'olympus',
    evaDuration: '6h 00m',
    distanceTraverse: '5.1 km',
    primaryMineral: 'Tholeiitic Basalt & Volcanic Glass',
    leadInstrument: 'MGS MOLA & Odyssey THEMIS Infrared',
    riskLevel: 'High (Caldera Escarpment)',
    detailedObjectives: [
      'Approach Alba Patera skylight rim and secure tether anchor lines.',
      'Deploy autonomous LiDAR drop probe into the subterranean tube interior.',
      'Measure cosmic ray dose attenuation inside the lava tube void (expect >80% reduction).',
      'Assess structural ceiling thickness and basaltic roof integrity using ultrasound.',
      'Map level staging area for modular habitat expansion.'
    ],
    assignedCrew: 'EVA-1 (Dr. Vance - Speleology Lead), EVA-2 (Cmdr. Rivera - Rigging & Safety)',
    supportAssets: 'Heavy Pressurized Rover 01 & Tether Winch Deployment Platform',
    payload: 'RAD Dosimeter, 3D Cave LiDAR Scanner, High-Tensile Anchor Rig',
    radiationEnv: '0.04 mSv/hr inside tube (vs. 0.24 mSv/hr on caldera rim)',
    maxSlope: '14.8° (Caldera Rim Approach)',
    keyInsights: [
      'Subterranean void spans 250m width with natural 40m thick basaltic roof shielding.',
      'Radiation levels attenuated to safe Earth-equivalent background levels.',
      'Micro-climate moderates extreme surface diurnal temperature swings.'
    ]
  }
];

// Helper to normalize coordinates string or number into [lat, lng] float values
export function parseLatLng(latVal, lngVal) {
  if (typeof latVal === 'number' && typeof lngVal === 'number') {
    return [latVal, lngVal];
  }
  const latStr = String(latVal || '0');
  const lngStr = String(lngVal || '0');
  const lat = parseFloat(latStr) * (latStr.includes('S') ? -1 : 1);
  const lng = parseFloat(lngStr) * (lngStr.includes('W') ? -1 : 1);
  return [isNaN(lat) ? 0 : lat, isNaN(lng) ? 0 : lng];
}

// -----------------------------------------------------------------------------
// SMART MISSION ROUTES (Tactical Hazard-Aware Paths from Base to Objectives)
// -----------------------------------------------------------------------------
export const SMART_MISSION_ROUTES = {
  gale_boxwork: {
    missionId: 'gale_boxwork',
    name: 'Mount Sharp Boxwork Traverse',
    base: {
      id: 'base_bradbury',
      name: 'Bradbury Landing Base',
      type: 'base',
      coords: { lat: '4.59° S', lng: '137.44° E', elev: '-4,450 m' },
      lat: -4.59,
      lng: 137.44,
      desc: 'Curiosity Touchdown Base Station & Primary Hab'
    },
    waypoints: [
      {
        id: 'gale_wp_1',
        name: 'WP-1: Yellowknife Bay',
        type: 'waypoint',
        coords: { lat: '4.63° S', lng: '137.42° E', elev: '-4,480 m' },
        lat: -4.63,
        lng: 137.42,
        desc: 'Ancient lacustrine mudstone bed; flat terrain'
      },
      {
        id: 'gale_wp_2',
        name: 'WP-2: Dingo Gap Dune Pass',
        type: 'corridor',
        coords: { lat: '4.68° S', lng: '137.39° E', elev: '-4,410 m' },
        lat: -4.68,
        lng: 137.39,
        desc: 'Low-hazard sand saddle crossing (<4° slope)'
      },
      {
        id: 'gale_wp_3',
        name: 'WP-3: Murray Buttes Gateway',
        type: 'waypoint',
        coords: { lat: '4.72° S', lng: '137.37° E', elev: '-4,320 m' },
        lat: -4.72,
        lng: 137.37,
        desc: 'Sheltered canyon path through layered sandstone mesas'
      }
    ],
    objective: {
      id: 'gale_obj',
      name: 'Mount Sharp Boxwork Ridge',
      type: 'objective',
      coords: { lat: '4.76° S', lng: '137.35° E', elev: '-3,850 m' },
      lat: -4.76,
      lng: 137.35,
      desc: 'Primary Mission Target: 2025 Mineralized Boxwork Ridge'
    }
  },
  jezero_sample: {
    missionId: 'jezero_sample',
    name: 'Jezero Delta Sample Retrieval Route',
    base: {
      id: 'base_butler',
      name: 'Octavia E. Butler Base',
      type: 'base',
      coords: { lat: '18.44° N', lng: '77.45° E', elev: '-2,560 m' },
      lat: 18.44,
      lng: 77.45,
      desc: 'Perseverance Landing Site & Forward Operations Base'
    },
    waypoints: [
      {
        id: 'jezero_wp_1',
        name: 'WP-1: Séítah Passage',
        type: 'corridor',
        coords: { lat: '18.42° N', lng: '77.42° E', elev: '-2,550 m' },
        lat: 18.42,
        lng: 77.42,
        desc: 'Solid basaltic bedrock corridor avoiding sand ripples'
      },
      {
        id: 'jezero_wp_2',
        name: 'WP-2: Kodiak Butte Bench',
        type: 'waypoint',
        coords: { lat: '18.40° N', lng: '77.39° E', elev: '-2,540 m' },
        lat: 18.40,
        lng: 77.39,
        desc: 'Ancient lake shoreline bench and delta overlook'
      },
      {
        id: 'jezero_wp_3',
        name: 'WP-3: Delta Scarp Staging Ramp',
        type: 'waypoint',
        coords: { lat: '18.39° N', lng: '77.37° E', elev: '-2,530 m' },
        lat: 18.39,
        lng: 77.37,
        desc: 'Gentle incline ramp leading up to river delta fan'
      }
    ],
    objective: {
      id: 'jezero_obj',
      name: 'Three Forks Sample Depot',
      type: 'objective',
      coords: { lat: '18.38° N', lng: '77.35° E', elev: '-2,520 m' },
      lat: 18.38,
      lng: 77.35,
      desc: 'Primary Mission Target: Cached Hermetic Titanium Core Tubes'
    }
  },
  olympus_shelter: {
    missionId: 'olympus_shelter',
    name: 'Olympus Mons Lava Tube Recon Route',
    base: {
      id: 'base_ares',
      name: 'Ares Base Alpha',
      type: 'base',
      coords: { lat: '18.65° N', lng: '133.80° W', elev: '+1,200 m' },
      lat: 18.65,
      lng: -133.80,
      desc: 'Permanent Habitat Staging Base on Olympus Plateau'
    },
    waypoints: [
      {
        id: 'olympus_wp_1',
        name: 'WP-1: Basal Scarp Overlook',
        type: 'waypoint',
        coords: { lat: '18.52° N', lng: '133.95° W', elev: '+1,120 m' },
        lat: 18.52,
        lng: -133.95,
        desc: 'Geodetic survey bench avoiding sheer 6 km scarp drop'
      },
      {
        id: 'olympus_wp_2',
        name: 'WP-2: Pahoehoe Flow Corridor',
        type: 'corridor',
        coords: { lat: '18.38° N', lng: '134.12° W', elev: '+1,050 m' },
        lat: 18.38,
        lng: -134.12,
        desc: 'Ultra-low slope basaltic sheet corridor (<3° incline)'
      },
      {
        id: 'olympus_wp_3',
        name: 'WP-3: Lava Trench Sector',
        type: 'waypoint',
        coords: { lat: '18.25° N', lng: '134.25° W', elev: '+960 m' },
        lat: 18.25,
        lng: -134.25,
        desc: 'Staging area at collapsed lava channel depression'
      }
    ],
    objective: {
      id: 'olympus_obj',
      name: 'Alba Lava Tube Skylight',
      type: 'objective',
      coords: { lat: '18.15° N', lng: '134.38° W', elev: '+850 m' },
      lat: 18.15,
      lng: -134.38,
      desc: 'Primary Mission Target: 250m-wide radiation-shielded cavern entrance'
    }
  }
};

/**
 * Builds a smart route from a mission's base station through tactical waypoints
 * to the mission objective, plus any dynamically added secondary objectives.
 */
export function getSmartMissionRoute(mission, addedObjectives = []) {
  if (!mission) return null;
  const missionConfig = SMART_MISSION_ROUTES[mission.id];
  let base, waypoints, objective;

  if (missionConfig) {
    base = missionConfig.base;
    waypoints = [...missionConfig.waypoints];
    objective = missionConfig.objective;
  } else {
    // Dynamic generation from default base to mission target
    const targetLoc = getLocationById(mission.targetLocationId || mission.id) || MARS_LOCATIONS.proposed_base;
    const [tLat, tLng] = parseLatLng(targetLoc.coords?.lat || '0', targetLoc.coords?.lng || '0');
    base = {
      id: 'dynamic_base',
      name: 'Chryse Base Alpha',
      type: 'base',
      coords: { lat: '14.6° N', lng: '32.3° E' },
      lat: 14.6,
      lng: 32.3,
      desc: 'Human Landing & Habitat Base'
    };
    waypoints = [
      {
        id: 'dyn_wp_1',
        name: 'WP-1: Corridor Transit',
        type: 'corridor',
        lat: (14.6 + tLat) * 0.6,
        lng: (32.3 + tLng) * 0.6,
        desc: 'Slope hazard avoidance route'
      },
      {
        id: 'dyn_wp_2',
        name: 'WP-2: Approach Vector',
        type: 'waypoint',
        lat: (14.6 + tLat) * 0.3 + tLat * 0.7,
        lng: (32.3 + tLng) * 0.3 + tLng * 0.7,
        desc: 'Low-incline staging waypoint'
      }
    ];
    objective = {
      id: targetLoc.id,
      name: `${targetLoc.name} (Primary Objective)`,
      type: 'objective',
      coords: targetLoc.coords,
      lat: tLat,
      lng: tLng,
      desc: `Mission Objective: ${mission.objective || targetLoc.name}`
    };
  }

  // Parse dynamically added secondary objectives
  const parsedAdded = (addedObjectives || []).map((obj, idx) => {
    let [lat, lng] = [0, 0];
    if (typeof obj.lat === 'number' && typeof obj.lng === 'number') {
      lat = obj.lat;
      lng = obj.lng;
    } else if (obj.coords?.lat && obj.coords?.lng) {
      [lat, lng] = parseLatLng(obj.coords.lat, obj.coords.lng);
    }
    return {
      id: obj.id || `added_obj_${idx}`,
      name: obj.name || `Secondary Objective #${idx + 1}`,
      type: 'added_objective',
      lat,
      lng,
      coords: obj.coords || { lat: `${lat.toFixed(2)}°`, lng: `${lng.toFixed(2)}°` },
      desc: obj.subtitle || obj.desc || 'Secondary Expedition Objective'
    };
  });

  const allNodes = [base, ...waypoints, objective, ...parsedAdded];
  const polylineCoords = allNodes.map((n) => [n.lat, n.lng]);

  return {
    missionId: mission.id,
    missionName: mission.name,
    base,
    waypoints,
    objective,
    addedObjectives: parsedAdded,
    allNodes,
    polylineCoords
  };
}

// -----------------------------------------------------------------------------
// SCIENCE WAYPOINTS (Hyperlocalized Targets)
// -----------------------------------------------------------------------------
export const SCIENCE_WAYPOINTS = [
  {
    id: 'wp_boxwork_01',
    name: 'Boxwork Ridge Alpha (Curiosity 2025)',
    category: 'Boxwork',
    locationId: 'gale',
    locationName: 'Gale Crater / Mount Sharp',
    coords: '5.38° S, 137.82° E',
    elevation: '-4,120 m',
    slope: '8.4° (Safe)',
    image: '/assets/gale_crater.jpg',
    povImg: '/assets/mars_expanded_terrain.jpg',
    scienceGoal: 'Sample mineralized fracture webs formed during Mars groundwater recession.',
    minerals: ['Hydrated Calcium Sulfate', 'Gypsum', 'Jarosite'],
    instrumentNeeded: 'Handheld XRF & Diamond Core Micro-Drill',
    priority: 'Critical',
    sampleStatus: 'Uncollected',
    radiationDose: '0.19 mSv/hr'
  },
  {
    id: 'wp_delta_mudstone',
    name: 'Jezero Delta Mudstone Bed (Kodiak Butte)',
    category: 'River Delta',
    locationId: 'jezero',
    locationName: 'Jezero Crater Delta',
    coords: '18.44° N, 77.45° E',
    elevation: '-2,520 m',
    slope: '4.1° (Flat)',
    image: '/assets/jezero_crater.jpg',
    povImg: '/assets/mars_base_site.jpg',
    scienceGoal: 'Examine lacustrine mudstone preserving microscopic organic biosignatures.',
    minerals: ['Smectite Clays', 'Iron Carbonate', 'Silica'],
    instrumentNeeded: 'Deep-UV Raman Spectrometer (SHERLOC Equivalent)',
    priority: 'Critical',
    sampleStatus: 'Tube Cached',
    radiationDose: '0.22 mSv/hr'
  },
  {
    id: 'wp_lava_tube',
    name: 'Alba Patera Skylight Entrance',
    category: 'Lava Tubes',
    locationId: 'olympus',
    locationName: 'Olympus Mons Highland',
    coords: '18.62° N, 133.74° W',
    elevation: '+18,400 m',
    slope: '14.8° (Caution)',
    image: '/assets/olympus_mons.jpg',
    povImg: '/assets/mars_expanded_terrain.jpg',
    scienceGoal: 'Measure cosmic ray attenuation inside collapsed volcanic subterranean tube.',
    minerals: ['Dense Vesicular Basalt', 'Olivine', 'Pyroxene'],
    instrumentNeeded: 'RAD Dosimeter & Ground Penetrating LiDAR',
    priority: 'High',
    sampleStatus: 'Survey Only',
    radiationDose: '0.04 mSv/hr (Shielded!)'
  },
  {
    id: 'wp_subsurface_ice',
    name: 'Chryse Planitia Glacial Lens',
    category: 'Water Ice',
    locationId: 'proposed_base',
    locationName: 'Proposed Base Site',
    coords: '14.58° N, 32.28° E',
    elevation: '-2,450 m',
    slope: '2.0° (Level)',
    image: '/assets/crater_satellite_thumb.jpg',
    povImg: '/assets/mars_base_site.jpg',
    scienceGoal: 'Drill 1.5m core to assess potable water yield for habitat life support.',
    minerals: ['Water Ice (92% purity)', 'Perchlorate Regolith', 'Ferric Oxide'],
    instrumentNeeded: 'Percussive Thermal Auger',
    priority: 'High',
    sampleStatus: 'Tested',
    radiationDose: '0.21 mSv/hr'
  },
  {
    id: 'wp_chasm_strata',
    name: 'Coprates Chasma Wall Strata',
    category: 'Deep Strata',
    locationId: 'valles',
    locationName: 'Valles Marineris',
    coords: '14.12° S, 59.18° W',
    elevation: '-6,800 m',
    slope: '17.2° (No-Go for walk; Rover arm survey)',
    image: '/assets/valles_marineris.jpg',
    povImg: '/assets/valles_marineris.jpg',
    scienceGoal: 'Trace atmospheric pressure gradient and continuous crustal layering.',
    minerals: ['Layered Sulfates', 'Opaline Silica', 'Hematite'],
    instrumentNeeded: 'Long-Range Telescopic ChemCam',
    priority: 'Medium',
    sampleStatus: 'Remote Scanned',
    radiationDose: '0.17 mSv/hr'
  }
];

// -----------------------------------------------------------------------------
// EVA TRAVERSE ROUTE LEGS (The Logistics & Consumables Model)
// -----------------------------------------------------------------------------
export const EVA_ROUTE_LEGS = [
  {
    id: 'leg_01',
    name: 'Airlock Egress ➔ Staging Beacon',
    distance: '650 m',
    distKm: 0.65,
    slope: '2.4° (Flat)',
    slopeStatus: 'safe',
    timeEst: '25 min',
    o2Used: '4.2%',
    batteryUsed: '5.0%',
    desc: 'Leave Habitat Airlock 1, verify suit pressure (29.6 kPa), deploy telemetry relay.'
  },
  {
    id: 'leg_02',
    name: 'Staging Beacon ➔ Mount Sharp Lower Incline',
    distance: '1,200 m',
    distKm: 1.2,
    slope: '6.8° (Gentle)',
    slopeStatus: 'safe',
    timeEst: '48 min',
    o2Used: '9.5%',
    batteryUsed: '11.0%',
    desc: 'Cross low-roughness basaltic regolith along pre-cleared rover wheel tracks.'
  },
  {
    id: 'leg_03',
    name: 'Lower Incline ➔ Boxwork Ridge Alpha (Primary Target)',
    distance: '950 m',
    distKm: 0.95,
    slope: '12.4° (Moderate climb)',
    slopeStatus: 'caution',
    timeEst: '55 min',
    o2Used: '14.8%',
    batteryUsed: '16.5%',
    desc: 'Ascend sulfate ridge face. Walking speed throttled to 1.1 km/h to limit metabolic rate.'
  },
  {
    id: 'leg_04',
    name: 'Boxwork Ridge Alpha ➔ Walkback Threshold Marker',
    distance: '400 m',
    distKm: 0.4,
    slope: '7.1° (Ridge contour)',
    slopeStatus: 'safe',
    timeEst: '22 min',
    o2Used: '5.1%',
    batteryUsed: '6.0%',
    desc: 'Point of Safe Return: crew must initiate return if consumables drop below 35% reserve.'
  },
  {
    id: 'leg_05',
    name: 'Threshold Marker ➔ Habitat Return Traverse',
    distance: '1,800 m',
    distKm: 1.8,
    slope: '3.5° (Downhill / Level)',
    slopeStatus: 'safe',
    timeEst: '1h 10m',
    o2Used: '12.0%',
    batteryUsed: '14.0%',
    desc: 'Return to habitat base with 8 sealed sample tubes loaded onto Pressurized Rover rack.'
  }
];

// -----------------------------------------------------------------------------
// MULTI-MISSION NASA DATA LAYERS
// -----------------------------------------------------------------------------
export const NASA_DATA_LAYERS = [
  {
    id: 'layer_hirise',
    name: 'HiRISE Optical Visible Surface',
    mission: 'Mars Reconnaissance Orbiter (MRO)',
    type: 'Optical',
    resolution: '0.25 m / pixel',
    spectralBand: 'Red & Blue-Green (0.4 - 1.0 µm)',
    description: 'Ultra-high-resolution visible imagery showing boulders down to 1 meter, sand ripples, and wheel tracks.',
    status: 'Active',
    defaultOpacity: 100,
    badgeColor: '#E05A32'
  },
  {
    id: 'layer_mola',
    name: 'MOLA Topography & Slope Contours',
    mission: 'Mars Global Surveyor (MGS)',
    type: 'Topographic / Altimetry',
    resolution: '128 pixels / degree (~460 m)',
    spectralBand: '1064 nm Nd:YAG Laser',
    description: 'Precision digital elevation model calculating terrain gradient. Identifies impassable slopes (>15°).',
    status: 'Active',
    defaultOpacity: 80,
    badgeColor: '#4A90E2'
  },
  {
    id: 'layer_crism',
    name: 'CRISM Spectral Mineralogy',
    mission: 'Mars Reconnaissance Orbiter (MRO)',
    type: 'Spectral / Chemical',
    resolution: '18 m / pixel',
    spectralBand: '0.36 - 3.92 µm (544 channels)',
    description: 'Fingerprints clays (phyllosilicates), carbonates, and sulfates indicating ancient aqueous environments.',
    status: 'Active',
    defaultOpacity: 75,
    badgeColor: '#27AE60'
  },
  {
    id: 'layer_themis',
    name: 'THEMIS Thermal Inertia',
    mission: '2001 Mars Odyssey',
    type: 'Thermal Infrared',
    resolution: '100 m / pixel',
    spectralBand: '9 infrared bands (6.8 - 14.9 µm)',
    description: 'Differentiates solid load-bearing bedrock (high inertia, warm at night) from soft sinking dust traps.',
    status: 'Active',
    defaultOpacity: 60,
    badgeColor: '#F39C12'
  },
  {
    id: 'layer_rad',
    name: 'MSL RAD Surface Radiation Field',
    mission: 'Curiosity Mars Science Lab',
    type: 'Radiation & Space Weather',
    resolution: 'Point sensor interpolated',
    spectralBand: 'Charged particles & neutrons (GCR + SPE)',
    description: 'Real-time dosimeter quantifying Galactic Cosmic Ray dosage and identifying natural topography shielding.',
    status: 'Active',
    defaultOpacity: 50,
    badgeColor: '#9B59B6'
  },
  {
    id: 'layer_sharad',
    name: 'SHARAD Shallow Subsurface Radar',
    mission: 'Mars Reconnaissance Orbiter (MRO)',
    type: 'Geophysical Radar',
    resolution: '15 m vertical resolution',
    spectralBand: '15 - 25 MHz RF pulse',
    description: 'Penetrates down to 1 kilometer to detect dielectric discontinuities of buried pure water ice sheets.',
    status: 'Active',
    defaultOpacity: 65,
    badgeColor: '#16A085'
  }
];

// -----------------------------------------------------------------------------
// SURFACE METEOROLOGY & CONDITIONS (REMS & MEDA Data)
// -----------------------------------------------------------------------------
export const MARTIAN_CONDITIONS = {
  sol: 689,
  localSolarTime: '14:38:24 Martian Local Solar Time (LMST)',
  solarLongitude: 'Ls 142° (Late Martian Summer in North)',
  surfacePressure: {
    current: 684,
    unit: 'Pa',
    mean: 670,
    trend: 'Rising (+3 Pa/hr)',
    earthEquivalent: '0.67% of Earth sea-level pressure'
  },
  temperature: {
    groundCurrent: -12,
    airCurrent: -24,
    min: -82,
    max: -3,
    unit: '°C'
  },
  wind: {
    speed: 6.4,
    unit: 'm/s',
    direction: 'ENE (68°)',
    gustPeak: 14.2
  },
  dustTau: {
    value: 0.62,
    status: 'Nominal Sky Transparency',
    stormAlert: 'ALL CLEAR — No regional dust storms detected by MRO MARCI.'
  },
  radiation: {
    doseRate: 0.21,
    unit: 'mSv / day',
    speAlert: 'GREEN (Nominal GCR background; No solar flare event)',
    cumulativeMission: '14.8 mSv / 100 mSv allowable safe EVA limit'
  },
  solarInsolation: {
    current: 580,
    peak: 620,
    unit: 'W/m²',
    daylightRemaining: '4h 12m'
  }
};

// -----------------------------------------------------------------------------
// IN-SITU SCIENCE SAMPLES & ROCK CORES
// -----------------------------------------------------------------------------
export const SCIENCE_SAMPLES = [
  {
    id: 'CORE-2026-08',
    name: 'Boxwork Vein Core Alpha',
    location: 'Mount Sharp (Gale Crater)',
    mineral: 'Hydrated Magnesium Sulfate & Vein Calcite',
    mass: '148 g',
    solCollected: 'Sol 672',
    status: 'Sealed in Titanium Core Tube #14',
    significance: 'Confirms groundwater temperature between 15°C and 45°C during mineral precipitation.'
  },
  {
    id: 'CORE-2026-05',
    name: 'Delta Front Siltstone',
    location: 'Three Forks (Jezero Crater)',
    mineral: 'Organic-rich Carbonate Mudstone',
    mass: '162 g',
    solCollected: 'Sol 648',
    status: 'Cached for Earth Return',
    significance: 'Preserved biosignature candidate showing micro-lamination similar to Earth stromatolites.'
  },
  {
    id: 'CORE-2026-02',
    name: 'Glacial Lens Permafrost',
    location: 'Chryse Base Perimeter',
    mineral: 'Water Ice (91.4% purity) + Perchlorate salts',
    mass: '210 g',
    solCollected: 'Sol 610',
    status: 'Cryo-stored at -60°C in Habitat Lab',
    significance: 'Validates automated ISRU melter extraction for habitat drinkable water and rocket propellant.'
  }
];

// -----------------------------------------------------------------------------
// EVA SOL TIMELINE / PLANNING
// -----------------------------------------------------------------------------
export const EVA_TIMELINE = [
  { time: '08:00', task: 'Suit Donning & Pre-Breathe Protocol', status: 'completed', duration: '60 min' },
  { time: '09:00', task: 'Airlock 1 Depressurization & Egress', status: 'completed', duration: '20 min' },
  { time: '09:20', task: 'Pressurized Rover System Check & Equipment Mount', status: 'completed', duration: '30 min' },
  { time: '09:50', task: 'Traverse Leg 1: Egress ➔ Mount Sharp Lower Incline', status: 'in-progress', duration: '48 min' },
  { time: '10:38', task: 'Boxwork Ridge Alpha Arrival & Micro-Drill Sampling', status: 'upcoming', duration: '75 min' },
  { time: '11:53', task: 'MRO Satellite High-Gain Comms Relay Pass', status: 'upcoming', duration: '25 min' },
  { time: '12:18', task: 'Point of Safe Return Check & Consumables Tally', status: 'upcoming', duration: '15 min' },
  { time: '12:33', task: 'Return Traverse to Chryse Base Airlock', status: 'upcoming', duration: '70 min' },
  { time: '13:43', task: 'Airlock Ingress, Repressurization & Regolith Decontamination', status: 'upcoming', duration: '45 min' }
];
