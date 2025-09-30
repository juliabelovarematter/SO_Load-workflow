// Shared mock data generation utilities

export const facilities = [
  'ReMatter Headquarters', 'ReMatter Ohio', 'ReMatter San Diego', 
  'ReMatter Los Angeles', 'ReMatter Texas', 'ReMatter Newport Beach',
  'ReMatter SantaMonica', 'ReMatter Lake Tahoe', 'ReMatter Denver'
]

export const customers = [
  'RecycleHub Yard', 'GreenStream Scrap', 'EcoMetal Solutions', 'MetalWorks Inc',
  'ScrapKing Corp', 'Metro Scrap & Metal Co.', 'Industrial Recycling Solutions',
  'Premier Scrap Metals', 'Advanced Metal Recovery', 'EcoScrap Industries'
]

export const accountReps = [
  'Tyler Anderson', 'Matthew Brown', 'Sarah Wilson', 'David Lee', 'Lisa Garcia',
  'Robert Johnson', 'Jennifer Davis', 'Michael Wilson', 'Christopher Martinez', 'Amanda Taylor'
]

export const contacts = ['No Contact', 'John Smith', 'Jane Doe', 'Mike Johnson']

export const shipToLocations = [
  'RecycleHub Yard - 123 Main St, Chicago, IL 60601',
  'GreenStream Scrap - 456 Oak Ave, Houston, TX 77001',
  'EcoMetal Solutions - 789 Pine Rd, Phoenix, AZ 85001',
  'MetalWorks Inc - 321 Elm St, Philadelphia, PA 19101',
  'ScrapKing Corp - 654 Maple Dr, San Antonio, TX 78201',
  'Metro Scrap & Metal Co. - 1234 Industrial Blvd, Los Angeles, CA 90021',
  'Industrial Recycling Solutions - 987 Cedar Ln, San Diego, CA 92101',
  'Premier Scrap Metals - 147 Birch St, Dallas, TX 75201',
  'Advanced Metal Recovery - 258 Spruce Ave, San Jose, CA 95101',
  'EcoScrap Industries - 369 Willow Way, Austin, TX 78701'
]

export const paymentCurrencies = [
  'USD - United States Dollar', 'EUR - Euro', 'GBP - British Pound', 
  'CAD - Canadian Dollar', 'AUD - Australian Dollar'
]

export const paymentTerms = ['No Contact', 'Net 30', 'Net 60', 'Net 90', 'Cash on Delivery']
export const freightTerms = ['No Contact', 'FOB Origin', 'FOB Destination', 'CIF', 'EXW']
export const statuses = ['Open', 'Closed', 'Draft', 'Shipped', 'Voided']

// Load-specific data
export const loadStatuses = ['Unassigned', 'Open', 'Pending Shipment', 'Pending Reconciliation', 'Reconciled', 'Closed', 'Voided']
export const bookingStatuses = ['Draft', 'Open', 'Shipped', 'Closed', 'Voided']
export const shippingCarriers = [
  'ShipSmart Headquarters', 'ShipSmart Ontario', 'ShipSmart Puerto Rico',
  'ShipSmart Stanford', 'ShipSmart Texas', 'ShipSmart California',
  'ShipSmart Nevada', 'ShipSmart Colorado', 'ShipSmart Florida'
]

// Booking-specific data
export const ports = [
  'Port of Los Angeles', 'Port of Long Beach', 'Port of Oakland', 'Port of Seattle',
  'Port of Tacoma', 'Port of Houston', 'Port of Miami', 'Port of New York',
  'Port of Savannah', 'Port of Charleston', 'Port of Norfolk', 'Port of Baltimore'
]

export const destinations = [
  'Shanghai, China', 'Hamburg, Germany', 'Tokyo, Japan', 'Rotterdam, Netherlands',
  'Busan, South Korea', 'Antwerp, Belgium', 'Singapore', 'Hong Kong, China',
  'Dubai, UAE', 'Mumbai, India', 'Bangkok, Thailand', 'Manila, Philippines',
  'Sydney, Australia', 'Auckland, New Zealand', 'Vancouver, Canada', 'Montreal, Canada'
]

export const vessels = [
  'MV Ocean Star', 'MV Atlantic', 'MV Pacific', 'MV North Sea', 'MV Asia Pacific',
  'MV European Express', 'MV Singapore Star', 'MV Shanghai Express', 'MV Hamburg Star',
  'MV Tokyo Bay', 'MV Rotterdam Express', 'MV Busan Star', 'MV Antwerp Express',
  'MV Dubai Star', 'MV Mumbai Express', 'MV Bangkok Star', 'MV Manila Express',
  'MV Sydney Star', 'MV Auckland Express', 'MV Vancouver Star', 'MV Montreal Express'
]

export const bookingNotes = [
  'Priority shipment - expedite processing',
  'Standard processing',
  'Fragile cargo - handle with care',
  'Large shipment - requires special handling',
  'Temperature controlled cargo',
  'High value cargo - insurance required',
  'Hazardous materials - special documentation required',
  'Oversized cargo - crane required',
  'Time sensitive delivery',
  'Customer requested expedited shipping',
  'Standard ocean freight',
  'Consolidated shipment',
  'Direct shipment - no transshipment',
  'Refrigerated cargo',
  'Dry cargo only',
  ''
]

// Available materials for SO generation
export const availableMaterials = [
  { id: '101', name: '101 - Aluminum Cans', unit: 'lb', isEachMaterial: false },
  { id: '102', name: '102 - Aluminum Sheet', unit: 'lb', isEachMaterial: false },
  { id: '103', name: '103 - Al 6061', unit: 'lb', isEachMaterial: false },
  { id: '104', name: '104 - Al 3003', unit: 'lb', isEachMaterial: false },
  { id: '105', name: '105 - Al 5052', unit: 'lb', isEachMaterial: false },
  { id: '106', name: '106 - Al 6063', unit: 'lb', isEachMaterial: false },
  { id: '107', name: '107 - Al 1100', unit: 'lb', isEachMaterial: false },
  { id: '108', name: '108 - Al 2024', unit: 'lb', isEachMaterial: false },
  { id: '109', name: '109 - Al 7075', unit: 'lb', isEachMaterial: false },
  { id: '110', name: '110 - Al 3004', unit: 'lb', isEachMaterial: false },
  { id: '201', name: '201 - Copper Wire', unit: 'lb', isEachMaterial: false },
  { id: '202', name: '202 - Copper Pipe', unit: 'lb', isEachMaterial: false },
  { id: '203', name: '203 - Copper Sheet', unit: 'lb', isEachMaterial: false },
  { id: '204', name: '204 - Copper Tubing', unit: 'lb', isEachMaterial: false },
  { id: '205', name: '205 - Copper Bus Bar', unit: 'lb', isEachMaterial: false },
  { id: '301', name: '301 - Brass Fittings', unit: 'lb', isEachMaterial: false },
  { id: '302', name: '302 - Brass Valves', unit: 'lb', isEachMaterial: false },
  { id: '303', name: '303 - Brass Pipe', unit: 'lb', isEachMaterial: false },
  { id: '304', name: '304 - Brass Sheet', unit: 'lb', isEachMaterial: false },
  { id: '305', name: '305 - Brass Rod', unit: 'lb', isEachMaterial: false },
  { id: '401', name: '401 - Steel Scrap', unit: 'lb', isEachMaterial: false },
  { id: '402', name: '402 - Steel Pipe', unit: 'lb', isEachMaterial: false },
  { id: '403', name: '403 - Steel Sheet', unit: 'lb', isEachMaterial: false },
  { id: '404', name: '404 - Steel Beam', unit: 'lb', isEachMaterial: false },
  { id: '405', name: '405 - Steel Plate', unit: 'lb', isEachMaterial: false },
  { id: '501', name: '501 - Stainless Steel', unit: 'lb', isEachMaterial: false },
  { id: '502', name: '502 - Stainless Pipe', unit: 'lb', isEachMaterial: false },
  { id: '503', name: '503 - Stainless Sheet', unit: 'lb', isEachMaterial: false },
  { id: '504', name: '504 - Stainless Fittings', unit: 'lb', isEachMaterial: false },
  { id: '505', name: '505 - Stainless Valves', unit: 'lb', isEachMaterial: false },
  { id: '601', name: '601 - Lead Battery', unit: 'ea', isEachMaterial: true },
  { id: '602', name: '602 - Lead Pipe', unit: 'ea', isEachMaterial: true },
  { id: '603', name: '603 - Lead Sheet', unit: 'ea', isEachMaterial: true },
  { id: '604', name: '604 - Lead Weights', unit: 'ea', isEachMaterial: true },
  { id: '605', name: '605 - Lead Cable', unit: 'ea', isEachMaterial: true },
  { id: '701', name: '701 - Zinc Die Cast', unit: 'ea', isEachMaterial: true },
  { id: '702', name: '702 - Zinc Sheet', unit: 'ea', isEachMaterial: true },
  { id: '703', name: '703 - Zinc Pipe', unit: 'ea', isEachMaterial: true },
  { id: '704', name: '704 - Zinc Fittings', unit: 'ea', isEachMaterial: true },
  { id: '705', name: '705 - Zinc Valves', unit: 'ea', isEachMaterial: true }
]

// Simple seeded random number generator
class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max)
  }
}

// Generate consistent data for a specific SO number
export const generateSOData = (soNumber: string) => {
  const seed = parseInt(soNumber)
  const rng = new SeededRandom(seed)
  
  const facility = facilities[rng.nextInt(facilities.length)]
  const customer = customers[rng.nextInt(customers.length)]
  const accountRep = accountReps[rng.nextInt(accountReps.length)]
  const contact = contacts[rng.nextInt(contacts.length)]
  const shipToLocation = shipToLocations[rng.nextInt(shipToLocations.length)]
  const paymentCurrency = paymentCurrencies[rng.nextInt(paymentCurrencies.length)]
  const paymentTerm = paymentTerms[rng.nextInt(paymentTerms.length)]
  const freightTerm = freightTerms[rng.nextInt(freightTerms.length)]
  const status = statuses[rng.nextInt(statuses.length)]
  
  // Generate dates based on SO number - use safe date generation
  const baseDate = new Date(2024, 7, 20) // August 20, 2024 (month is 0-indexed)
  const daysOffset = rng.nextInt(10)
  const startDate = new Date(baseDate.getTime() + daysOffset * 24 * 60 * 60 * 1000)
  const endDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000)
  
  // Generate materials for this SO (1-5 materials)
  const materialsCount = rng.nextInt(5) + 1
  const materials = []
  
  for (let i = 0; i < materialsCount; i++) {
    const material = availableMaterials[rng.nextInt(availableMaterials.length)]
    const netWeight = material.isEachMaterial 
      ? rng.nextInt(50) + 1  // 1-50 for "ea" materials
      : rng.nextInt(5000) + 100  // 100-5100 for "lb" materials
    
    const unitPrice = rng.nextInt(20) + 1  // $1-$20 per unit
    const pricingUnit = material.isEachMaterial ? 'ea' : 'lb'
    const estimatedTotal = netWeight * unitPrice
    
    materials.push({
      id: `${soNumber}-${i + 1}`,
      contractMaterial: material.name,
      netWeight,
      unitPrice,
      pricingUnit,
      estimatedTotal,
      isFormula: false,
      isEachMaterial: material.isEachMaterial,
      selectedExchange: 'COMEX'
    })
  }
  
  return {
    soNumber,
    facility,
    startDate: startDate && !isNaN(startDate.getTime()) ? startDate.toISOString().split('T')[0] : '2024-08-20',
    endDate: endDate && !isNaN(endDate.getTime()) ? endDate.toISOString().split('T')[0] : '2024-08-23',
    accountRep,
    counterpartPO: `#${String(seed).padStart(6, '0')}`,
    customerName: customer,
    contact,
    shipToLocation,
    billToLocation: shipToLocation,
    sameAsShip: true,
    paymentCurrency,
    paymentTerm,
    freightTerm,
    doNotShip: rng.nextInt(3) === 0,
    status,
    materials
  }
}

// Generate consistent data for a specific Load number
export const generateLoadData = (loadNumber: string) => {
  const seed = parseInt(loadNumber.replace('#', '')) || 860000 // Fallback to default seed
  const rng = new SeededRandom(seed)
  
  const facility = facilities[rng.nextInt(facilities.length)]
  const customer = customers[rng.nextInt(customers.length)]
  const shippingCarrier = shippingCarriers[rng.nextInt(shippingCarriers.length)]
  
  // Generate dates based on load number - use safe date generation
  const baseDate = new Date(2024, 7, 20) // August 20, 2024 (month is 0-indexed)
  const daysOffset = rng.nextInt(10)
  const shipDate = new Date(baseDate.getTime() + daysOffset * 24 * 60 * 60 * 1000)
  const createdDate = new Date(shipDate.getTime() - 2 * 24 * 60 * 60 * 1000)
  
  // Generate status first to determine if we need relatedSO
  const status = loadStatuses[rng.nextInt(loadStatuses.length)]
  
  // BUSINESS RULE: Generate relatedSO based on status
  let relatedSO = ''
  if (status === 'Unassigned' || status === 'Voided') {
    // UNASSIGNED and VOIDED loads NEVER have SOs
    relatedSO = ''
  } else {
    // All other statuses (Open, Pending Shipment, etc.) MUST have SOs
    relatedSO = `#${String(seed + 1000).padStart(6, '0')}`
  }
  
  // Generate materials count (1-20 materials)
  const materialsCount = rng.nextInt(20) + 1
  
  // Generate materials for this load
  const materials = []
  for (let i = 0; i < materialsCount; i++) {
    const material = availableMaterials[rng.nextInt(availableMaterials.length)]
    const netWeight = material.isEachMaterial 
      ? rng.nextInt(50) + 1  // 1-50 for "ea" materials
      : rng.nextInt(5000) + 100  // 100-5100 for "lb" materials
    
    const unitPrice = rng.nextInt(20) + 1  // $1-$20 per unit
    const pricingUnit = material.isEachMaterial ? 'ea' : 'lb'
    const estimatedTotal = netWeight * unitPrice
    
    materials.push({
      id: `${loadNumber}-${i + 1}`,
      contractMaterial: material.name,
      netWeight,
      unitPrice,
      pricingUnit,
      estimatedTotal,
      isFormula: false,
      isEachMaterial: material.isEachMaterial,
      selectedExchange: 'COMEX'
    })
  }
  
  return {
    loadNumber,
    expectedShipDate: shipDate && !isNaN(shipDate.getTime()) ? shipDate.toISOString().split('T')[0] : '2024-08-22',
    facility,
    relatedSO,
    bookingNumber: rng.nextInt(3) === 0 ? `#${String(seed + 2000).padStart(6, '0')}` : '',
    shippingCarrier,
    customer,
    status,
    materialsCount,
    netWeight: rng.nextInt(2000) + 100,
    createdOn: createdDate && !isNaN(createdDate.getTime()) ? createdDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'August 20, 2024',
    createdBy: accountReps[rng.nextInt(accountReps.length)],
    materials,
    // Shipping details
    containerNumber: '',
    sealNumber: '',
    truckFreight: '',
    notes: '',
    photosCount: 0
  }
}

// Generate all 50 loads for the table
export const generateAllLoadsData = () => {
  const data = []
  for (let i = 0; i < 50; i++) {
    const loadNumber = `#${String(860000 + i).padStart(6, '0')}`
    data.push(generateLoadData(loadNumber))
  }
  return data
}

// Booking data generator
export const generateBookingData = (bookingNumber: string) => {
  const seed = parseInt(bookingNumber.replace('BK-', '').replace('-', '')) || 1 // Fallback to 1 if parsing fails
  const rng = new SeededRandom(seed)
  
  const soNumber = `#${String(seed + 1000).padStart(6, '0')}`
  const poNumber = `PO-${String(seed + 2000).padStart(6, '0')}`
  const customer = customers[rng.nextInt(customers.length)]
  const portOfDestination = destinations[rng.nextInt(destinations.length)]
  const facility = ports[rng.nextInt(ports.length)]
  const containers = rng.nextInt(25) + 1 // 1-25 containers
  const vessel = vessels[rng.nextInt(vessels.length)]
  const status = bookingStatuses[rng.nextInt(bookingStatuses.length)]
  const notes = bookingNotes[rng.nextInt(bookingNotes.length)]
  
  // Generate dates
  const createdDate = new Date(2024, 0, 1) // Start of 2024
  createdDate.setDate(createdDate.getDate() + rng.nextInt(365)) // Random day in 2024
  
  const cutoffDate = new Date(createdDate)
  cutoffDate.setDate(cutoffDate.getDate() + rng.nextInt(30) + 7) // 7-37 days after creation
  
  const earlyReturnDate = new Date(cutoffDate)
  earlyReturnDate.setDate(earlyReturnDate.getDate() - rng.nextInt(3) + 1) // 1-3 days before cutoff
  
  return {
    bookingNumber,
    soNumber,
    poNumber,
    customer,
    portOfDestination,
    facility,
    containers,
    cutoffDate: cutoffDate.toISOString().split('T')[0],
    earlyReturnDate: earlyReturnDate.toISOString().split('T')[0],
    vessel,
    createdOn: createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status,
    notes
  }
}

// Generate all 50 bookings for the table
export const generateAllBookingsData = () => {
  const data = []
  for (let i = 0; i < 50; i++) {
    const bookingNumber = `BK-2024-${String(i + 1).padStart(3, '0')}`
    data.push(generateBookingData(bookingNumber))
  }
  return data
}
