import { useState, useEffect, useRef } from 'react'
import { useRoute } from 'wouter'
import { Button, Tag, Tabs, Form, Input, Select, DatePicker, InputNumber } from 'antd'
import { ArrowLeft, Trash2, Plus, Upload, FileText, StickyNote, Monitor, Weight, Camera, CheckCircle } from 'lucide-react'
import dayjs from 'dayjs'

// Material interface (same as SO Materials)
interface Material {
  id: number
  contractMaterial?: string
  netWeight?: number
  grossWeight?: number
  tareWeight?: number
  unitPrice?: number | string
  pricingUnit?: 'lb' | 'NT' | 'kg' | 'MT' | 'ea'
  inventoryTags?: string
  estimatedTotal?: number
  isEachMaterial?: boolean
  isFormula?: boolean
  selectedExchange?: string
  isTaggedMaterial?: boolean
  tagNumber?: string
}

// Weight conversion utility (same as SO Materials)
const convertWeight = (weight: number, fromUnit: string, toUnit: string): number => {
  if (fromUnit === toUnit) return weight
  
  // Convert to pounds first
  let weightInPounds = weight
  switch (fromUnit) {
    case 'NT':
      weightInPounds = weight * 2000 // 1 NT = 2000 lbs
      break
    case 'kg':
      weightInPounds = weight * 2.20462 // 1 kg = 2.20462 lbs
      break
    case 'MT':
      weightInPounds = weight * 2204.62 // 1 MT = 2204.62 lbs
      break
    case 'ea':
      return weight // Each materials don't convert
    default:
      weightInPounds = weight // Already in pounds
  }
  
  // Convert from pounds to target unit
  switch (toUnit) {
    case 'NT':
      return weightInPounds / 2000
    case 'kg':
      return weightInPounds / 2.20462
    case 'MT':
      return weightInPounds / 2204.62
    case 'ea':
      return weightInPounds // Each materials don't convert
    default:
      return weightInPounds // Already in pounds
  }
}

export const LoadDetail = () => {
  const [, params] = useRoute('/load/:id')
  
  // All hooks at the top level
  const [loadData, setLoadData] = useState<any>(null)
  const [form] = Form.useForm()
  const [hasChanges, setHasChanges] = useState(false)
  const [originalFormData, setOriginalFormData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('load-info')
  const [materials, setMaterials] = useState<Material[]>([])
  const [savedMaterials, setSavedMaterials] = useState<Material[]>([])
  const [materialsCount, setMaterialsCount] = useState(0)
  const [weightMode, setWeightMode] = useState<'scale' | 'price'>('scale')
  const [requestMode, setRequestMode] = useState<'request' | 'staged'>('request')
  const [showScales, setShowScales] = useState(true)
  const [selectedScale, setSelectedScale] = useState('FS1')
  const [currentWeight, setCurrentWeight] = useState(23345)
  const [selectedMaterialForWeighing, setSelectedMaterialForWeighing] = useState<Material | null>(null)
  const [materialWeight, setMaterialWeight] = useState<number | null>(null)
  const [selectedFieldForWeighing, setSelectedFieldForWeighing] = useState<'gross' | 'tare' | null>(null)

  // Material weighing functions
  const handleSelectMaterialForWeighing = (material: Material) => {
    setSelectedMaterialForWeighing(material)
    setSelectedFieldForWeighing(null)
    setMaterialWeight(null)
  }

  const handleFieldClick = (material: Material, fieldType: 'gross' | 'tare') => {
    console.log('Field clicked:', fieldType, 'Material:', material.id)
    
    // Check if this is an "each" material
    const selectedMaterial = material.isTaggedMaterial 
      ? availableTaggedMaterials.find(am => am.name === material.contractMaterial)
      : availableMaterials.find(am => am.name === material.contractMaterial)
    const isEachMaterial = selectedMaterial?.isEachMaterial || false
    
    if (isEachMaterial && fieldType === 'gross') {
      // For "each" materials, don't calculate weight - user types manually
      console.log('Each material detected - no weight calculation')
      setSelectedMaterialForWeighing(null)
      setSelectedFieldForWeighing(null)
      setMaterialWeight(null)
      return
    }
    
    setSelectedMaterialForWeighing(material)
    setSelectedFieldForWeighing(fieldType)
    // Simulate loading material onto scales
    setMaterialWeight(null)
    // Simulate weight calculation after a brief delay
    setTimeout(() => {
      let simulatedWeight
      if (fieldType === 'tare') {
        // For tare field, generate weight between 0-100lb
        simulatedWeight = Math.floor(Math.random() * 101) // Random weight between 0-100
      } else {
        // For gross field, material weight should be at least 500lb, no upper limit
        simulatedWeight = Math.floor(Math.random() * 2000) + 500 // Random weight between 500-2500
      }
      console.log('Weight calculated:', simulatedWeight, 'for field:', fieldType)
      setMaterialWeight(simulatedWeight)
    }, 1000)
  }

  const handleTakeWeight = () => {
    console.log('Take weight clicked:', { selectedMaterialForWeighing, materialWeight, selectedFieldForWeighing })
    if (selectedMaterialForWeighing && materialWeight !== null && selectedFieldForWeighing) {
      const updatedMaterials = materials.map(m => {
        if (m.id === selectedMaterialForWeighing.id) {
          if (selectedFieldForWeighing === 'gross') {
            // For gross field, set the weight directly
            console.log('Setting gross weight:', materialWeight)
            return { ...m, grossWeight: materialWeight }
          } else if (selectedFieldForWeighing === 'tare') {
            // For tare, ensure it doesn't exceed 100lb and doesn't exceed gross weight
            const currentGrossWeight = m.grossWeight || 0
            const maxTareWeight = Math.min(100, currentGrossWeight > 0 ? currentGrossWeight : 100)
            const capturedWeight = Math.min(materialWeight, maxTareWeight)
            console.log('Setting tare weight:', capturedWeight, '(max allowed: 100lb)')
            return { ...m, tareWeight: capturedWeight }
          }
        }
        return m
      })
      console.log('Updated materials:', updatedMaterials)
      setMaterials(updatedMaterials)
      setHasChanges(true)
      
      // Clear the weighing state
      setSelectedMaterialForWeighing(null)
      setSelectedFieldForWeighing(null)
      setMaterialWeight(null)
    }
  }
  
  // Unit Price dropdown states (same as SO Materials)
  const [dropdownVisible, setDropdownVisible] = useState<{ [key: number]: boolean }>({})
  const [dropdownPosition, setDropdownPosition] = useState<{ [key: number]: { top: number, left: number } }>({})
  const inputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})
  const previousValues = useRef<{ [key: number]: string }>({})

  // Available materials (same as SO Materials)
  const availableMaterials = [
    { name: '101 - Aluminum Cans', unit: 'lb', isEachMaterial: false },
    { name: '102 - Aluminum Sheet', unit: 'lb', isEachMaterial: false },
    { name: '103 - Aluminum Wire', unit: 'lb', isEachMaterial: false },
    { name: '104 - Brass', unit: 'lb', isEachMaterial: false },
    { name: '105 - Copper', unit: 'lb', isEachMaterial: false },
    { name: '106 - Lead', unit: 'lb', isEachMaterial: false },
    { name: '107 - Steel', unit: 'lb', isEachMaterial: false },
    { name: '108 - Tin', unit: 'lb', isEachMaterial: false },
    { name: 'EACH', unit: 'ea', isEachMaterial: true },
    { name: 'EA MAT 2', unit: 'ea', isEachMaterial: true },
    { name: 'EA MAT 3', unit: 'ea', isEachMaterial: true },
    { name: 'EA MAT 4', unit: 'ea', isEachMaterial: true },
    { name: 'Freight pick under 10 Miles', unit: 'ea', isEachMaterial: true },
    { name: 'Online Review', unit: 'ea', isEachMaterial: true },
    { name: 'First Time Customer', unit: 'ea', isEachMaterial: true },
    { name: 'Freight', unit: 'ea', isEachMaterial: true },
    { name: 'Landfill Fee', unit: 'ea', isEachMaterial: true },
    { name: 'Tipping Fee', unit: 'ea', isEachMaterial: true },
    { name: 'Dirt', unit: 'ea', isEachMaterial: true },
    { name: 'HVAC 1', unit: 'ea', isEachMaterial: true }
  ]

  // Available tagged materials
  const availableTaggedMaterials = [
    { name: 'Tag#00123 Aluminum Cans', unit: 'lb', isEachMaterial: false, grossWeight: 1250, tareWeight: 50, netWeight: 1200 },
    { name: 'Tag#00124 Copper Wire', unit: 'lb', isEachMaterial: false, grossWeight: 850, tareWeight: 25, netWeight: 825 },
    { name: 'Tag#00125 Steel Scrap', unit: 'lb', isEachMaterial: false, grossWeight: 2100, tareWeight: 100, netWeight: 2000 },
    { name: 'Tag#00126 Brass Fittings', unit: 'lb', isEachMaterial: false, grossWeight: 450, tareWeight: 15, netWeight: 435 },
    { name: 'Tag#00127 Lead Sheets', unit: 'lb', isEachMaterial: false, grossWeight: 750, tareWeight: 30, netWeight: 720 },
    { name: 'Tag#00128 Aluminum Sheet', unit: 'lb', isEachMaterial: false, grossWeight: 1800, tareWeight: 80, netWeight: 1720 },
    { name: 'Tag#00129 HVAC Unit', unit: 'ea', isEachMaterial: true, grossWeight: 1, tareWeight: 0, netWeight: 1 },
    { name: 'Tag#00130 Batteries', unit: 'ea', isEachMaterial: true, grossWeight: 4, tareWeight: 0, netWeight: 4 },
    { name: 'Tag#00131 Tin Cans', unit: 'lb', isEachMaterial: false, grossWeight: 320, tareWeight: 10, netWeight: 310 },
    { name: 'Tag#00132 Aluminum Wire', unit: 'lb', isEachMaterial: false, grossWeight: 650, tareWeight: 20, netWeight: 630 }
  ]

  // Insert variable function (same as SO Materials)
  const insertVariable = (index: number, variable: string) => {
    const currentValue = typeof materials[index].unitPrice === 'string' ? materials[index].unitPrice : ''
    const newValue = currentValue.replace(/\$$/, variable) // Replace the last $ with the variable
    
    updateMaterial(index, 'unitPrice', newValue)
    
    // Hide dropdown
    setDropdownVisible(prev => ({ ...prev, [index]: false }))
    
    // Focus back on input
    setTimeout(() => {
      const inputElement = inputRefs.current[index]
      if (inputElement) {
        inputElement.focus()
      }
    }, 0)
  }

  // Click outside handler (same as SO Materials)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.formula-input') && !target.closest('.formula-dropdown')) {
        setDropdownVisible({})
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Update material function (same as SO Materials)
  const updateMaterial = (index: number, field: keyof Material, value: any) => {
    const updatedMaterials = [...materials]
    updatedMaterials[index] = { ...updatedMaterials[index], [field]: value }
    
    // Handle each material logic
    if (field === 'contractMaterial') {
      // Check both regular and tagged materials
      const selectedMaterial = updatedMaterials[index].isTaggedMaterial 
        ? availableTaggedMaterials.find(am => am.name === value)
        : availableMaterials.find(am => am.name === value)
      
      if (selectedMaterial?.isEachMaterial) {
        // Material is inherently "each" - lock to "ea"
        updatedMaterials[index].isEachMaterial = true
        updatedMaterials[index].pricingUnit = 'ea'
      } else {
        // Material is not inherently "each" - allow user to choose
        // Only reset if it was previously an "each" material
        if (updatedMaterials[index].isEachMaterial) {
          updatedMaterials[index].pricingUnit = 'lb'
          updatedMaterials[index].isEachMaterial = false
        }
      }
    }
    
    // Handle pricing unit change to "ea" - THE ONLY exception
    if (field === 'pricingUnit' && value === 'ea') {
      updatedMaterials[index].isEachMaterial = true
      updatedMaterials[index].pricingUnit = 'ea'
    } else if (field === 'pricingUnit' && value !== 'ea') {
      // Check if this is a material-based "each" or user-selected "each"
      const selectedMaterial = updatedMaterials[index].isTaggedMaterial 
        ? availableTaggedMaterials.find(am => am.name === updatedMaterials[index].contractMaterial)
        : availableMaterials.find(am => am.name === updatedMaterials[index].contractMaterial)
      
      if (selectedMaterial?.isEachMaterial) {
        // Material is inherently "each" - don't allow changing away from "ea"
        updatedMaterials[index].pricingUnit = 'ea'
      } else {
        // User-selected "each" - allow changing to other units
        updatedMaterials[index].isEachMaterial = false
      }
    }
    
    // Handle formula mode toggle
    if (field === 'isFormula') {
      if (value === true) {
        // Switch to formula mode - set default formula
        updatedMaterials[index].unitPrice = 'COMEX * 0.6'
        updatedMaterials[index].selectedExchange = 'COMEX'
      } else {
        // Switch to value mode - set default value
        updatedMaterials[index].unitPrice = 0
      }
    }
    
    // Calculate estimated total
    const material = updatedMaterials[index]
    if (material.netWeight && material.unitPrice) {
      if (material.isEachMaterial) {
        // For each materials, no conversion needed
        updatedMaterials[index].estimatedTotal = Math.round((material.netWeight * (typeof material.unitPrice === 'number' ? material.unitPrice : 0)) * 100) / 100
      } else {
        // Convert weight to pounds for calculation
        const weightInPounds = convertWeight(material.netWeight, weightMode === 'scale' ? 'lb' : (material.pricingUnit || 'lb'), 'lb')
        
        // Convert unit price to per-pound if needed
        let pricePerPound = typeof material.unitPrice === 'number' ? material.unitPrice : 0
        if (material.pricingUnit && material.pricingUnit !== 'lb') {
          // Convert price from per-pricing-unit to per-pound
          // If price is $9.00 per NT, and 1 NT = 2000 lb, then price per lb = $9.00 / 2000 = $0.0045
          const poundsPerPricingUnit = convertWeight(1, material.pricingUnit, 'lb')
          pricePerPound = pricePerPound / poundsPerPricingUnit
          
          // Debug logging
          console.log(`Calculation: ${material.unitPrice} per ${material.pricingUnit} = ${pricePerPound} per lb`)
          console.log(`Weight: ${weightInPounds} lb`)
          console.log(`Total: ${weightInPounds} × ${pricePerPound} = ${weightInPounds * pricePerPound}`)
        }
        
        updatedMaterials[index].estimatedTotal = Math.round((weightInPounds * pricePerPound) * 100) / 100
      }
    } else {
      // Reset estimated total if no weight or price
      updatedMaterials[index].estimatedTotal = 0
    }
    
    setMaterials(updatedMaterials)
    setHasChanges(true)
  }

  // Weight mode conversion logic (same as SO Materials)
  useEffect(() => {
    if (materials.length === 0) return
    
    const updatedMaterials = materials.map(material => {
      if (material.isEachMaterial) return material // Skip each materials
      
      // Always store weight in pounds internally, only change display
      // No need to convert the stored weight, just update the display
      return material
    })
    
    setMaterials(updatedMaterials)
    setHasChanges(true)
  }, [weightMode])

  // Generate consistent load data using seeded random (same as Loads table)
  const generateLoadData = (loadId: string) => {
    const facilities = [
      'ReMatter Headquarters', 'ReMatter Ohio', 'ReMatter San Diego', 
      'ReMatter Los Angeles', 'ReMatter Texas', 'ReMatter Newport Beach',
      'ReMatter SantaMonica', 'ReMatter Lake Tahoe', 'ReMatter Denver'
    ]
    
    const carriers = [
      'ShipSmart Headquarters', 'ShipSmart Ontario', 'ShipSmart Puerto Rico',
      'ShipSmart Stanford', 'ShipSmart Texas', 'ShipSmart California',
      'ShipSmart Nevada', 'ShipSmart Colorado', 'ShipSmart Florida'
    ]
    
    const customers = [
      'EcoRevive Metals', 'EcoHarmony Metals', 'NatureCycle Metals',
      'RecycleHub Yard', 'Alpha Whisky', 'GreenTech Scrap',
      'MetalWorks Inc', 'ScrapMaster Pro', 'EcoMetal Solutions',
      'Sustainable Scrap', 'GreenCycle Metals', 'MetalRecycle Co'
    ]
    
    const statuses = ['Unassigned', 'Open', 'Shipped', 'Pending Reconciliation', 'Reconciled', 'Closed', 'Voided']
    const createdBy = ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Wilson', 'Tom Brown', 'Lisa Davis', 'Chris Miller', 'Amy Taylor']
    
    // Use load number as seed for consistent data
    const loadNumber = parseInt(loadId.replace('#', ''))
    const seed = loadNumber
    const rng = new (class {
      private seed: number
      constructor(seed: number) { this.seed = seed }
      next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280
        return this.seed / 233280
      }
      nextInt(max: number): number { return Math.floor(this.next() * max) }
    })(seed)
    
    const shipDate = new Date(2025, 5, rng.nextInt(30) + 1)
    const createdDate = new Date(2025, rng.nextInt(6), rng.nextInt(28) + 1)
    
    return {
      loadNumber: `#${loadId}`,
      expectedShipDate: shipDate,
      facility: facilities[rng.nextInt(facilities.length)],
      shippingCarrier: carriers[rng.nextInt(carriers.length)],
      customer: customers[rng.nextInt(customers.length)],
      status: statuses[rng.nextInt(statuses.length)],
      materialsCount: rng.nextInt(20) + 1,
      photosCount: rng.nextInt(10),
      createdOn: createdDate,
      createdBy: createdBy[rng.nextInt(createdBy.length)],
      relatedSO: rng.nextInt(2) > 0 ? `#${String(2000 + rng.nextInt(100)).padStart(6, '0')}` : null,
      bookingNumber: rng.nextInt(2) > 0 ? `#${String(300000 + rng.nextInt(100)).padStart(6, '0')}` : null,
      scac: '',
      freightForwarder: '',
      truckFreight: null,
      deliveryNumber: '',
      releaseNumber: '',
      bookingNumber2: '',
      driverName: '',
      truckNumber: '',
      trailerNumber: '',
      containerNumber: '',
      sealNumber: '',
      notes: ''
    }
  }

  useEffect(() => {
    if (params?.id) {
      // First try to load from localStorage (for new loads created via modal)
      const storedData = localStorage.getItem(`load-form-data-${params.id}`)
      let data
      
      if (storedData) {
        // New load created via modal
        const formData = JSON.parse(storedData)
        data = {
          loadNumber: formData.loadNumber,
          expectedShipDate: formData.expectedShipDate,
          facility: formData.facility,
          relatedSO: formData.relatedSO,
          bookingNumber: formData.bookingNumber,
          status: formData.relatedSO ? 'Open' : 'Unassigned',
          materialsCount: 0,
          photosCount: 0,
          createdOn: new Date(),
          createdBy: 'Current User',
          shippingCarrier: '',
          scac: '',
          freightForwarder: '',
          truckFreight: null,
          deliveryNumber: '',
          releaseNumber: '',
          bookingNumber2: '',
          driverName: '',
          truckNumber: '',
          trailerNumber: '',
          containerNumber: '',
          sealNumber: '',
          notes: ''
        }
      } else {
        // Existing load from table - generate consistent data
        data = generateLoadData(params.id)
      }
      
      setLoadData(data)
      setMaterialsCount(data.materialsCount || 0)
      
      // Load saved materials if they exist
      const storedMaterials = localStorage.getItem(`load-materials-${params.id}`)
      if (storedMaterials) {
        const materials = JSON.parse(storedMaterials)
        console.log('Loaded saved materials:', materials)
        setSavedMaterials(materials)
        setMaterials(materials)
      }
      
      // Set form values
      const formValues = {
        relatedSO: data.relatedSO,
        bookingNumber: data.bookingNumber,
        expectedShipDate: data.expectedShipDate ? dayjs(data.expectedShipDate) : null,
        facility: data.facility,
        shippingCarrier: data.shippingCarrier || '',
        scac: data.scac || '',
        freightForwarder: data.freightForwarder || '',
        truckFreight: data.truckFreight || null,
        deliveryNumber: data.deliveryNumber || '',
        releaseNumber: data.releaseNumber || '',
        bookingNumber2: data.bookingNumber2 || '',
        driverName: data.driverName || '',
        truckNumber: data.truckNumber || '',
        trailerNumber: data.trailerNumber || '',
        containerNumber: data.containerNumber || '',
        sealNumber: data.sealNumber || '',
        notes: data.notes || ''
      }
      
      form.setFieldsValue(formValues)
      setOriginalFormData(formValues)
    }
  }, [params?.id, form])

  const handleFieldChange = () => {
    const currentValues = form.getFieldsValue()
    const hasChanges = JSON.stringify(currentValues) !== JSON.stringify(originalFormData)
    setHasChanges(hasChanges)
  }

  const handleSave = () => {
    const values = form.getFieldsValue()
    console.log('Save Load:', values)
    
    // Save materials to localStorage
    localStorage.setItem(`load-materials-${params.id}`, JSON.stringify(materials))
    
    // Update saved materials and count
    setSavedMaterials([...materials])
    setMaterialsCount(materials.length)
    
    // Update loadData materials count
    const updatedLoadData = { ...loadData, materialsCount: materials.length }
    setLoadData(updatedLoadData)
    localStorage.setItem(`load-form-data-${params.id}`, JSON.stringify(updatedLoadData))
    
    console.log(`Saved ${materials.length} materials for load ${params.id}`)
    
    setHasChanges(false)
    setOriginalFormData(values)
  }


  const handleDiscard = () => {
    form.setFieldsValue(originalFormData)
    setHasChanges(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Unassigned':
        return { color: '#6b7280', bgColor: '#f3f4f6' }
      case 'Open':
        return { color: '#1d4ed8', bgColor: '#dbeafe' }
      case 'Shipped':
        return { color: '#ea580c', bgColor: '#fed7aa' }
      case 'Pending Reconciliation':
        return { color: '#ea580c', bgColor: '#fed7aa' }
      case 'Reconciled':
        return { color: '#16a34a', bgColor: '#dcfce7' }
      case 'Closed':
        return { color: '#16a34a', bgColor: '#dcfce7' }
      case 'Voided':
        return { color: '#dc2626', bgColor: '#fecaca' }
      default:
        return { color: '#6b7280', bgColor: '#f3f4f6' }
    }
  }

  if (!loadData) {
    return (
      <div style={{ padding: '24px', background: '#F8F8F9', minHeight: '100vh' }}>
        <div style={{ 
          background: '#fff', 
          padding: '24px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h2>Loading Load #{params?.id || 'Unknown'}...</h2>
          <p>Please wait while we load the load details.</p>
          <div style={{ marginTop: '16px' }}>
            <button onClick={() => window.history.back()}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  const statusColors = getStatusColor(loadData.status)

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
      <div style={{ 
        padding: '24px', 
        background: '#F8F8F9', 
        minHeight: '100vh',
        width: '100%'
      }}>
      {/* Header with Tabs */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        marginBottom: '12px'
      }}>
        <div style={{ padding: '24px 24px 0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Button
                icon={<ArrowLeft size={16} />}
                onClick={() => window.history.back()}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                    Load {loadData.loadNumber}
                  </h1>
                  <Tag
                    style={{
                      backgroundColor: statusColors.bgColor,
                      color: statusColors.color,
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    {loadData.status}
                  </Tag>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>
                    Created on {loadData.createdOn ? new Date(loadData.createdOn).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Loading...'} by {loadData.createdBy || 'Loading...'}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                danger
                icon={<Trash2 size={16} />}
                onClick={() => console.log('Void load')}
              >
                Void
              </Button>
            </div>
          </div>
        </div>
        
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'load-info',
              label: 'Load & Shipment Info',
            },
            {
              key: 'materials',
              label: (
                <span>
                  Materials <Tag style={{ marginLeft: '8px', fontSize: '10px' }}>{materialsCount}</Tag>
                </span>
              ),
            },
            {
              key: 'photos',
              label: (
                <span>
                  Photos <Tag style={{ marginLeft: '8px', fontSize: '10px' }}>{loadData.photosCount || 0}</Tag>
                </span>
              ),
            },
            {
              key: 'documents',
              label: 'Documents',
            },
            {
              key: 'notes',
              label: 'Notes',
            },
          ]}
          style={{ padding: '0 24px', marginTop: '16px' }}
          tabBarStyle={{ marginBottom: 0, borderBottom: 'none' }}
        />
      </div>

      {/* Main Content */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        padding: activeTab === 'load-info' ? '24px' : '0'
      }}>
        {activeTab === 'load-info' && (
          <Form
            form={form}
            layout="vertical"
            onValuesChange={handleFieldChange}
          >
            {/* Basic Info Section */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>Basic Info</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0px 12px' }}>
                <Form.Item
                  label="Related Sales Order #"
                  name="relatedSO"
                  allowClear
                >
                  <Select placeholder="Select SO">
                    <Select.Option value="#002001">#002001</Select.Option>
                    <Select.Option value="#002002">#002002</Select.Option>
                    <Select.Option value="#002003">#002003</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  label="Booking #"
                  name="bookingNumber"
                  allowClear
                >
                  <Select placeholder="Select Booking">
                    <Select.Option value="#300001">#300001</Select.Option>
                    <Select.Option value="#300002">#300002</Select.Option>
                    <Select.Option value="#300003">#300003</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  label={<span>Expected Ship Date <span style={{ color: 'red' }}>*</span></span>}
                  name="expectedShipDate"
                  required={false}
                  rules={[{ required: true }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item
                  label={<span>Facility <span style={{ color: 'red' }}>*</span></span>}
                  name="facility"
                  required={false}
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Select Facility">
                    <Select.Option value="ReMatter Headquarters">ReMatter Headquarters</Select.Option>
                    <Select.Option value="ReMatter Ohio">ReMatter Ohio</Select.Option>
                    <Select.Option value="ReMatter San Diego">ReMatter San Diego</Select.Option>
                    <Select.Option value="ReMatter Los Angeles">ReMatter Los Angeles</Select.Option>
                    <Select.Option value="ReMatter Texas">ReMatter Texas</Select.Option>
                    <Select.Option value="ReMatter Newport Beach">ReMatter Newport Beach</Select.Option>
                    <Select.Option value="ReMatter SantaMonica">ReMatter SantaMonica</Select.Option>
                    <Select.Option value="ReMatter Lake Tahoe">ReMatter Lake Tahoe</Select.Option>
                    <Select.Option value="ReMatter Denver">ReMatter Denver</Select.Option>
                  </Select>
                </Form.Item>
              </div>
            </div>

            {/* Shipping Carrier Information Section */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>Shipping Carrier Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0px 12px' }}>
                <Form.Item label="Shipping Carrier" name="shippingCarrier">
                  <Input placeholder="Enter carrier name" />
                </Form.Item>
                <Form.Item label="SCAC" name="scac">
                  <Input placeholder="Enter SCAC code" />
                </Form.Item>
                <Form.Item label="Freight Forwarder" name="freightForwarder">
                  <Input placeholder="Enter forwarder name" />
                </Form.Item>
                <Form.Item label="Truck Freight" name="truckFreight">
                  <InputNumber style={{ width: '100%' }} placeholder="Enter amount" />
                </Form.Item>
                <Form.Item label="Delivery Number" name="deliveryNumber">
                  <Input placeholder="Enter delivery number" />
                </Form.Item>
                <Form.Item label="Release Number" name="releaseNumber">
                  <Input placeholder="Enter release number" />
                </Form.Item>
                <Form.Item label="Booking Number" name="bookingNumber2">
                  <Input placeholder="Enter booking number" />
                </Form.Item>
                <Form.Item label="Driver Name" name="driverName">
                  <Input placeholder="Enter driver name" />
                </Form.Item>
                <Form.Item label="Truck Number" name="truckNumber">
                  <Input placeholder="Enter truck number" />
                </Form.Item>
                <Form.Item label="Trailer Number" name="trailerNumber">
                  <Input placeholder="Enter trailer number" />
                </Form.Item>
                <Form.Item label="Container Number" name="containerNumber">
                  <Input placeholder="Enter container number" />
                </Form.Item>
                <Form.Item label="Seal Number" name="sealNumber">
                  <Input placeholder="Enter seal number" />
                </Form.Item>
              </div>
            </div>
          </Form>
        )}
        
        {activeTab === 'materials' && (
          <div style={{ padding: '24px' }}>
            {materials.length === 0 ? (
              <div style={{ textAlign: 'center' }}>
                <FileText size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
                <h3 style={{ marginBottom: '8px', color: '#6b7280' }}>No materials added yet</h3>
                <p style={{ color: '#9ca3af', marginBottom: '24px' }}>Add materials to this load to get started.</p>
                <Button 
                  type="primary" 
                  icon={<Plus size={16} />}
                  onClick={() => setMaterials([{ id: 1 }])}
                >
                  Add Material
                </Button>
              </div>
            ) : (
              <div>
                {/* Header with title and toggles */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '24px'
                }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Load Materials</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Weight Mode Toggle - Same as SO Materials */}
                    {materials.length > 0 && (
                      <div style={{ 
                        display: 'flex', 
                        background: '#f3f4f6', 
                        borderRadius: '8px', 
                        padding: '2px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <button
                          onClick={() => setWeightMode('scale')}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: weightMode === 'scale' ? '#3b82f6' : 'transparent',
                            color: weightMode === 'scale' ? '#fff' : '#374151',
                            fontWeight: '500',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          Scale Unit Weight
                        </button>
                        <button
                          onClick={() => setWeightMode('price')}
                          disabled={requestMode === 'staged'}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: weightMode === 'price' ? '#3b82f6' : 'transparent',
                            color: requestMode === 'staged' ? '#9ca3af' : (weightMode === 'price' ? '#fff' : '#374151'),
                            fontWeight: '500',
                            fontSize: '14px',
                            cursor: requestMode === 'staged' ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: requestMode === 'staged' ? 0.5 : 1
                          }}
                        >
                          Price Unit Weight
                        </button>
                      </div>
                    )}
                    
                    {/* Request/Stage Mode Toggle */}
                    {materials.length > 0 && (
                      <div style={{ 
                        display: 'flex', 
                        background: '#f3f4f6', 
                        borderRadius: '8px', 
                        padding: '2px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <button
                          onClick={() => setRequestMode('request')}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: requestMode === 'request' ? '#3b82f6' : 'transparent',
                            color: requestMode === 'request' ? '#fff' : '#374151',
                            fontWeight: '500',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Monitor size={16} />
                          Request
                        </button>
                        <button
                          onClick={() => setRequestMode('staged')}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: requestMode === 'staged' ? '#3b82f6' : 'transparent',
                            color: requestMode === 'staged' ? '#fff' : '#374151',
                            fontWeight: '500',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Weight size={16} />
                          Stage
                        </button>
                      </div>
                    )}

                    {/* Show Scales Toggle */}
                    {materials.length > 0 && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        border: '1px solid #d1d5db',
                        height: '38px',
                        padding: '0 6px',
                        borderRadius: '8px',
                        opacity: requestMode === 'request' ? 0.5 : 1
                      }}>
                        <button
                          onClick={() => requestMode === 'staged' && setShowScales(!showScales)}
                          disabled={requestMode === 'request'}
                          style={{
                            width: '40px',
                            height: '20px',
                            borderRadius: '10px',
                            border: 'none',
                            background: showScales ? '#3b82f6' : '#d1d5db',
                            cursor: requestMode === 'request' ? 'not-allowed' : 'pointer',
                            position: 'relative',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              background: '#fff',
                              position: 'absolute',
                              top: '2px',
                              left: showScales ? '22px' : '2px',
                              transition: 'left 0.2s',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                            }}
                          />
                        </button>
                        <span style={{ fontSize: '14px', color: requestMode === 'request' ? '#9ca3af' : '#374151' }}>Show Scales</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Materials Table and Scales Section */}
                <div style={{ display: 'flex', gap: '24px' }}>
                  {/* Materials Table */}
                  <div style={{ flex: requestMode === 'staged' && showScales ? '0 0 76%' : '1', marginBottom: '6px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {requestMode === 'request' ? (
                          <>
                            <th style={{ padding: '0px 8px 0px 8px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Material</th>
                            <th style={{ padding: '0px 8px 0px 8px', textAlign: 'right', fontWeight: '600', fontSize: '14px' }}>Net Weight</th>
                            <th style={{ padding: '0px 8px 0px 8px', textAlign: 'right', fontWeight: '600', fontSize: '14px' }}>Unit Price</th>
                            <th style={{ padding: '0px 8px 0px 8px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Pricing Unit</th>
                            <th style={{ padding: '0px 8px 0px 8px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Inventory Tags</th>
                            <th style={{ padding: '0px 8px 0px 8px', textAlign: 'right', fontWeight: '600', fontSize: '14px' }}>Estimated Total</th>
                            <th style={{ padding: '0px 8px 0px 8px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}></th>
                          </>
                        ) : (
                          <>
                            <th style={{ padding: '0px 8px 0px 8px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Materials</th>
                            <th style={{ padding: '0px 8px 0px 8px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Gross</th>
                            <th style={{ padding: '0px 8px 0px 8px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Tare</th>
                            <th style={{ padding: '0px 8px 0px 8px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Net</th>
                            <th style={{ padding: '0px 8px 0px 8px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}></th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((material, index) => (
                        <tr 
                          key={material.id} 
                          style={{ 
                            marginTop: index > 0 ? '-40px' : '0px',
                            cursor: 'pointer',
                            backgroundColor: selectedMaterialForWeighing?.id === material.id ? '#f0f9ff' : 'transparent'
                          }}
                          onClick={() => handleSelectMaterialForWeighing(material)}
                        >
                          {requestMode === 'request' ? (
                            <>
                              <td style={{ padding: '6px' }} onClick={(e) => e.stopPropagation()}>
                                <Select
                                  placeholder="Select Material"
                                  style={{ width: '100%', height: '40px' }}
                                  value={material.contractMaterial}
                                  onChange={(value) => updateMaterial(index, 'contractMaterial', value)}
                                  showSearch
                                  filterOption={(input, option) =>
                                    (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                                  }
                                >
                                  {availableMaterials.map((mat) => (
                                    <Select.Option key={mat.name} value={mat.name}>
                                      {mat.name}
                                    </Select.Option>
                                  ))}
                                </Select>
                              </td>
                              <td style={{ padding: '6px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                {/* Net Weight Field - Same as SO Materials */}
                                {material.isEachMaterial ? (
                                  <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    background: '#fff',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    padding: '8px 12px',
                                    height: '40px'
                                  }}>
                                    <span style={{ fontSize: '12px', color: '#6b7280', marginRight: '8px' }}>N</span>
                                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'space-between' }}>
                                      <InputNumber
                                        value={material.netWeight || 0}
                                        onChange={(val) => updateMaterial(index, 'netWeight', val || 0)}
                                        style={{ 
                                          flex: 1,
                                          border: 'none',
                                          background: 'transparent',
                                          textAlign: 'right',
                                          boxShadow: 'none',
                                          padding: 0,
                                          color: '#071429',
                                          fontWeight: '500'
                                        }}
                                        min={0}
                                        precision={0}
                                      />
                                      <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>ea</span>
                                    </div>
                                  </div>
                                ) : (
                                  (() => {
                                    // Convert weight based on mode for regular materials (same as SO Materials)
                                    const displayWeight = weightMode === 'scale' ? (material.netWeight || 0) : convertWeight(material.netWeight || 0, 'lb', material.pricingUnit || 'lb')
                                    const displayUnit = weightMode === 'scale' ? 'lb' : (material.pricingUnit || 'lb')
                                    
                                    return (
                                      <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        background: '#fff',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                        height: '40px'
                                      }}>
                                        <span style={{ fontSize: '12px', color: '#6b7280', marginRight: '8px' }}>N</span>
                                        <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'space-between' }}>
                                          <InputNumber
                                            value={displayWeight}
                                            onChange={(val) => {
                                              // Always store weight in pounds internally
                                              const newWeight = weightMode === 'scale' ? val || 0 : convertWeight(val || 0, material.pricingUnit || 'lb', 'lb')
                                              updateMaterial(index, 'netWeight', newWeight)
                                            }}
                                            style={{ 
                                              flex: 1,
                                              border: 'none',
                                              background: 'transparent',
                                              textAlign: 'right',
                                              boxShadow: 'none',
                                              padding: 0,
                                              color: '#071429',
                                              fontWeight: '500'
                                            }}
                                            min={0}
                                            precision={2}
                                          />
                                          <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>{displayUnit}</span>
                                        </div>
                                      </div>
                                    )
                                  })()
                                )}
                              </td>
                              <td style={{ padding: '6px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                {/* Unit Price Field - Same as SO Materials */}
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  background: '#fff',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  padding: '8px 12px',
                                  height: '40px',
                                  gap: '8px'
                                }}>
                                  {/* Toggle between $ and fx modes */}
                                  <div style={{ 
                                    display: 'flex', 
                                    background: '#f3f4f6', 
                                    borderRadius: '4px', 
                                    padding: '2px 2px 2px 3px',
                                    border: '1px solid #e5e7eb'
                                  }}>
                                    <button
                                      onClick={() => updateMaterial(index, 'isFormula', false)}
                                      style={{
                                        padding: '4px 8px',
                                        borderRadius: '3px',
                                        border: 'none',
                                        background: !material.isFormula ? '#3b82f6' : 'transparent',
                                        color: !material.isFormula ? '#fff' : '#374151',
                                        fontWeight: '500',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                    >
                                      $
                                    </button>
                                    <button
                                      onClick={() => updateMaterial(index, 'isFormula', true)}
                                      style={{
                                        padding: '4px 8px',
                                        borderRadius: '3px',
                                        border: 'none',
                                        background: material.isFormula ? '#3b82f6' : 'transparent',
                                        color: material.isFormula ? '#fff' : '#374151',
                                        fontWeight: '500',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                    >
                                      fx
                                    </button>
                                  </div>
                                  
                                  {/* Input field */}
                                  {material.isFormula ? (
                                    <div style={{ position: 'relative', flex: 1 }} className="formula-input">
                                      <Input
                                        ref={(el) => { inputRefs.current[index] = el }}
                                        value={typeof material.unitPrice === 'string' ? material.unitPrice : ''}
                                        onChange={(e) => {
                                          const newValue = e.target.value
                                          
                                          // Update the material
                                          updateMaterial(index, 'unitPrice', newValue)
                                          
                                          // Check for $ and show dropdown
                                          if (newValue.includes('$')) {
                                            const inputElement = inputRefs.current[index]
                                            if (inputElement) {
                                              const rect = inputElement.getBoundingClientRect()
                                              
                                              setDropdownPosition(prev => ({
                                                ...prev,
                                                [index]: {
                                                  top: rect.bottom + 4,
                                                  left: rect.left - 8
                                                }
                                              }))
                                              
                                              setDropdownVisible(prev => ({
                                                ...prev,
                                                [index]: true
                                              }))
                                            }
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          // Also check on keydown for immediate response
                                          if (e.key === '$' || (e.shiftKey && e.key === '4')) {
                                            setTimeout(() => {
                                              const inputElement = inputRefs.current[index]
                                              if (inputElement) {
                                                const rect = inputElement.getBoundingClientRect()
                                                setDropdownPosition(prev => ({
                                                  ...prev,
                                                  [index]: {
                                                    top: rect.bottom + 4,
                                                    left: rect.left - 8
                                                  }
                                                }))
                                                setDropdownVisible(prev => ({
                                                  ...prev,
                                                  [index]: true
                                                }))
                                              }
                                            }, 0)
                                          }
                                        }}
                                        placeholder="Enter formula (e.g., COMEX * 0.6 + 12)"
                                        style={{ 
                                          border: 'none',
                                          background: 'transparent',
                                          textAlign: 'right',
                                          boxShadow: 'none',
                                          padding: 0,
                                          fontFamily: 'monospace'
                                        }}
                                      />
                                      
                                      {/* Variable Dropdown */}
                                      {(dropdownVisible[index] || (typeof material.unitPrice === 'string' && material.unitPrice.includes('$'))) && (
                                        <div
                                          className="formula-dropdown"
                                          style={{
                                            position: 'absolute',
                                            top: dropdownPosition[index]?.top || 40,
                                            left: dropdownPosition[index]?.left || 0,
                                            width: '150px',
                                            background: '#fff',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            zIndex: 1000,
                                            maxHeight: '200px',
                                            overflowY: 'auto'
                                          }}
                                        >
                                          {['COMEX', 'LME', 'SHFE', 'NYMEX', 'CASH', 'SPOT', 'FUTURES'].map(variable => (
                                            <div
                                              key={variable}
                                              onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                insertVariable(index, variable)
                                              }}
                                              style={{
                                                padding: '8px 12px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                color: '#374151',
                                                borderBottom: '1px solid #f3f4f6',
                                                transition: 'background-color 0.2s',
                                                textAlign: 'left'
                                              }}
                                              onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#f3f4f6'
                                              }}
                                              onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#fff'
                                              }}
                                            >
                                              {variable}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <InputNumber
                                      value={typeof material.unitPrice === 'number' ? material.unitPrice : 0}
                                      onChange={(val) => updateMaterial(index, 'unitPrice', val || 0)}
                                      style={{ 
                                        flex: 1,
                                        border: 'none',
                                        background: 'transparent',
                                        textAlign: 'right',
                                        boxShadow: 'none',
                                        padding: 0
                                      }}
                                      min={0}
                                      precision={2}
                                    />
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: '6px' }} onClick={(e) => e.stopPropagation()}>
                                <Select
                                  value={material.pricingUnit || 'lb'}
                                  onChange={(value) => updateMaterial(index, 'pricingUnit', value)}
                                  style={{ width: '80px', height: '40px' }}
                                  disabled={(() => {
                                    // Only disable for inherently "each" materials, not user-selected "each"
                                    const selectedMaterial = availableMaterials.find(am => am.name === material.contractMaterial)
                                    return selectedMaterial?.isEachMaterial || false
                                  })()}
                                >
                                  <Select.Option value="lb">lb</Select.Option>
                                  <Select.Option value="NT">NT</Select.Option>
                                  <Select.Option value="kg">kg</Select.Option>
                                  <Select.Option value="MT">MT</Select.Option>
                                  <Select.Option value="ea">ea</Select.Option>
                                </Select>
                              </td>
                              <td style={{ padding: '6px' }} onClick={(e) => e.stopPropagation()}>
                                <Select
                                  mode="multiple"
                                  placeholder="Select Tags"
                                  style={{ width: '120px', height: '40px' }}
                                  value={material.inventoryTags || []}
                                  onChange={(value) => updateMaterial(index, 'inventoryTags', value)}
                                  maxTagCount={1}
                                  maxTagTextLength={6}
                                  tagRender={(props) => {
                                    const { label, closable, onClose } = props;
                                    const tags = material.inventoryTags || [];
                                    
                                    // Only render the first tag, or show count if multiple
                                    if (props.index === 0) {
                                      if (tags.length === 1) {
                                        return (
                                          <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            padding: '2px 6px',
                                            backgroundColor: '#f3f4f6',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            marginRight: '4px'
                                          }}>
                                            {label}
                                            {closable && (
                                              <span 
                                                onClick={onClose}
                                                style={{ marginLeft: '4px', cursor: 'pointer' }}
                                              >
                                                ×
                                              </span>
                                            )}
                                          </span>
                                        );
                                      } else if (tags.length > 1) {
                                        return (
                                          <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            padding: '2px 6px',
                                            backgroundColor: '#f3f4f6',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            marginRight: '4px'
                                          }}>
                                            {tags.length} tags
                                            {closable && (
                                              <span 
                                                onClick={onClose}
                                                style={{ marginLeft: '4px', cursor: 'pointer' }}
                                              >
                                                ×
                                              </span>
                                            )}
                                          </span>
                                        );
                                      }
                                    }
                                    return null;
                                  }}
                                >
                                  <Select.Option value="TAG001">TAG001</Select.Option>
                                  <Select.Option value="TAG002">TAG002</Select.Option>
                                  <Select.Option value="TAG003">TAG003</Select.Option>
                                  <Select.Option value="TAG004">TAG004</Select.Option>
                                </Select>
                              </td>
                              <td style={{ padding: '6px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                <div style={{
                                  backgroundColor: '#f3f4f6',
                                  borderRadius: '6px',
                                  padding: '8px 12px',
                                  height: '40px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  minWidth: '100px'
                                }}>
                                  <span style={{ color: '#071429', fontWeight: '500' }}>$</span>
                                  <span style={{ color: '#071429', fontWeight: '500' }}>
                                    {(material.estimatedTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: '6px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                <Button
                                  danger
                                  icon={<Trash2 size={16} />}
                                  style={{ width: '40px', height: '40px' }}
                                  onClick={() => {
                                    const newMaterials = materials.filter((_, i) => i !== index)
                                    setMaterials(newMaterials)
                                  }}
                                />
                              </td>
                            </>
                          ) : (
                            <>
                              {/* Stage Mode Fields */}
                              <td style={{ padding: '6px' }} onClick={(e) => e.stopPropagation()}>
                                <Select
                                  placeholder="Select Material"
                                  style={{ width: '100%', height: '40px' }}
                                  value={material.contractMaterial}
                                  onChange={(value) => {
                                    // Check if it's a tagged material and prefill weights
                                    const selectedTaggedMaterial = availableTaggedMaterials.find(atm => atm.name === value)
                                    if (selectedTaggedMaterial) {
                                      // Update all fields at once for tagged materials
                                      const updatedMaterials = [...materials]
                                      updatedMaterials[index] = {
                                        ...updatedMaterials[index],
                                        contractMaterial: value,
                                        grossWeight: selectedTaggedMaterial.grossWeight,
                                        tareWeight: selectedTaggedMaterial.tareWeight,
                                        netWeight: selectedTaggedMaterial.netWeight,
                                        isTaggedMaterial: true,
                                        tagNumber: selectedTaggedMaterial.name.split(' ')[0],
                                        isEachMaterial: selectedTaggedMaterial.isEachMaterial,
                                        pricingUnit: selectedTaggedMaterial.isEachMaterial ? 'ea' : 'lb'
                                      }
                                      setMaterials(updatedMaterials)
                                      setHasChanges(true)
                                    } else {
                                      // Regular material selection - update all fields at once
                                      const updatedMaterials = [...materials]
                                      updatedMaterials[index] = {
                                        ...updatedMaterials[index],
                                        contractMaterial: value,
                                        isTaggedMaterial: false,
                                        tagNumber: ''
                                      }
                                      setMaterials(updatedMaterials)
                                      setHasChanges(true)
                                    }
                                  }}
                                  showSearch
                                  filterOption={(input, option) =>
                                    (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                                  }
                                >
                                  {(material.isTaggedMaterial ? availableTaggedMaterials : availableMaterials).map((mat) => (
                                    <Select.Option key={mat.name} value={mat.name}>
                                      {mat.name}
                                    </Select.Option>
                                  ))}
                                </Select>
                              </td>
                              <td style={{ padding: '6px', textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
                                {/* Gross Field */}
                                {(() => {
                                  const selectedMaterial = material.isTaggedMaterial 
                                    ? availableTaggedMaterials.find(am => am.name === material.contractMaterial)
                                    : availableMaterials.find(am => am.name === material.contractMaterial)
                                  const isEachMaterial = selectedMaterial?.isEachMaterial || false
                                  
                                  return (
                                    <div 
                                      style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        background: '#fff',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                        height: '40px',
                                        cursor: 'pointer'
                                      }}
                                      onClick={() => handleFieldClick(material, 'gross')}
                                    >
                                      <span style={{ fontSize: '12px', color: '#6b7280', marginRight: '8px' }}>G</span>
                                      <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'space-between' }}>
                                        <InputNumber
                                          value={material.grossWeight || 0}
                                          onChange={(val) => updateMaterial(index, 'grossWeight', val || 0)}
                                          style={{ 
                                            flex: 1,
                                            border: 'none',
                                            background: 'transparent',
                                            textAlign: 'left',
                                            boxShadow: 'none',
                                            padding: 0,
                                            color: '#071429',
                                            fontWeight: '500'
                                          }}
                                          min={0}
                                          precision={isEachMaterial ? 0 : 2}
                                        />
                                        <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                                          {isEachMaterial ? 'ea' : 'lb'}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })()}
                              </td>
                              {(() => {
                                const selectedMaterial = availableMaterials.find(am => am.name === material.contractMaterial)
                                const isEachMaterial = selectedMaterial?.isEachMaterial || false
                                
                                if (isEachMaterial) {
                                  // For "each" materials, show only Gross field, skip Tare and Net
                                  return (
                                    <>
                                      <td style={{ padding: '6px', textAlign: 'left' }}>
                                        {/* Empty cell for Tare */}
                                      </td>
                                      <td style={{ padding: '6px', textAlign: 'left' }}>
                                        {/* Empty cell for Net */}
                                      </td>
                                    </>
                                  )
                                } else {
                                  // For regular materials, show Tare and Net fields
                                  return (
                                    <>
                                      <td style={{ padding: '6px', textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
                                        {/* Tare Field */}
                                        <div 
                                          style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            background: '#fff',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            padding: '8px 12px',
                                            height: '40px',
                                            cursor: 'pointer'
                                          }}
                                          onClick={() => handleFieldClick(material, 'tare')}
                                        >
                                          <span style={{ fontSize: '12px', color: '#6b7280', marginRight: '8px' }}>T</span>
                                          <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'space-between' }}>
                                            <InputNumber
                                              value={material.tareWeight || 0}
                                              onChange={(val) => updateMaterial(index, 'tareWeight', val || 0)}
                                              style={{ 
                                                flex: 1,
                                                border: 'none',
                                                background: 'transparent',
                                                textAlign: 'left',
                                                boxShadow: 'none',
                                                padding: 0,
                                                color: '#071429',
                                                fontWeight: '500'
                                              }}
                                              min={0}
                                              precision={2}
                                            />
                                            <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>lb</span>
                                          </div>
                                        </div>
                                      </td>
                                      <td style={{ padding: '6px', textAlign: 'left' }}>
                                        {/* Net Field - Read Only (Gross - Tare) */}
                                        <div style={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          background: '#f3f4f6',
                                          border: '1px solid #d1d5db',
                                          borderRadius: '6px',
                                          padding: '8px 12px',
                                          height: '40px'
                                        }}>
                                          <span style={{ fontSize: '12px', color: '#6b7280', marginRight: '8px' }}>N</span>
                                          <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'space-between' }}>
                                            <span style={{ 
                                              flex: 1,
                                              textAlign: 'left',
                                              color: '#071429',
                                              fontWeight: '500'
                                            }}>
                                              {((material.grossWeight || 0) - (material.tareWeight || 0)).toFixed(2)}
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>lb</span>
                                          </div>
                                        </div>
                                      </td>
                                    </>
                                  )
                                }
                              })()}
                              <td style={{ padding: '6px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <Button
                                    icon={<Camera size={16} />}
                                    style={{ width: '40px', height: '40px' }}
                                  />
                                  <Button
                                    danger
                                    icon={<Trash2 size={16} />}
                                    style={{ width: '40px', height: '40px' }}
                                    onClick={() => {
                                      const newMaterials = materials.filter((_, i) => i !== index)
                                      setMaterials(newMaterials)
                                    }}
                                  />
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                      
                      {/* Stage Mode Summary Row */}
                      {requestMode === 'staged' && materials.length > 0 && (
                        <tr>
                          <td style={{ padding: '6px', textAlign: 'left' }}>
                            <span style={{ fontSize: '14px', color: '#071429' }}>
                              <strong>{materials.length} Materials</strong>
                            </span>
                          </td>
                          <td style={{ padding: '6px', textAlign: 'left' }}>
                            <div style={{ fontSize: '14px', color: '#071429' }}>
                              {(() => {
                                const lbMaterials = materials.filter(m => {
                                  const selectedMaterial = availableTaggedMaterials.find(am => am.name === m.contractMaterial)
                                  return !selectedMaterial?.isEachMaterial
                                })
                                const eaMaterials = materials.filter(m => {
                                  const selectedMaterial = availableTaggedMaterials.find(am => am.name === m.contractMaterial)
                                  return selectedMaterial?.isEachMaterial
                                })
                                
                                const lbTotal = lbMaterials.reduce((sum, m) => sum + (m.grossWeight || 0), 0)
                                const eaTotal = eaMaterials.reduce((sum, m) => sum + (m.grossWeight || 0), 0)
                                
                                return (
                                  <>
                                    {lbTotal > 0 && (
                                      <div style={{ fontWeight: 'bold' }}>
                                        <strong>{lbTotal.toFixed(2)}</strong> <span style={{ fontWeight: 'normal', color: '#6b7280' }}>lb</span>
                                      </div>
                                    )}
                                    {eaTotal > 0 && (
                                      <div style={{ fontWeight: 'bold' }}>
                                        <strong>{eaTotal.toFixed(0)}</strong> <span style={{ fontWeight: 'normal', color: '#6b7280' }}>ea</span>
                                      </div>
                                    )}
                                    {lbTotal === 0 && eaTotal === 0 && (
                                      <div style={{ fontWeight: 'bold' }}>
                                        <strong>0.00</strong> <span style={{ fontWeight: 'normal', color: '#6b7280' }}>lb</span>
                                      </div>
                                    )}
                                  </>
                                )
                              })()}
                            </div>
                          </td>
                          <td style={{ padding: '6px', textAlign: 'left' }}>
                            <span style={{ fontSize: '14px', color: '#071429' }}>
                              <strong>
                                {(() => {
                                  const lbMaterials = materials.filter(m => {
                                    const selectedMaterial = availableTaggedMaterials.find(am => am.name === m.contractMaterial)
                                    return !selectedMaterial?.isEachMaterial
                                  })
                                  const lbTotal = lbMaterials.reduce((sum, m) => sum + (m.tareWeight || 0), 0)
                                  return lbTotal > 0 ? `${lbTotal.toFixed(2)} lb` : '0.00 lb'
                                })()}
                              </strong>
                            </span>
                          </td>
                          <td style={{ padding: '6px', textAlign: 'left' }}>
                            <div style={{ fontSize: '14px', color: '#071429' }}>
                              {(() => {
                                const lbMaterials = materials.filter(m => {
                                  const selectedMaterial = availableTaggedMaterials.find(am => am.name === m.contractMaterial)
                                  return !selectedMaterial?.isEachMaterial
                                })
                                const eaMaterials = materials.filter(m => {
                                  const selectedMaterial = availableTaggedMaterials.find(am => am.name === m.contractMaterial)
                                  return selectedMaterial?.isEachMaterial
                                })
                                
                                const lbNetTotal = lbMaterials.reduce((sum, m) => sum + ((m.grossWeight || 0) - (m.tareWeight || 0)), 0)
                                const eaTotal = eaMaterials.reduce((sum, m) => sum + (m.grossWeight || 0), 0)
                                
                                return (
                                  <>
                                    {lbNetTotal > 0 && (
                                      <div style={{ fontWeight: 'bold' }}>
                                        <strong>{lbNetTotal.toFixed(2)}</strong> <span style={{ fontWeight: 'normal', color: '#6b7280' }}>lb</span>
                                      </div>
                                    )}
                                    {eaTotal > 0 && (
                                      <div style={{ fontWeight: 'bold' }}>
                                        <strong>{eaTotal.toFixed(0)}</strong> <span style={{ fontWeight: 'normal', color: '#6b7280' }}>ea</span>
                                      </div>
                                    )}
                                    {lbNetTotal === 0 && eaTotal === 0 && (
                                      <div style={{ fontWeight: 'bold' }}>
                                        <strong>0.00</strong> <span style={{ fontWeight: 'normal', color: '#6b7280' }}>lb</span>
                                      </div>
                                    )}
                                  </>
                                )
                              })()}
                            </div>
                          </td>
                          <td style={{ padding: '6px', textAlign: 'center' }}>
                            {/* Empty cell for Actions column */}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  </div>

                  {/* Scales and Camera Section - Only in Stage Mode and when Show Scales is enabled */}
                  {requestMode === 'staged' && showScales && (
                    <div style={{ flex: '0 0 24%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Scale Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Select
                          value={selectedScale}
                          onChange={setSelectedScale}
                          style={{ width: '80px' }}
                          size="small"
                        >
                          <Select.Option value="FS1">FS1</Select.Option>
                          <Select.Option value="FS2">FS2</Select.Option>
                          <Select.Option value="TS1">TS1</Select.Option>
                          <Select.Option value="TS2">TS2</Select.Option>
                          <Select.Option value="TS3">TS3</Select.Option>
                        </Select>
                      </div>

                      {/* Current Weight Display with Button and Camera */}
                      <div style={{ 
                        padding: '16px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                      }}>
                        {/* Weight Display */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          gap: '8px'
                        }}>
                          <div style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
                            {selectedFieldForWeighing && materialWeight !== null ? `${materialWeight} lb` : '0 lb'}
                          </div>
                          {selectedFieldForWeighing && materialWeight !== null && (
                            <CheckCircle size={20} color="#10b981" />
                          )}
                        </div>


                        {/* Take Weight Button */}
                        <Button 
                          type="primary" 
                          size="large"
                          style={{ width: '100%' }}
                          onClick={handleTakeWeight}
                          disabled={!selectedFieldForWeighing || materialWeight === null}
                        >
                          Take weight
                          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>SPACE</div>
                        </Button>
                        

                        {/* Camera Preview */}
                        <div style={{ 
                          position: 'relative',
                          backgroundColor: '#000',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          aspectRatio: '4/3',
                          minHeight: '200px'
                        }}>
                          {/* Camera Feed GIF */}
                          <img 
                            src="https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif"
                            alt="Truck driving in scrap yard"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '8px'
                            }}
                            onError={(e) => {
                              // Fallback to placeholder if GIF fails to load
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling.style.display = 'block'
                            }}
                          />
                          
                          {/* Fallback Placeholder */}
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: '#fff',
                            fontSize: '16px',
                            textAlign: 'center',
                            display: 'none'
                          }}>
                            <Camera size={48} style={{ marginBottom: '8px', opacity: 0.5 }} />
                            <div>Camera Preview</div>
                            <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                              2023 Sat 11:52:57
                            </div>
                          </div>
                          
                          {/* Live indicator */}
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <div style={{
                              width: '6px',
                              height: '6px',
                              backgroundColor: '#fff',
                              borderRadius: '50%',
                              animation: 'pulse 2s infinite'
                            }}></div>
                            LIVE
                          </div>
                          
                          {/* Timestamp overlay */}
                          <div style={{
                            position: 'absolute',
                            bottom: '8px',
                            left: '8px',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontFamily: 'monospace'
                          }}>
                            2023 Sat 11:52:57
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>


                {/* Summary Section */}
                {requestMode === 'request' ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    padding: '0px 0'
                  }}>
                    {/* Material column summary */}
                    <div style={{ width: '200px', textAlign: 'left' }}>
                      <span style={{ fontSize: '14px', color: '#071429' }}>
                        <strong>{materials.length} Materials</strong>
                      </span>
                    </div>
                    
                    {/* Net Weight column summary */}
                    <div style={{ width: '120px', textAlign: 'right' }}>
                      <span style={{ fontSize: '14px', color: '#071429' }}>
                        <strong>{materials.reduce((sum, m) => {
                          if (m.isEachMaterial) return sum
                          const weightInPounds = convertWeight(m.netWeight || 0, weightMode === 'scale' ? 'lb' : (m.pricingUnit || 'lb'), 'lb')
                          return sum + weightInPounds
                        }, 0).toFixed(2)} lb</strong>
                      </span>
                    </div>
                    
                    {/* Unit Price column - empty */}
                    <div style={{ width: '120px' }}></div>
                    
                    {/* Pricing Unit column - empty */}
                    <div style={{ width: '100px' }}></div>
                    
                    {/* Inventory Tags column - empty */}
                    <div style={{ width: '120px' }}></div>
                    
                    {/* Estimated Total column summary */}
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <span style={{ fontSize: '14px', color: '#071429' }}>
                        <strong>${(Math.round(materials.reduce((sum, m) => sum + (m.estimatedTotal || 0), 0) * 100) / 100).toFixed(2)}</strong>
                      </span>
                    </div>
                    
                    {/* Actions column - empty */}
                    <div style={{ width: '80px' }}></div>
                  </div>
                ) : null}
                
                {/* Add Material Buttons */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-start',
                  gap: '12px',
                  padding: '16px 0 0 0'
                }}>
                  <Button
                    icon={<Plus size={16} />}
                    onClick={() => {
                      const newMaterial: Material = {
                        id: Date.now(),
                        contractMaterial: '',
                        netWeight: 0,
                        unitPrice: 0,
                        pricingUnit: 'lb',
                        inventoryTags: '',
                        estimatedTotal: 0,
                        isEachMaterial: false,
                        isFormula: false,
                        selectedExchange: 'COMEX',
                        isTaggedMaterial: false,
                        tagNumber: ''
                      }
                      const newMaterials = [...materials, newMaterial]
                      setMaterials(newMaterials)
                      setHasChanges(true)
                    }}
                    style={{ height: '40px' }}
                  >
                    Add Material
                  </Button>
                  
                  {requestMode === 'staged' && (
                    <Button
                      icon={<Plus size={16} />}
                      onClick={() => {
                        const newMaterial: Material = {
                          id: Date.now(),
                          contractMaterial: '',
                          netWeight: 0,
                          unitPrice: 0,
                          pricingUnit: 'lb',
                          inventoryTags: '',
                          estimatedTotal: 0,
                          isEachMaterial: false,
                          isFormula: false,
                          selectedExchange: 'COMEX',
                          grossWeight: 0,
                          tareWeight: 0,
                          isTaggedMaterial: true,
                          tagNumber: ''
                        }
                        const newMaterials = [...materials, newMaterial]
                        setMaterials(newMaterials)
                        setHasChanges(true)
                      }}
                      style={{ height: '40px' }}
                    >
                      Add Tagged Material
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'photos' && (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <Upload size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '8px', color: '#6b7280' }}>No photos uploaded yet</h3>
            <p style={{ color: '#9ca3af', marginBottom: '24px' }}>Upload photos to document this load.</p>
            <Button 
              type="primary" 
              icon={<Upload size={16} />}
            >
              Upload Photos
            </Button>
          </div>
        )}
        
        {activeTab === 'documents' && (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <FileText size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '8px', color: '#6b7280' }}>No documents uploaded yet</h3>
            <p style={{ color: '#9ca3af', marginBottom: '24px' }}>Upload documents related to this load.</p>
            <Button 
              type="primary" 
              icon={<Upload size={16} />}
            >
              Upload Documents
            </Button>
          </div>
        )}
        
        {activeTab === 'notes' && (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <StickyNote size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '8px', color: '#6b7280' }}>No notes added yet</h3>
            <p style={{ color: '#9ca3af', marginBottom: '24px' }}>Add notes to document important information about this load.</p>
            <Button 
              type="primary" 
              icon={<Plus size={16} />}
            >
              Add Note
            </Button>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Bar */}
      {hasChanges && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: '216px',
          right: 0,
          background: '#fff',
          borderTop: '1px solid #e5e7eb',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          zIndex: 1000
        }}>
          <Button onClick={handleDiscard}>Discard</Button>
          <Button type="primary" onClick={handleSave}>Save updates</Button>
        </div>
      )}
      </div>
    </>
  )
}