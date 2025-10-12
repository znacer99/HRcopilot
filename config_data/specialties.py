# config/specialties.py
# Comprehensive list of specialties for candidates

SPECIALTIES = [
    # WELDING
    'Welding - MIG',
    'Welding - TIG',
    'Welding - Stick (SMAW)',
    'Welding - Flux Core',
    'Pipe Welding',
    'Structural Welding',
    'Aluminum Welding',
    'Stainless Steel Welding',
    'Certified Welder',
    
    # ELECTRICAL
    'Electrical - High Voltage',
    'Electrical - Low Voltage',
    'Electrical Wiring',
    'Panel Installation',
    'Troubleshooting & Repair',
    'Industrial Electrical',
    'Building Electrical',
    'Solar Installation',
    'Certified Electrician',
    'PLC Programming',
    
    # MECHANICS - GENERAL
    'General Mechanic',
    'Equipment Mechanic',
    'Machinery Technician',
    'Maintenance Mechanic',
    'Industrial Mechanic',
    'Heavy Equipment Mechanic',
    
    # MECHANICS - AUTOMOTIVE
    'Automotive Mechanic',
    'Engine Mechanic',
    'Transmission Repair',
    'Brake Systems',
    'Suspension & Alignment',
    'Diesel Engine Mechanic',
    'Heavy Truck Mechanic',
    'Auto Electrician',
    'Certified ASE Mechanic',
    
    # MECHANICS - INDUSTRIAL/MAINTENANCE
    'Predictive Maintenance',
    'Preventive Maintenance',
    'CNC Machine Operator',
    'Lathe Operator',
    'Precision Machinist',
    'Hydraulics Technician',
    'Pneumatics Technician',
    'Bearing & Seal Specialist',
    
    # HVAC
    'HVAC Technician',
    'Air Conditioning Technician',
    'Heating Systems',
    'Refrigeration Technician',
    'HVAC Installation',
    'EPA Certified HVAC',
    'Ventilation Systems',
    
    # PLUMBING
    'Plumber',
    'Pipe Fitter',
    'Plumbing Installation',
    'Drainage Systems',
    'Water Treatment',
    'Gas Fitting',
    'Backflow Prevention',
    'Certified Plumber',
    
    # CONSTRUCTION & CARPENTRY
    'Carpenter',
    'Rough Carpentry',
    'Finish Carpentry',
    'Framing',
    'Masonry',
    'Concrete Work',
    'Tile Installation',
    'Drywall Installation',
    'Roofing',
    'Formwork Specialist',
    
    # PAINTING & FINISHING
    'Painter',
    'Industrial Painter',
    'Spray Painting',
    'Surface Preparation',
    'Coating Specialist',
    'Finish Carpenter',
    
    # OPERATORS
    'Forklift Operator',
    'Crane Operator',
    'Excavator Operator',
    'Loader Operator',
    'Dozer Operator',
    'Heavy Equipment Operator',
    'Scissor Lift Operator',
    'Reach Truck Operator',
    'Certified Equipment Operator',
    
    # WELDING - ADVANCED
    'Robotic Welding',
    'Underwater Welding',
    'Aerospace Welding',
    'Pressure Vessel Welding',
    'Code Inspector Welder',
    
    # FABRICATION & METALWORK
    'Metal Fabricator',
    'Sheet Metal Fabrication',
    'Steel Fabrication',
    'Aluminum Fabrication',
    'Ironworker',
    'Blacksmith',
    'Tool & Die Maker',
    
    # QUALITY & INSPECTION
    'Quality Control Inspector',
    'Inspection Technician',
    'NDT Technician (Non-Destructive Testing)',
    'Ultrasonic Testing',
    'X-Ray Inspection',
    'Dimensional Inspector',
    'Surface Inspector',
    
    # SAFETY & COMPLIANCE
    'Safety Officer',
    'Health & Safety Technician',
    'OSHA Certified',
    'Fire Safety Inspector',
    'Environmental Health & Safety',
    
    # LOGISTICS & WAREHOUSE
    'Warehouse Manager',
    'Inventory Specialist',
    'Logistics Coordinator',
    'Shipping & Receiving',
    'Material Handler',
    'Stock Keeper',
    
    # PRODUCTION & MANUFACTURING
    'Production Supervisor',
    'Production Technician',
    'Assembly Technician',
    'Line Operator',
    'Process Technician',
    'Quality Technician',
    'Manufacturing Engineer',
    
    # MAINTENANCE & JANITORIAL
    'Janitor/Cleaner',
    'Building Maintenance',
    'Facilities Maintenance',
    'General Handyman',
    'Landscaping',
    'Grounds Keeper',
    
    # SPECIALIZED TRADES
    'Glazier',
    'Glass Installation',
    'Locksmith',
    'Door & Hardware Installation',
    'Insulation Technician',
    'Weatherization Specialist',
    'Scaffolding Specialist',
    'Signage Installation',
    
    # ENTRY LEVEL & GENERAL
    'Laborer',
    'General Laborer',
    'Helper',
    'Apprentice',
    'Trainee',
    'Unskilled Worker',
    'Assembly Helper',
    'Production Helper',
    
    # SUPERVISORY & MANAGEMENT
    'Supervisor',
    'Team Lead',
    'Shift Manager',
    'Site Manager',
    'Project Manager',
    'Operations Manager',
    'Maintenance Manager',
    'Production Manager',
]

# Organized by category (for better UI)
SPECIALTIES_BY_CATEGORY = {
    'Welding': [
        'Welding - MIG',
        'Welding - TIG',
        'Welding - Stick (SMAW)',
        'Welding - Flux Core',
        'Pipe Welding',
        'Structural Welding',
        'Robotic Welding',
    ],
    'Electrical': [
        'Electrical - High Voltage',
        'Electrical - Low Voltage',
        'Industrial Electrical',
        'Building Electrical',
        'PLC Programming',
    ],
    'Mechanics': [
        'Engine Mechanic',
        'General Mechanic',
        'Automotive Mechanic',
        'Heavy Equipment Mechanic',
        'Industrial Mechanic',
    ],
    'HVAC & Plumbing': [
        'HVAC Technician',
        'Plumber',
        'Pipe Fitter',
        'Refrigeration Technician',
    ],
    'Operations': [
        'Forklift Operator',
        'Crane Operator',
        'Heavy Equipment Operator',
        'CNC Machine Operator',
    ],
    'Supervision & Management': [
        'Supervisor',
        'Team Lead',
        'Project Manager',
        'Production Manager',
    ],
    'Entry Level': [
        'Laborer',
        'Helper',
        'Apprentice',
        'Unskilled Worker',
    ],
}