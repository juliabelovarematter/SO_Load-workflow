import { useState, useEffect, useRef } from 'react'
import { useRoute } from 'wouter'
import { Button, Tag, Tabs, Form, Input, Select, DatePicker, InputNumber, Popconfirm, Dropdown } from 'antd'
import { ArrowLeft, Trash2, Plus, Upload, FileText, StickyNote, Monitor, Weight, Camera, CheckCircle, MessageCircle } from 'lucide-react'
import dayjs from 'dayjs'
import { generateLoadData, generateSOData } from '../../utils/mockData'
import { initializeFormbricks, triggerSurvey } from '../../utils/formbricks'

// Material interface (same as SO Materials)
interface Material {
  id: number | string
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
  const [soMaterials, setSoMaterials] = useState<Material[]>([])
  const [materialsCount, setMaterialsCount] = useState(0)
  const [weightMode, setWeightMode] = useState<'scale' | 'price'>('scale')
  const [requestMode, setRequestMode] = useState<'request' | 'staged'>('request')
  const [showScales, setShowScales] = useState(true)
  const [selectedScale, setSelectedScale] = useState('FS1')
  const [selectedMaterialForWeighing, setSelectedMaterialForWeighing] = useState<Material | null>(null)
  const [materialWeight, setMaterialWeight] = useState<number | null>(null)
  const [selectedFieldForWeighing, setSelectedFieldForWeighing] = useState<'gross' | 'tare' | null>(null)

  // Determine if load is editable based on status - ONLY Unassigned and Open can be edited
  // Read-only statuses: Shipped, Pending Reconciliation, Reconciled, Closed, Voided
  const isEditable = loadData?.status && ['Unassigned', 'Open'].includes(loadData.status)


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
          // If price is $14.00 per MT, and 1 MT = 2204.62 lb, then price per lb = $14.00 / 2204.62 = $0.00635
          const poundsPerPricingUnit = convertWeight(1, material.pricingUnit, 'lb')
          pricePerPound = pricePerPound / poundsPerPricingUnit
          
          // Debug logging
          console.log(`Calculation: $${material.unitPrice} per ${material.pricingUnit} = $${pricePerPound.toFixed(6)} per lb`)
          console.log(`Weight: ${weightInPounds} lb`)
          console.log(`Total: ${weightInPounds} × $${pricePerPound.toFixed(6)} = $${(weightInPounds * pricePerPound).toFixed(2)}`)
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

  // Handle SO selection - Changes load from Unassigned to Open
  const handleSOSelection = (soNumber: string) => {
    if (soNumber) {
      // BUSINESS RULE: Selecting SO changes status from Unassigned to Open
      // Add the exact SO materials from the screenshot
      const soMaterialsData = [
        {
          id: 'so-1',
          contractMaterial: '101 - Aluminum Cans',
          unitPrice: 0.12,
          pricingUnit: 'lb',
          soWeight: 500,
          soRemainingWeight: 450,
          requestedWeight: 450,
          estimatedTotal: 1230.90,
          source: 'so'
        },
        {
          id: 'so-2', 
          contractMaterial: '100 - Aluminum Radiator',
          unitPrice: 0.12,
          pricingUnit: 'lb',
          soWeight: 500,
          soRemainingWeight: 450,
          requestedWeight: 450,
          estimatedTotal: 5000.50,
          source: 'so'
        },
        {
          id: 'so-3',
          contractMaterial: '300 - Copper',
          unitPrice: 0.12,
          pricingUnit: 'lb',
          soWeight: 500,
          soRemainingWeight: 450,
          requestedWeight: 450,
          estimatedTotal: 910.00,
          source: 'so'
        },
        {
          id: 'so-4',
          contractMaterial: '302 - Copper no. 2',
          unitPrice: 0.12,
          pricingUnit: 'NT',
          soWeight: 12,
          soRemainingWeight: 10,
          requestedWeight: 3,
          estimatedTotal: 18865.50,
          source: 'so'
        },
        {
          id: 'so-5',
          contractMaterial: '303 - Copper no. 1',
          unitPrice: 3.00,
          pricingUnit: 'ea',
          soWeight: 10,
          soRemainingWeight: 4,
          requestedWeight: 4,
          estimatedTotal: 1005.00,
          source: 'so'
        }
      ]
      
      setSoMaterials(soMaterialsData)
      
      // BUSINESS RULE: Selecting SO changes load from Unassigned to Open
      // Only Unassigned loads can have SO selected (becomes Open)
      if (loadData?.status === 'Unassigned') {
        setLoadData((prev: any) => {
          return { ...prev, status: 'Open', relatedSO: soNumber }
        })
        console.log('✅ SO selected:', soNumber, '- Status changed from Unassigned to Open')
      } else if (isEditable) {
        // For already Open loads, just update the SO
        setLoadData((prev: any) => {
          return { ...prev, relatedSO: soNumber }
        })
        console.log('✅ SO updated:', soNumber, '- Load remains Open')
      } else {
        // For read-only loads, just update the relatedSO without changing status
        setLoadData((prev: any) => {
          return { ...prev, relatedSO: soNumber }
        })
        console.log('SO selected:', soNumber, '- Status preserved (read-only load):', loadData?.status)
      }
      
      // Update form field value
      form.setFieldValue('relatedSO', soNumber)
    } else {
      // Clear SO materials when no SO is selected
      setSoMaterials([])
      
      // BUSINESS RULE: Clearing SO changes load from Open back to Unassigned
      // Only Open loads can have SO cleared (becomes Unassigned)
      if (loadData?.status === 'Open') {
        setLoadData((prev: any) => {
          return { ...prev, status: 'Unassigned', relatedSO: null }
        })
        console.log('✅ SO cleared - Status changed from Open to Unassigned')
      } else if (isEditable) {
        // For other editable loads, just clear the SO
        setLoadData((prev: any) => {
          return { ...prev, relatedSO: null }
        })
        console.log('✅ SO cleared - Load remains', loadData?.status)
      } else {
        // For read-only loads, just clear the relatedSO without changing status
        setLoadData((prev: any) => {
          return { ...prev, relatedSO: null }
        })
        console.log('SO cleared - Status preserved (read-only load):', loadData?.status)
      }
      
      // Clear form field value
      form.setFieldValue('relatedSO', null)
    }
    setHasChanges(true)
  }

  // Delete SO Material function
  const handleDeleteSOMaterial = (materialId: string) => {
    const updatedSOmaterials = soMaterials.filter(material => material.id !== materialId)
    setSoMaterials(updatedSOmaterials)
    console.log(`🗑️ SO Material ${materialId} removed from load`)
    setHasChanges(true)
  }

  const handleUseRemainingWeight = (materialId: string) => {
    const updatedSOmaterials = soMaterials.map(material => {
      if (material.id === materialId) {
        return { ...material, requestedWeight: material.soRemainingWeight }
      }
      return material
    })
    setSoMaterials(updatedSOmaterials)
    console.log(`🔄 Used remaining weight for SO Material ${materialId}`)
    setHasChanges(true)
  }

  const handleUseAllRemainingWeights = () => {
    const updatedSOmaterials = soMaterials.map(material => ({
      ...material,
      requestedWeight: material.soRemainingWeight
    }))
    setSoMaterials(updatedSOmaterials)
    console.log(`🔄 Used remaining weight for all SO Materials`)
    setHasChanges(true)
  }

  // Add SO Material function
  const handleAddSOMaterial = (materialId: string) => {
    // All available SO materials
    const availableSOMaterials = [
      {
        id: 'so-1',
        contractMaterial: '101 - Aluminum Cans',
        unitPrice: 0.12,
        pricingUnit: 'lb',
        soWeight: 500,
        soRemainingWeight: 450,
        requestedWeight: 450,
        estimatedTotal: 1230.90,
        source: 'so'
      },
      {
        id: 'so-2', 
        contractMaterial: '100 - Aluminum Radiator',
        unitPrice: 0.12,
        pricingUnit: 'lb',
        soWeight: 500,
        soRemainingWeight: 450,
        requestedWeight: 450,
        estimatedTotal: 5000.50,
        source: 'so'
      },
      {
        id: 'so-3',
        contractMaterial: '300 - Copper',
        unitPrice: 0.12,
        pricingUnit: 'lb',
        soWeight: 500,
        soRemainingWeight: 450,
        requestedWeight: 450,
        estimatedTotal: 910.00,
        source: 'so'
      },
      {
        id: 'so-4',
        contractMaterial: '302 - Copper no. 2',
        unitPrice: 0.12,
        pricingUnit: 'NT',
        soWeight: 12,
        soRemainingWeight: 10,
        requestedWeight: 3,
        estimatedTotal: 18865.50,
        source: 'so'
      },
      {
        id: 'so-5',
        contractMaterial: '303 - Copper no. 1',
        unitPrice: 3.00,
        pricingUnit: 'ea',
        soWeight: 10,
        soRemainingWeight: 4,
        requestedWeight: 4,
        estimatedTotal: 1005.00,
        source: 'so'
      }
    ]

    // Find the specific material to add
    const materialToAdd = availableSOMaterials.find(material => material.id === materialId)

    if (materialToAdd) {
      setSoMaterials(prev => [...prev, materialToAdd])
      console.log(`➕ SO Material ${materialToAdd.id} added back to load`)
      setHasChanges(true)
    }
  }

  // Get available SO materials that can be added back (not currently in load)
  const getAvailableSOMaterials = () => {
    const allSOMaterials = [
      { id: 'so-1', contractMaterial: '101 - Aluminum Cans' },
      { id: 'so-2', contractMaterial: '100 - Aluminum Radiator' },
      { id: 'so-3', contractMaterial: '300 - Copper' },
      { id: 'so-4', contractMaterial: '302 - Copper no. 2' },
      { id: 'so-5', contractMaterial: '303 - Copper no. 1' }
    ]

    return allSOMaterials.filter(material => 
      !soMaterials.some(existing => existing.id === material.id)
    )
  }

  // Update materials count whenever materials or soMaterials arrays change
  useEffect(() => {
    setMaterialsCount(soMaterials.length + materials.length)
  }, [materials, soMaterials])

  // Initialize Formbricks
  useEffect(() => {
    console.log('🔄 useEffect: About to initialize Formbricks')
    initializeFormbricks()
  }, [])

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


  useEffect(() => {
    if (params?.id) {
      let data
      
      try {
        // First try to load from localStorage (for new loads created via modal)
        const storedData = localStorage.getItem(`load-form-data-${params.id}`)
        
        if (storedData) {
          // New load created via modal
          const formData = JSON.parse(storedData)
          data = {
            loadNumber: formData.loadNumber,
            expectedShipDate: formData.expectedShipDate,
            facility: formData.facility,
            relatedSO: formData.relatedSO,
            bookingNumber: formData.bookingNumber,
            status: formData.status || (formData.relatedSO ? 'Open' : 'Unassigned'), // Use stored status if available
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
          data = generateLoadData(`#${params.id}`)
          
          // ENFORCE BUSINESS RULE: Unassigned loads cannot have SOs
          if (data.status === 'Unassigned' && data.relatedSO) {
            // CRITICAL: Unassigned loads CANNOT have SOs - remove the SO
            data.relatedSO = ''
            console.log('🔧 Fixed: Removed SO from Unassigned load (Unassigned = no SO allowed)')
          } else if (data.status === 'Open' && !data.relatedSO) {
            // Open loads should have SOs - change to Unassigned
            data.status = 'Unassigned'
            console.log('🔧 Fixed: Open load with no SO changed to Unassigned')
          }
          
          console.log('🔍 Load from table - status:', data.status, '| SO:', data.relatedSO)
        }
      } catch (error) {
        console.error('Error loading load data for', params.id, error)
        // Use fallback data
        data = {
          loadNumber: `#${params.id}`,
          expectedShipDate: '2024-08-22',
          facility: 'ReMatter Headquarters',
          relatedSO: '',
          bookingNumber: '',
          status: 'Unassigned',
          materialsCount: 0,
          photosCount: 0,
          createdOn: 'August 20, 2024',
          createdBy: 'Current User',
          shippingCarrier: 'FedEx',
          customer: 'EcoScrap Industries',
          materials: [],
          containerNumber: '',
          sealNumber: '',
          truckFreight: '',
          notes: ''
        }
      }
      
      setLoadData(data)
      
      // Set materials from the generated data
      if (data && data.materials && data.materials.length > 0) {
        setMaterials(data.materials as Material[])
        setMaterialsCount(data.materials.length)
      } else {
        setMaterialsCount(0)
      }
      
      // Load saved materials if they exist
      const storedMaterials = localStorage.getItem(`load-materials-${params.id}`)
      if (storedMaterials) {
        const materials = JSON.parse(storedMaterials)
        console.log('Loaded saved materials:', materials)
        setMaterials(materials)
      }
      
      // Load saved SO materials if they exist
      const storedSOmaterials = localStorage.getItem(`load-so-materials-${params.id}`)
      if (storedSOmaterials) {
        const soMaterials = JSON.parse(storedSOmaterials)
        console.log('Loaded saved SO materials:', soMaterials)
        setSoMaterials(soMaterials)
      }
      
      // Set form values
      const formValues = {
        relatedSO: data.status === 'Unassigned' ? null : data.relatedSO,
        bookingNumber: data.bookingNumber,
        expectedShipDate: data.expectedShipDate ? dayjs(data.expectedShipDate) : null,
        facility: data.facility,
        shippingCarrier: data.shippingCarrier || '',
        scac: (data as any).scac || '',
        freightForwarder: (data as any).freightForwarder || '',
        truckFreight: (data as any).truckFreight || null,
        deliveryNumber: (data as any).deliveryNumber || '',
        releaseNumber: (data as any).releaseNumber || '',
        bookingNumber2: (data as any).bookingNumber2 || '',
        driverName: (data as any).driverName || '',
        truckNumber: (data as any).truckNumber || '',
        trailerNumber: (data as any).trailerNumber || '',
        containerNumber: (data as any).containerNumber || '',
        sealNumber: (data as any).sealNumber || '',
        notes: data.notes || ''
      }
      
      form.setFieldsValue(formValues)
      setOriginalFormData(formValues)
      
      // Load SO materials only if this load has a related SO AND is not Unassigned
      if (data.relatedSO && data.status !== 'Unassigned') {
        console.log('🔍 Load has related SO:', data.relatedSO, 'Status:', data.status)
        
        // Use the exact SO materials data for consistency
        const soMaterialsData = [
          {
            id: 'so-1',
            contractMaterial: '101 - Aluminum Cans',
            unitPrice: 0.12,
            pricingUnit: 'lb',
            soWeight: 500,
            soRemainingWeight: 450,
            requestedWeight: 450,
            estimatedTotal: 1230.90,
            source: 'so'
          },
          {
            id: 'so-2', 
            contractMaterial: '100 - Aluminum Radiator',
            unitPrice: 0.12,
            pricingUnit: 'lb',
            soWeight: 500,
            soRemainingWeight: 450,
            requestedWeight: 450,
            estimatedTotal: 5000.50,
            source: 'so'
          },
          {
            id: 'so-3',
            contractMaterial: '300 - Copper',
            unitPrice: 0.12,
            pricingUnit: 'lb',
            soWeight: 500,
            soRemainingWeight: 450,
            requestedWeight: 450,
            estimatedTotal: 910.00,
            source: 'so'
          },
          {
            id: 'so-4',
            contractMaterial: '302 - Copper no. 2',
            unitPrice: 0.12,
            pricingUnit: 'NT',
            soWeight: 12,
            soRemainingWeight: 10,
            requestedWeight: 3,
            estimatedTotal: 18865.50,
            source: 'so'
          },
          {
            id: 'so-5',
            contractMaterial: '303 - Copper no. 1',
            unitPrice: 3.00,
            pricingUnit: 'ea',
            soWeight: 10,
            soRemainingWeight: 4,
            requestedWeight: 4,
            estimatedTotal: 1005.00,
            source: 'so'
          }
        ]
        
        setSoMaterials(soMaterialsData)
        console.log('🔍 SO Materials loaded:', soMaterialsData.length)
      } else {
        console.log('🔍 No SO materials - Load is Unassigned or has no SO')
        setSoMaterials([])
      }
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
    localStorage.setItem(`load-materials-${params?.id}`, JSON.stringify(materials))
    
    // Save SO materials to localStorage
    if (soMaterials.length > 0) {
      localStorage.setItem(`load-so-materials-${params?.id}`, JSON.stringify(soMaterials))
      console.log('Saved SO materials:', soMaterials.length)
    } else {
      localStorage.removeItem(`load-so-materials-${params?.id}`)
      console.log('Removed SO materials from storage')
    }
    
    // Update loadData with form values including SO selection and status
    const updatedLoadData = { 
      ...loadData, 
      ...values,
      expectedShipDate: values.expectedShipDate ? values.expectedShipDate.toISOString() : null,
      materialsCount: soMaterials.length + materials.length,
      status: loadData.status // Keep the current status (updated by handleSOSelection)
    }
    setLoadData(updatedLoadData)
    localStorage.setItem(`load-form-data-${params?.id}`, JSON.stringify(updatedLoadData))
    
    console.log(`Saved load data for ${params?.id}:`, updatedLoadData)
    console.log(`Status: ${updatedLoadData.status}, Related SO: ${updatedLoadData.relatedSO}`)
    console.log(`SO Materials: ${soMaterials.length}, Load Materials: ${materials.length}`)
    
    setHasChanges(false)
    setOriginalFormData(values)
    
  }


  const handleDiscard = () => {
    form.setFieldsValue(originalFormData)
    setHasChanges(false)
  }

  // Handle Give Feedback button click
  const handleGiveFeedback = async () => {
    console.log('🔄 Give Feedback button clicked!')
    try {
      await triggerSurvey("cmg6z3ito68osvm01qbqf6n8c", ".load-detail-give-feedback-button") // Load Materials survey ID with Load button selector
      console.log('✅ Give Feedback clicked - survey triggered')
    } catch (error) {
      console.log('❌ Failed to trigger survey:', error)
    }
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

  const statusColors = getStatusColor(loadData?.status || 'Unassigned')

  return (
    <div>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          
          /* Global override for ALL disabled inputs - highest priority */
          input:disabled,
          input[disabled],
          .ant-input:disabled,
          .ant-input[disabled],
          .ant-input-number:disabled,
          .ant-input-number[disabled],
          .ant-input-number-input:disabled,
          .ant-input-number-input[disabled] {
            border: none !important;
            border-width: 0 !important;
            border-style: none !important;
            border-color: transparent !important;
            outline: none !important;
            box-shadow: none !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
          }
          
          /* Target all possible Ant Design input classes */
          .ant-input.ant-input-disabled,
          .ant-input-number.ant-input-number-disabled,
          .ant-input-number-input.ant-input-number-input-disabled {
            border: none !important;
            border-width: 0 !important;
            border-style: none !important;
            border-color: transparent !important;
            outline: none !important;
            box-shadow: none !important;
          }
          
          /* Disabled field styling */
          .ant-input:disabled,
          .ant-input-number:disabled,
          .ant-select:disabled,
          .ant-picker:disabled {
            background-color: #f8f9fa !important;
            border: none !important;
            color: #495057 !important;
          }
          
          .ant-input:disabled .ant-input,
          .ant-input-number:disabled .ant-input-number-input,
          .ant-select:disabled .ant-select-selector,
          .ant-picker:disabled .ant-picker-input input {
            background-color: #f8f9fa !important;
            border: none !important;
            color: #495057 !important;
          }
          
          /* Override all possible border styles for disabled inputs */
          .ant-input.ant-input-disabled,
          .ant-input[disabled],
          .ant-input:disabled,
          .ant-input-number.ant-input-number-disabled,
          .ant-input-number[disabled],
          .ant-input-number:disabled {
            border: none !important;
            border-color: transparent !important;
            border-width: 0 !important;
            outline: none !important;
            box-shadow: none !important;
          }
          
          /* Override input wrapper borders */
          .ant-input.ant-input-disabled .ant-input,
          .ant-input[disabled] .ant-input,
          .ant-input:disabled .ant-input,
          .ant-input-number.ant-input-number-disabled .ant-input-number-input,
          .ant-input-number[disabled] .ant-input-number-input,
          .ant-input-number:disabled .ant-input-number-input {
            border: none !important;
            border-color: transparent !important;
            border-width: 0 !important;
            outline: none !important;
            box-shadow: none !important;
          }
          
          /* Override focus and hover states for disabled inputs */
          .ant-input.ant-input-disabled:hover,
          .ant-input[disabled]:hover,
          .ant-input:disabled:hover,
          .ant-input-number.ant-input-number-disabled:hover,
          .ant-input-number[disabled]:hover,
          .ant-input-number:disabled:hover {
            border: none !important;
            border-color: transparent !important;
            box-shadow: none !important;
          }
          
          .ant-input.ant-input-disabled:focus,
          .ant-input[disabled]:focus,
          .ant-input:disabled:focus,
          .ant-input-number.ant-input-number-disabled:focus,
          .ant-input-number[disabled]:focus,
          .ant-input-number:disabled:focus {
            border: none !important;
            border-color: transparent !important;
            box-shadow: none !important;
          }
          
          /* Force remove all borders from disabled InputNumber components */
          .ant-input-number:disabled,
          .ant-input-number.ant-input-number-disabled,
          .ant-input-number[disabled] {
            border: 0 !important;
            border-style: none !important;
            border-width: 0 !important;
            border-color: transparent !important;
            border-image: none !important;
            outline: 0 !important;
            outline-offset: 0 !important;
            box-shadow: none !important;
            -webkit-box-shadow: none !important;
            -moz-box-shadow: none !important;
          }
          
          /* Target the actual input element inside InputNumber */
          .ant-input-number:disabled .ant-input-number-input,
          .ant-input-number.ant-input-number-disabled .ant-input-number-input,
          .ant-input-number[disabled] .ant-input-number-input {
            border: 0 !important;
            border-style: none !important;
            border-width: 0 !important;
            border-color: transparent !important;
            border-image: none !important;
            outline: 0 !important;
            outline-offset: 0 !important;
            box-shadow: none !important;
            -webkit-box-shadow: none !important;
            -moz-box-shadow: none !important;
          }
          
          /* Force remove all borders from disabled Input components */
          .ant-input:disabled,
          .ant-input.ant-input-disabled,
          .ant-input[disabled] {
            border: 0 !important;
            border-style: none !important;
            border-width: 0 !important;
            border-color: transparent !important;
            border-image: none !important;
            outline: 0 !important;
            outline-offset: 0 !important;
            box-shadow: none !important;
            -webkit-box-shadow: none !important;
            -moz-box-shadow: none !important;
          }
          
          /* Target all possible input elements */
          .ant-input:disabled,
          .ant-input.ant-input-disabled,
          .ant-input[disabled],
          .ant-input:disabled input,
          .ant-input.ant-input-disabled input,
          .ant-input[disabled] input {
            border: 0 !important;
            border-style: none !important;
            border-width: 0 !important;
            border-color: transparent !important;
            border-image: none !important;
            outline: 0 !important;
            outline-offset: 0 !important;
            box-shadow: none !important;
            -webkit-box-shadow: none !important;
            -moz-box-shadow: none !important;
          }
          
          /* Nuclear approach - target every possible border property */
          .ant-input:disabled,
          .ant-input.ant-input-disabled,
          .ant-input[disabled],
          .ant-input-number:disabled,
          .ant-input-number.ant-input-number-disabled,
          .ant-input-number[disabled] {
            border: none !important;
            border-top: none !important;
            border-right: none !important;
            border-bottom: none !important;
            border-left: none !important;
            border-width: 0 !important;
            border-style: none !important;
            border-color: transparent !important;
            border-radius: 0 !important;
            outline: none !important;
            outline-width: 0 !important;
            outline-style: none !important;
            outline-color: transparent !important;
            box-shadow: none !important;
            -webkit-box-shadow: none !important;
            -moz-box-shadow: none !important;
            -ms-box-shadow: none !important;
            -o-box-shadow: none !important;
          }
          
          /* Target all child elements */
          .ant-input:disabled *,
          .ant-input.ant-input-disabled *,
          .ant-input[disabled] *,
          .ant-input-number:disabled *,
          .ant-input-number.ant-input-number-disabled *,
          .ant-input-number[disabled] * {
            border: none !important;
            border-top: none !important;
            border-right: none !important;
            border-bottom: none !important;
            border-left: none !important;
            border-width: 0 !important;
            border-style: none !important;
            border-color: transparent !important;
            outline: none !important;
            outline-width: 0 !important;
            outline-style: none !important;
            outline-color: transparent !important;
            box-shadow: none !important;
            -webkit-box-shadow: none !important;
            -moz-box-shadow: none !important;
            -ms-box-shadow: none !important;
            -o-box-shadow: none !important;
          }
          
          /* Specific styling for disabled select fields */
          .ant-select:disabled .ant-select-selector {
            background-color: #f8f9fa !important;
            border: none !important;
            color: #495057 !important;
            box-shadow: none !important;
          }
          
          .ant-select:disabled .ant-select-selection-item {
            color: #495057 !important;
          }
          
          /* Override text color for disabled select fields */
          .ant-select.ant-select-disabled .ant-select-selection-item,
          .ant-select[disabled] .ant-select-selection-item,
          .ant-select:disabled .ant-select-selection-item,
          .ant-select.ant-select-disabled .ant-select-selection-placeholder,
          .ant-select[disabled] .ant-select-selection-placeholder,
          .ant-select:disabled .ant-select-selection-placeholder {
            color: #495057 !important;
          }
          
          /* Override all text elements in disabled select */
          .ant-select.ant-select-disabled .ant-select-selector *,
          .ant-select[disabled] .ant-select-selector *,
          .ant-select:disabled .ant-select-selector * {
            color: #495057 !important;
          }
          
          .ant-select:disabled .ant-select-arrow {
            color: #6b7280 !important;
          }
          
          /* Hide chevron icon for disabled select fields */
          .ant-select.ant-select-disabled .ant-select-arrow,
          .ant-select[disabled] .ant-select-arrow,
          .ant-select:disabled .ant-select-arrow {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
          }
          
          /* Hide all arrow elements in disabled selects */
          .ant-select.ant-select-disabled .ant-select-selector .ant-select-arrow,
          .ant-select[disabled] .ant-select-selector .ant-select-arrow,
          .ant-select:disabled .ant-select-selector .ant-select-arrow {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
          }
          
          /* Override all possible border styles for disabled selects */
          .ant-select.ant-select-disabled .ant-select-selector,
          .ant-select[disabled] .ant-select-selector,
          .ant-select:disabled .ant-select-selector {
            border: none !important;
            border-color: transparent !important;
            border-width: 0 !important;
            outline: none !important;
            box-shadow: none !important;
          }
          
          /* Override focus and hover states for disabled selects */
          .ant-select.ant-select-disabled .ant-select-selector:hover,
          .ant-select[disabled] .ant-select-selector:hover,
          .ant-select:disabled .ant-select-selector:hover {
            border: none !important;
            border-color: transparent !important;
            box-shadow: none !important;
          }
          
          .ant-select.ant-select-disabled .ant-select-selector:focus,
          .ant-select[disabled] .ant-select-selector:focus,
          .ant-select:disabled .ant-select-selector:focus {
            border: none !important;
            border-color: transparent !important;
            box-shadow: none !important;
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
                type="default"
                className="load-detail-give-feedback-button"
                icon={<MessageCircle size={16} />}
                onClick={handleGiveFeedback}
              >
                Give Feedback
              </Button>
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
                >
                  <Select 
                    placeholder={loadData?.status === 'Unassigned' ? 'No SO (Unassigned Load)' : 'Select SO'}
                    disabled={!isEditable}
                    allowClear
                    showSearch
filterOption={(input, option) =>
  (option?.value as string)?.toLowerCase().includes(input.toLowerCase())
}
                    onChange={handleSOSelection}
                    value={loadData?.status === 'Unassigned' ? null : loadData?.relatedSO}
                    style={isEditable ? {} : {
                      backgroundColor: '#f8f9fa',
                      border: 'none',
                      color: '#495057'
                    }}
                  >
                    <Select.Option value="#002001">#002001 - Brass Rod Contract</Select.Option>
                    <Select.Option value="#002002">#002002 - Copper Wire Contract</Select.Option>
                    <Select.Option value="#002003">#002003 - Aluminum Sheet Contract</Select.Option>
                    <Select.Option value="#002004">#002004 - Steel Scrap Contract</Select.Option>
                    <Select.Option value="#002005">#002005 - Lead Pipe Contract</Select.Option>
                    <Select.Option value="#002006">#002006 - Zinc Fittings Contract</Select.Option>
                    <Select.Option value="#002007">#002007 - Stainless Steel Contract</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  label="Booking #"
                  name="bookingNumber"
                >
                  <Select 
                    placeholder="Select Booking"
                    disabled={!isEditable}
                    style={isEditable ? {} : {
                      backgroundColor: '#f8f9fa',
                      border: 'none',
                      color: '#495057'
                    }}
                  >
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
                  <DatePicker 
                    style={{ 
                      width: '100%',
                      ...(isEditable ? {} : {
                        backgroundColor: '#f8f9fa',
                        border: 'none',
                        color: '#495057'
                      })
                    }} 
                    disabled={!isEditable}
                  />
                </Form.Item>
                <Form.Item
                  label={<span>Facility <span style={{ color: 'red' }}>*</span></span>}
                  name="facility"
                  required={false}
                  rules={[{ required: true }]}
                >
                  <Select 
                    placeholder="Select Facility"
                    disabled={!isEditable}
                    showSearch
filterOption={(input, option) =>
  (option?.value as string)?.toLowerCase().includes(input.toLowerCase())
}
                    style={isEditable ? {} : {
                      backgroundColor: '#f8f9fa',
                      border: 'none',
                      color: '#495057'
                    }}
                  >
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
                  <Input 
                    placeholder="Enter carrier name" 
                    disabled={!isEditable}
                    style={isEditable ? {} : {
                      backgroundColor: '#f8f9fa',
                      border: 'none',
                      color: '#495057'
                    }}
                  />
                </Form.Item>
                <Form.Item label="SCAC" name="scac">
                  <Input 
                    placeholder="Enter SCAC code" 
                    disabled={!isEditable}
                    style={isEditable ? {} : {
                      backgroundColor: '#f8f9fa',
                      border: 'none',
                      color: '#495057'
                    }}
                  />
                </Form.Item>
                <Form.Item label="Freight Forwarder" name="freightForwarder">
                  <Input 
                    placeholder="Enter forwarder name" 
                    disabled={!isEditable}
                    style={isEditable ? {} : {
                      backgroundColor: '#f8f9fa',
                      border: 'none',
                      color: '#495057'
                    }}
                  />
                </Form.Item>
                <Form.Item label="Truck Freight" name="truckFreight">
                  <InputNumber 
                    style={{ 
                      width: '100%',
                      ...(isEditable ? {} : {
                        backgroundColor: '#f8f9fa',
                        border: 'none',
                        color: '#495057'
                      })
                    }} 
                    placeholder="Enter amount" 
                    disabled={!isEditable}
                  />
                </Form.Item>
                <Form.Item label="Delivery Number" name="deliveryNumber">
                  <Input 
                    placeholder="Enter delivery number" 
                    disabled={!isEditable}
                    style={isEditable ? {} : {
                      backgroundColor: '#f8f9fa',
                      border: 'none',
                      color: '#495057'
                    }}
                  />
                </Form.Item>
                <Form.Item label="Release Number" name="releaseNumber">
                  <Input 
                    placeholder="Enter release number" 
                    disabled={!isEditable}
                    style={isEditable ? {} : {
                      backgroundColor: '#f8f9fa',
                      border: 'none',
                      color: '#495057'
                    }}
                  />
                </Form.Item>
                <Form.Item label="Booking Number" name="bookingNumber2">
                  <Input 
                    placeholder="Enter booking number" 
                    disabled={!isEditable}
                    style={isEditable ? {} : {
                      backgroundColor: '#f8f9fa',
                      border: 'none',
                      color: '#495057'
                    }}
                  />
                </Form.Item>
                <Form.Item label="Driver Name" name="driverName">
                  <Input 
                    placeholder="Enter driver name" 
                    disabled={!isEditable}
                    style={isEditable ? {} : {
                      backgroundColor: '#f8f9fa',
                      border: 'none',
                      color: '#495057'
                    }}
                  />
                </Form.Item>
                <Form.Item label="Truck Number" name="truckNumber">
                  <Input 
                    placeholder="Enter truck number" 
                    disabled={!isEditable}
                    style={isEditable ? {} : {
                      backgroundColor: '#f8f9fa',
                      border: 'none',
                      color: '#495057'
                    }}
                  />
                </Form.Item>
                <Form.Item label="Trailer Number" name="trailerNumber">
                  <Input 
                    placeholder="Enter trailer number" 
                    disabled={!isEditable}
                    style={isEditable ? {} : {
                      backgroundColor: '#f8f9fa',
                      border: 'none',
                      color: '#495057'
                    }}
                  />
                </Form.Item>
                <Form.Item label="Container Number" name="containerNumber">
                  <Input 
                    placeholder="Enter container number" 
                    disabled={!isEditable}
                    style={isEditable ? {} : {
                      backgroundColor: '#f8f9fa',
                      border: 'none',
                      color: '#495057'
                    }}
                  />
                </Form.Item>
                <Form.Item label="Seal Number" name="sealNumber">
                  <Input 
                    placeholder="Enter seal number" 
                    disabled={!isEditable}
                    style={isEditable ? {} : {
                      backgroundColor: '#f8f9fa',
                      border: 'none',
                      color: '#495057'
                    }}
                  />
                </Form.Item>
              </div>
            </div>
          </Form>
        )}
        
        {activeTab === 'materials' && (
          <div style={{ padding: '24px' }}>
            {soMaterials.length === 0 && materials.length === 0 ? (
              <div style={{ textAlign: 'center' }}>
                <FileText size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
                <h3 style={{ marginBottom: '8px', color: '#6b7280' }}>No materials added yet</h3>
                <p style={{ color: '#9ca3af', marginBottom: '24px' }}>Select a Sales Order or add materials to this load to get started.</p>
                <Button 
                  type="primary" 
                  icon={<Plus size={16} />}
                  onClick={() => setMaterials([{ id: 1 }])}
                  disabled={!isEditable}
                >
                  Add Material
                </Button>
              </div>
            ) : (
              <div>

                {/* Other Materials Section */}
                <div>
                  {/* Header with title and toggles */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '24px'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                      Load Materials ({materials.length})
                    </h3>
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
                          className="load-scale-unit-weight-toggle"
                          onClick={() => setWeightMode('scale')}
                          disabled={!isEditable}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: weightMode === 'scale' ? '#3b82f6' : 'transparent',
                            color: !isEditable ? '#9ca3af' : (weightMode === 'scale' ? '#fff' : '#374151'),
                            fontWeight: '500',
                            fontSize: '14px',
                            cursor: !isEditable ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: !isEditable ? 0.5 : 1
                          }}
                        >
                          Scale Unit Weight
                        </button>
                        <button
                          className="load-price-unit-weight-toggle"
                          onClick={() => setWeightMode('price')}
                          disabled={!isEditable || requestMode === 'staged'}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: weightMode === 'price' ? '#3b82f6' : 'transparent',
                            color: (!isEditable || requestMode === 'staged') ? '#9ca3af' : (weightMode === 'price' ? '#fff' : '#374151'),
                            fontWeight: '500',
                            fontSize: '14px',
                            cursor: (!isEditable || requestMode === 'staged') ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: (!isEditable || requestMode === 'staged') ? 0.5 : 1
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
                          disabled={!isEditable}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: requestMode === 'request' ? '#3b82f6' : 'transparent',
                            color: !isEditable ? '#9ca3af' : (requestMode === 'request' ? '#fff' : '#374151'),
                            fontWeight: '500',
                            fontSize: '14px',
                            cursor: !isEditable ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            opacity: !isEditable ? 0.5 : 1
                          }}
                        >
                          <Monitor size={16} />
                          Request
                        </button>
                        <button
                          onClick={() => {
                            setRequestMode('staged')
                            setWeightMode('scale') // Auto-switch to Scale Unit Weight when Stage is enabled
                          }}
                          disabled={!isEditable}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: requestMode === 'staged' ? '#3b82f6' : 'transparent',
                            color: !isEditable ? '#9ca3af' : (requestMode === 'staged' ? '#fff' : '#374151'),
                            fontWeight: '500',
                            fontSize: '14px',
                            cursor: !isEditable ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            opacity: !isEditable ? 0.5 : 1
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
                          disabled={requestMode === 'request' || !isEditable}
                          style={{
                            width: '40px',
                            height: '20px',
                            borderRadius: '10px',
                            border: 'none',
                            background: showScales ? '#3b82f6' : '#d1d5db',
                            cursor: (requestMode === 'request' || !isEditable) ? 'not-allowed' : 'pointer',
                            position: 'relative',
                            transition: 'background-color 0.2s',
                            opacity: (!isEditable) ? 0.5 : 1
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

                {/* SO Materials Table - Show for loads with SO (not Unassigned) and not in stage mode */}
                {loadData?.relatedSO && loadData?.status !== 'Unassigned' && requestMode !== 'staged' && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: '#fff',
                      overflow: 'auto',
                      width: '100%',
                      minWidth: '700px'
                    }}>
                      {/* Table Headers */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr 1.2fr 1.3fr 1.2fr 60px',
                        gap: '6px',
                        backgroundColor: '#f8f9fa',
                        padding: '8px 12px',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>SO Materials</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Unit Price</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>SO Weight</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>SO Remaining Weight</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                          <div>Requested Weight</div>
                          <div 
                            onClick={isEditable ? handleUseAllRemainingWeights : undefined}
                            style={{ 
                              fontSize: '12px', 
                              fontWeight: '400', 
                              color: isEditable ? '#3b82f6' : '#9ca3af', 
                              marginTop: '2px',
                              cursor: isEditable ? 'pointer' : 'not-allowed',
                              textDecoration: isEditable ? 'underline' : 'none',
                              opacity: isEditable ? 1 : 0.5
                            }}
                          >
                            Use remaining we...
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Inventory Tags</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Estimated Total</div>
                        <div></div>
                      </div>

                      {/* SO Materials Rows - Exact data from screenshot */}
                      <div style={{ padding: '0' }}>
                        {/* 101 - Aluminum Cans */}
                        {soMaterials.find(m => m.id === 'so-1') && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr 1.2fr 1.3fr 1.2fr 60px',
                          gap: '6px',
                          padding: '12px 16px',
                          alignItems: 'center',
                          marginBottom: '6px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                            101 - Aluminum Cans
                          </div>
                          <div style={{ fontSize: '14px', color: '#374151' }}>
                            $ 0.12 /lb
                          </div>
                          <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#374151',
                            textAlign: 'center',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            500 lb
                          </div>
                          <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#374151',
                            textAlign: 'center',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            450 lb
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleUseRemainingWeight('so-1')}
                              disabled={!isEditable}
                              style={{
                                padding: '6px 8px',
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #e5e7eb',
                                borderRadius: '4px',
                                cursor: isEditable ? 'pointer' : 'not-allowed',
                                fontSize: '14px',
                                color: isEditable ? '#6b7280' : '#9ca3af',
                                height: '40px',
                                opacity: isEditable ? 1 : 0.5
                              }}
                            >
                              →
                            </button>
                            <Input
                              value={soMaterials.find(m => m.id === 'so-1')?.requestedWeight || 0}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0
                                const updatedSOmaterials = soMaterials.map(material => {
                                  if (material.id === 'so-1') {
                                    return { ...material, requestedWeight: value }
                                  }
                                  return material
                                })
                                setSoMaterials(updatedSOmaterials)
                                setHasChanges(true)
                              }}
                              suffix="lb"
                              disabled={!isEditable}
                              style={{ 
                                width: '70px', 
                                textAlign: 'right', 
                                height: '40px',
                                ...(isEditable ? {} : {
                                  backgroundColor: '#f8f9fa',
                                  border: 'none',
                                  color: '#495057'
                                })
                              }}
                            />
                          </div>
                          <div>
                            <Select
                              placeholder="Select..."
                              disabled={!isEditable}
                              style={{ 
                                width: '100%', 
                                height: '40px',
                                ...(isEditable ? {} : {
                                  backgroundColor: '#f8f9fa',
                                  border: 'none',
                                  color: '#374151',
                                  borderRadius: '6px'
                                })
                              }}
                            />
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#374151',
                            height: '40px'
                          }}>
                            <span style={{ color: '#6b7280' }}>$</span>
                            <span>1,230.90</span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <Button icon={<Camera size={14} />} style={{ padding: '4px', minWidth: '32px', height: '40px' }} />
                            <Popconfirm
                              title="Remove SO from the Load?"
                              description="Material will be removed from the load, but still will be kept on the Sales Order. Do you want to proceed?"
                              onConfirm={() => handleDeleteSOMaterial('so-1')}
                              okText="Yes"
                              cancelText="No"
                            >
                              <Button icon={<Trash2 size={14} />} danger style={{ padding: '4px', minWidth: '32px', height: '40px' }} />
                            </Popconfirm>
                          </div>
                        </div>
                        )}

                        {/* 100 - Aluminum Radiator */}
                        {soMaterials.find(m => m.id === 'so-2') && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr 1.2fr 1.3fr 1.2fr 60px',
                          gap: '6px',
                          padding: '12px 16px',
                          alignItems: 'center',
                          marginBottom: '6px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                            100 - Aluminum Radiator...
                          </div>
                          <div style={{ fontSize: '14px', color: '#374151' }}>
                            $ 0.12 /lb
                          </div>
                          <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#374151',
                            textAlign: 'center',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            500 lb
                          </div>
                          <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#374151',
                            textAlign: 'center',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            450 lb
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleUseRemainingWeight('so-2')}
                              disabled={!isEditable}
                              style={{
                                padding: '6px 8px',
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #e5e7eb',
                                borderRadius: '4px',
                                cursor: isEditable ? 'pointer' : 'not-allowed',
                                fontSize: '14px',
                                color: isEditable ? '#6b7280' : '#9ca3af',
                                height: '40px',
                                opacity: isEditable ? 1 : 0.5
                              }}
                            >
                              →
                            </button>
                            <Input
                              value={soMaterials.find(m => m.id === 'so-2')?.requestedWeight || 0}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0
                                const updatedSOmaterials = soMaterials.map(material => {
                                  if (material.id === 'so-2') {
                                    return { ...material, requestedWeight: value }
                                  }
                                  return material
                                })
                                setSoMaterials(updatedSOmaterials)
                                setHasChanges(true)
                              }}
                              suffix="lb"
                              disabled={!isEditable}
                              style={{ 
                                width: '70px', 
                                textAlign: 'right', 
                                height: '40px',
                                ...(isEditable ? {} : {
                                  backgroundColor: '#f8f9fa',
                                  border: 'none',
                                  color: '#495057'
                                })
                              }}
                            />
                          </div>
                          <div>
                            <Select
                              placeholder="Select..."
                              disabled={!isEditable}
                              style={{ 
                                width: '100%', 
                                height: '40px',
                                ...(isEditable ? {} : {
                                  backgroundColor: '#f8f9fa',
                                  border: 'none',
                                  color: '#374151',
                                  borderRadius: '6px'
                                })
                              }}
                            />
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#374151',
                            height: '40px'
                          }}>
                            <span style={{ color: '#6b7280' }}>$</span>
                            <span>5,000.50</span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <Button icon={<Camera size={14} />} style={{ padding: '4px', minWidth: '32px', height: '40px' }} />
                            <Popconfirm
                              title="Remove SO from the Load?"
                              description="Material will be removed from the load, but still will be kept on the Sales Order. Do you want to proceed?"
                              onConfirm={() => handleDeleteSOMaterial('so-2')}
                              okText="Yes"
                              cancelText="No"
                            >
                              <Button icon={<Trash2 size={14} />} danger style={{ padding: '4px', minWidth: '32px', height: '40px' }} />
                            </Popconfirm>
                          </div>
                        </div>
                        )}

                        {/* 300 - Copper */}
                        {soMaterials.find(m => m.id === 'so-3') && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr 1.2fr 1.3fr 1.2fr 60px',
                          gap: '6px',
                          padding: '12px 16px',
                          alignItems: 'center',
                          marginBottom: '6px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                            300 - Copper
                          </div>
                          <div style={{ fontSize: '14px', color: '#374151' }}>
                            $ 0.12 /lb
                          </div>
                          <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#374151',
                            textAlign: 'center',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            500 lb
                          </div>
                          <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#374151',
                            textAlign: 'center',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            450 lb
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleUseRemainingWeight('so-3')}
                              disabled={!isEditable}
                              style={{
                                padding: '6px 8px',
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #e5e7eb',
                                borderRadius: '4px',
                                cursor: isEditable ? 'pointer' : 'not-allowed',
                                fontSize: '14px',
                                color: isEditable ? '#6b7280' : '#9ca3af',
                                height: '40px',
                                opacity: isEditable ? 1 : 0.5
                              }}
                            >
                              →
                            </button>
                            <Input
                              value={soMaterials.find(m => m.id === 'so-3')?.requestedWeight || 0}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0
                                const updatedSOmaterials = soMaterials.map(material => {
                                  if (material.id === 'so-3') {
                                    return { ...material, requestedWeight: value }
                                  }
                                  return material
                                })
                                setSoMaterials(updatedSOmaterials)
                                setHasChanges(true)
                              }}
                              suffix="lb"
                              disabled={!isEditable}
                              style={{ 
                                width: '70px', 
                                textAlign: 'right', 
                                height: '40px',
                                ...(isEditable ? {} : {
                                  backgroundColor: '#f8f9fa',
                                  border: 'none',
                                  color: '#495057'
                                })
                              }}
                            />
                          </div>
                          <div>
                            <Select
                              placeholder="Select..."
                              disabled={!isEditable}
                              style={{ 
                                width: '100%', 
                                height: '40px',
                                ...(isEditable ? {} : {
                                  backgroundColor: '#f8f9fa',
                                  border: 'none',
                                  color: '#374151',
                                  borderRadius: '6px'
                                })
                              }}
                            />
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#374151',
                            height: '40px'
                          }}>
                            <span style={{ color: '#6b7280' }}>$</span>
                            <span>910.00</span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <Button icon={<Camera size={14} />} style={{ padding: '4px', minWidth: '32px', height: '40px' }} />
                            <Popconfirm
                              title="Remove SO from the Load?"
                              description="Material will be removed from the load, but still will be kept on the Sales Order. Do you want to proceed?"
                              onConfirm={() => handleDeleteSOMaterial('so-3')}
                              okText="Yes"
                              cancelText="No"
                            >
                              <Button icon={<Trash2 size={14} />} danger style={{ padding: '4px', minWidth: '32px', height: '40px' }} />
                            </Popconfirm>
                          </div>
                        </div>
                        )}

                        {/* 302 - Copper no. 2 */}
                        {soMaterials.find(m => m.id === 'so-4') && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr 1.2fr 1.3fr 1.2fr 60px',
                          gap: '6px',
                          padding: '12px 16px',
                          alignItems: 'center',
                          marginBottom: '6px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                            302 - Copper no. 2
                          </div>
                          <div style={{ fontSize: '14px', color: '#374151' }}>
                            $ 0.12 /NT
                          </div>
                          <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#374151',
                            textAlign: 'center',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            12 NT
                          </div>
                          <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#374151',
                            textAlign: 'center',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            10 NT
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleUseRemainingWeight('so-4')}
                              disabled={!isEditable}
                              style={{
                                padding: '6px 8px',
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #e5e7eb',
                                borderRadius: '4px',
                                cursor: isEditable ? 'pointer' : 'not-allowed',
                                fontSize: '14px',
                                color: isEditable ? '#6b7280' : '#9ca3af',
                                height: '40px',
                                opacity: isEditable ? 1 : 0.5
                              }}
                            >
                              →
                            </button>
                            <Input
                              value={soMaterials.find(m => m.id === 'so-4')?.requestedWeight || 0}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0
                                const updatedSOmaterials = soMaterials.map(material => {
                                  if (material.id === 'so-4') {
                                    return { ...material, requestedWeight: value }
                                  }
                                  return material
                                })
                                setSoMaterials(updatedSOmaterials)
                                setHasChanges(true)
                              }}
                              suffix="NT"
                              disabled={!isEditable}
                              style={{ 
                                width: '70px', 
                                textAlign: 'right', 
                                height: '40px',
                                ...(isEditable ? {} : {
                                  backgroundColor: '#f8f9fa',
                                  border: 'none',
                                  color: '#495057'
                                })
                              }}
                            />
                          </div>
                          <div>
                            <Select
                              placeholder="Select..."
                              disabled={!isEditable}
                              style={{ 
                                width: '100%', 
                                height: '40px',
                                ...(isEditable ? {} : {
                                  backgroundColor: '#f8f9fa',
                                  border: 'none',
                                  color: '#374151',
                                  borderRadius: '6px'
                                })
                              }}
                            />
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#374151',
                            height: '40px'
                          }}>
                            <span style={{ color: '#6b7280' }}>$</span>
                            <span>18,865.50</span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <Button icon={<Camera size={14} />} style={{ padding: '4px', minWidth: '32px', height: '40px' }} />
                            <Popconfirm
                              title="Remove SO from the Load?"
                              description="Material will be removed from the load, but still will be kept on the Sales Order. Do you want to proceed?"
                              onConfirm={() => handleDeleteSOMaterial('so-4')}
                              okText="Yes"
                              cancelText="No"
                            >
                              <Button icon={<Trash2 size={14} />} danger style={{ padding: '4px', minWidth: '32px', height: '40px' }} />
                            </Popconfirm>
                          </div>
                        </div>
                        )}

                        {/* 303 - Copper no. 1 */}
                        {soMaterials.find(m => m.id === 'so-5') && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr 1.2fr 1.3fr 1.2fr 60px',
                          gap: '6px',
                          padding: '12px 16px',
                          alignItems: 'center',
                          marginBottom: '6px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                            303 - Copper no. 1
                          </div>
                          <div style={{ fontSize: '14px', color: '#374151' }}>
                            $ 3.00 /ea
                          </div>
                          <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#374151',
                            textAlign: 'center',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            10 ea
                          </div>
                          <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#374151',
                            textAlign: 'center',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            4 ea
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleUseRemainingWeight('so-5')}
                              disabled={!isEditable}
                              style={{
                                padding: '6px 8px',
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #e5e7eb',
                                borderRadius: '4px',
                                cursor: isEditable ? 'pointer' : 'not-allowed',
                                fontSize: '14px',
                                color: isEditable ? '#6b7280' : '#9ca3af',
                                height: '40px',
                                opacity: isEditable ? 1 : 0.5
                              }}
                            >
                              →
                            </button>
                            <Input
                              value={soMaterials.find(m => m.id === 'so-5')?.requestedWeight || 0}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0
                                const updatedSOmaterials = soMaterials.map(material => {
                                  if (material.id === 'so-5') {
                                    return { ...material, requestedWeight: value }
                                  }
                                  return material
                                })
                                setSoMaterials(updatedSOmaterials)
                                setHasChanges(true)
                              }}
                              suffix="ea"
                              disabled={!isEditable}
                              style={{ 
                                width: '70px', 
                                textAlign: 'right', 
                                height: '40px',
                                ...(isEditable ? {} : {
                                  backgroundColor: '#f8f9fa',
                                  border: 'none',
                                  color: '#495057'
                                })
                              }}
                            />
                          </div>
                          <div>
                            <Select
                              placeholder="Select..."
                              disabled={!isEditable}
                              style={{ 
                                width: '100%', 
                                height: '40px',
                                ...(isEditable ? {} : {
                                  backgroundColor: '#f8f9fa',
                                  border: 'none',
                                  color: '#374151',
                                  borderRadius: '6px'
                                })
                              }}
                            />
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#374151',
                            height: '40px'
                          }}>
                            <span style={{ color: '#6b7280' }}>$</span>
                            <span>1,005.00</span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <Button icon={<Camera size={14} />} style={{ padding: '4px', minWidth: '32px', height: '40px' }} />
                            <Popconfirm
                              title="Remove SO from the Load?"
                              description="Material will be removed from the load, but still will be kept on the Sales Order. Do you want to proceed?"
                              onConfirm={() => handleDeleteSOMaterial('so-5')}
                              okText="Yes"
                              cancelText="No"
                            >
                              <Button icon={<Trash2 size={14} />} danger style={{ padding: '4px', minWidth: '32px', height: '40px' }} />
                            </Popconfirm>
                          </div>
                        </div>
                        )}
                      </div>

                      {/* Summary Row */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr 1.2fr 1.3fr 1.2fr 60px',
                        gap: '6px',
                        padding: '8px 12px',
                        backgroundColor: '#f8f9fa',
                        borderTop: '1px solid #e5e7eb',
                        fontWeight: '600'
                      }}>
                        <div style={{ fontSize: '14px', color: '#374151' }}>
                          {soMaterials.length} Materials
                        </div>
                        <div></div>
                        <div style={{ fontSize: '14px', color: '#374151', textAlign: 'center' }}>
                          {(() => {
                            const lbMaterials = soMaterials.filter(m => m.pricingUnit === 'lb')
                            const eaMaterials = soMaterials.filter(m => m.pricingUnit === 'ea')
                            const ntMaterials = soMaterials.filter(m => m.pricingUnit === 'NT')
                            
                            // Convert NT to lb (1 NT = 2000 lb)
                            const lbTotal = lbMaterials.reduce((sum, m) => sum + (m.soWeight || 0), 0) +
                                           ntMaterials.reduce((sum, m) => sum + ((m.soWeight || 0) * 2000), 0)
                            const eaTotal = eaMaterials.reduce((sum, m) => sum + (m.soWeight || 0), 0)
                            
                            return (
                              <>
                                {lbTotal > 0 && `${lbTotal.toLocaleString()} lb`}
                                {lbTotal > 0 && eaTotal > 0 && <br />}
                                {eaTotal > 0 && `${eaTotal} ea`}
                              </>
                            )
                          })()}
                        </div>
                        <div style={{ fontSize: '14px', color: '#374151', textAlign: 'center' }}>
                          {(() => {
                            const lbMaterials = soMaterials.filter(m => m.pricingUnit === 'lb')
                            const eaMaterials = soMaterials.filter(m => m.pricingUnit === 'ea')
                            const ntMaterials = soMaterials.filter(m => m.pricingUnit === 'NT')
                            
                            // Convert NT to lb (1 NT = 2000 lb)
                            const lbTotal = lbMaterials.reduce((sum, m) => sum + (m.soRemainingWeight || 0), 0) +
                                           ntMaterials.reduce((sum, m) => sum + ((m.soRemainingWeight || 0) * 2000), 0)
                            const eaTotal = eaMaterials.reduce((sum, m) => sum + (m.soRemainingWeight || 0), 0)
                            
                            return (
                              <>
                                {lbTotal > 0 && `${lbTotal.toLocaleString()} lb`}
                                {lbTotal > 0 && eaTotal > 0 && <br />}
                                {eaTotal > 0 && `${eaTotal} ea`}
                              </>
                            )
                          })()}
                        </div>
                        <div style={{ fontSize: '14px', color: '#374151', textAlign: 'center' }}>
                          {(() => {
                            const lbMaterials = soMaterials.filter(m => m.pricingUnit === 'lb')
                            const eaMaterials = soMaterials.filter(m => m.pricingUnit === 'ea')
                            const ntMaterials = soMaterials.filter(m => m.pricingUnit === 'NT')
                            
                            // Convert NT to lb (1 NT = 2000 lb)
                            const lbTotal = lbMaterials.reduce((sum, m) => sum + (m.requestedWeight || 0), 0) +
                                           ntMaterials.reduce((sum, m) => sum + ((m.requestedWeight || 0) * 2000), 0)
                            const eaTotal = eaMaterials.reduce((sum, m) => sum + (m.requestedWeight || 0), 0)
                            
                            return (
                              <>
                                {lbTotal > 0 && `${lbTotal.toLocaleString()} lb`}
                                {lbTotal > 0 && eaTotal > 0 && <br />}
                                {eaTotal > 0 && `${eaTotal} ea`}
                              </>
                            )
                          })()}
                        </div>
                        <div></div>
                        <div style={{ fontSize: '14px', color: '#374151', textAlign: 'right' }}>
                          $ {soMaterials.reduce((sum, m) => sum + (m.estimatedTotal || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div></div>
                      </div>

                      {/* Add SO Material Dropdown */}
                      <div style={{ padding: '16px' }}>
                        <Dropdown
                          menu={{
                            items: getAvailableSOMaterials().map(material => ({
                              key: material.id,
                              label: material.contractMaterial,
                              onClick: () => handleAddSOMaterial(material.id)
                            }))
                          }}
                          disabled={!isEditable || getAvailableSOMaterials().length === 0}
                          trigger={['click']}
                        >
                          <Button
                            icon={<Plus size={16} />}
                            style={{ height: '40px' }}
                          >
                            Add SO Material {getAvailableSOMaterials().length > 0 && `(${getAvailableSOMaterials().length})`}
                          </Button>
                        </Dropdown>
                      </div>
                    </div>
                  </div>
                )}

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
                            <th style={{ padding: '0px 8px 0px 8px', textAlign: 'right', fontWeight: '600', fontSize: '14px' }}>Unit Price</th>
                            <th style={{ padding: '0px 8px 0px 8px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Pricing Unit</th>
                            <th style={{ padding: '0px 8px 0px 8px', textAlign: 'right', fontWeight: '600', fontSize: '14px' }}>Requested Weight</th>
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
                              {/* Material */}
                              <td style={{ padding: '6px' }} onClick={(e) => e.stopPropagation()}>
                                <Select
                                  placeholder="Select Material"
                                  style={{ 
                                    width: '100%', 
                                    height: '40px',
                                    ...(isEditable ? {} : {
                                      backgroundColor: '#f8f9fa',
                                      border: 'none',
                                      color: '#495057'
                                    })
                                  }}
                                  value={material.contractMaterial}
                                  disabled={!isEditable}
                                  onChange={(value) => updateMaterial(index, 'contractMaterial', value)}
                                  showSearch
filterOption={(input, option) =>
  (option?.value as string)?.toLowerCase().includes(input.toLowerCase())
}
                                >
                                  {availableMaterials.map((mat) => (
                                    <Select.Option key={mat.name} value={mat.name}>
                                      {mat.name}
                                    </Select.Option>
                                  ))}
                                </Select>
                              </td>
                              {/* Unit Price */}
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
                                      disabled={!isEditable}
                                      style={{
                                        padding: '4px 8px',
                                        borderRadius: '3px',
                                        border: 'none',
                                        background: !material.isFormula ? '#3b82f6' : 'transparent',
                                        color: !isEditable ? '#9ca3af' : (!material.isFormula ? '#fff' : '#374151'),
                                        fontWeight: '500',
                                        fontSize: '12px',
                                        cursor: !isEditable ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        opacity: !isEditable ? 0.5 : 1
                                      }}
                                    >
                                      $
                                    </button>
                                    <button
                                      onClick={() => updateMaterial(index, 'isFormula', true)}
                                      disabled={!isEditable}
                                      style={{
                                        padding: '4px 8px',
                                        borderRadius: '3px',
                                        border: 'none',
                                        background: material.isFormula ? '#3b82f6' : 'transparent',
                                        color: !isEditable ? '#9ca3af' : (material.isFormula ? '#fff' : '#374151'),
                                        fontWeight: '500',
                                        fontSize: '12px',
                                        cursor: !isEditable ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        opacity: !isEditable ? 0.5 : 1
                                      }}
                                    >
                                      fx
                                    </button>
                                  </div>
                                  
                                  {/* Input field */}
                                  {material.isFormula ? (
                                    <div style={{ position: 'relative', flex: 1 }} className="formula-input">
                                      <Input
                                        ref={(el) => { inputRefs.current[index] = el as any }}
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
                                      className="load-unit-price-input"
                                      value={typeof material.unitPrice === 'number' ? material.unitPrice : 0}
                                      onChange={(val) => updateMaterial(index, 'unitPrice', val || 0)}
                                      disabled={!isEditable}
                                      style={{
                                        ...(isEditable ? {} : {
                                          backgroundColor: '#f8f9fa',
                                          border: 'none',
                                          color: '#495057'
                                        }), 
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
                              {/* Pricing Unit */}
                              <td style={{ padding: '6px' }} onClick={(e) => e.stopPropagation()}>
                                <Select
                                  value={material.pricingUnit || 'lb'}
                                  onChange={(value) => updateMaterial(index, 'pricingUnit', value)}
                                  style={{ 
                                    width: '80px', 
                                    height: '40px',
                                    ...(isEditable ? {} : {
                                      backgroundColor: '#f8f9fa',
                                      border: 'none',
                                      color: '#495057'
                                    })
                                  }}
                                  disabled={!isEditable || (() => {
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
                              {/* Requested Weight */}
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
                                        disabled={!isEditable}
                                        style={{
                                          ...(isEditable ? {} : {
                                            backgroundColor: '#f8f9fa',
                                            border: 'none',
                                            color: '#495057'
                                          }), 
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
                                            disabled={!isEditable}
                                            style={{
                                              ...(isEditable ? {} : {
                                                backgroundColor: '#f8f9fa',
                                                border: 'none',
                                                color: '#495057'
                                              }),
                                              flex: 1,
                                              border: 'none',
                                              background: 'transparent',
                                              textAlign: 'right',
                                              boxShadow: 'none',
                                              paddingRight: '6px'
                                            }}
                                            onChange={(val) => {
                                              // Always store weight in pounds internally
                                              const newWeight = weightMode === 'scale' ? val || 0 : convertWeight(val || 0, material.pricingUnit || 'lb', 'lb')
                                              updateMaterial(index, 'netWeight', newWeight)
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
                              {/* Inventory Tags */}
                              <td style={{ padding: '6px' }} onClick={(e) => e.stopPropagation()}>
                                <Select
                                  mode="multiple"
                                  placeholder="Select Tags"
                                  style={{ 
                                    width: '120px', 
                                    height: '40px',
                                    ...(isEditable ? {} : {
                                      backgroundColor: '#f8f9fa',
                                      border: 'none',
                                      color: '#495057'
                                    })
                                  }}
                                  value={material.inventoryTags || []}
                                  onChange={(value) => updateMaterial(index, 'inventoryTags', value)}
                                  disabled={!isEditable}
                                  maxTagCount={1}
                                  maxTagTextLength={6}
                                  tagRender={(props: any) => {
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
                                    return <span></span>;
                                  }}
                                >
                                  <Select.Option value="TAG001">TAG001</Select.Option>
                                  <Select.Option value="TAG002">TAG002</Select.Option>
                                  <Select.Option value="TAG003">TAG003</Select.Option>
                                  <Select.Option value="TAG004">TAG004</Select.Option>
                                </Select>
                              </td>
                              {/* Estimated Total */}
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
                              {/* Delete button */}
                              <td style={{ padding: '6px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                <Button
                                  danger
                                  icon={<Trash2 size={16} />}
                                  style={{ width: '40px', height: '40px' }}
                                  disabled={!isEditable}
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
                                  disabled={!isEditable}
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
  (option?.value as string)?.toLowerCase().includes(input.toLowerCase())
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
                                          disabled={!isEditable}
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
                                              disabled={!isEditable}
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
                                    disabled={!isEditable}
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
                                  const selectedMaterial = availableTaggedMaterials.find(am => am.name === m.contractMaterial) ||
                                                          availableMaterials.find(am => am.name === m.contractMaterial)
                                  return !selectedMaterial?.isEachMaterial
                                })
                                const eaMaterials = materials.filter(m => {
                                  const selectedMaterial = availableTaggedMaterials.find(am => am.name === m.contractMaterial) ||
                                                          availableMaterials.find(am => am.name === m.contractMaterial)
                                  return selectedMaterial?.isEachMaterial
                                })
                                
                                const lbTotal = lbMaterials.reduce((sum, m) => sum + (m.grossWeight || 0), 0)
                                const eaTotal = eaMaterials.reduce((sum, m) => sum + (m.grossWeight || 0), 0)
                                
                                return (
                                  <>
                                    <div style={{ fontWeight: 'bold' }}>
                                      <strong>{lbTotal.toFixed(2)}</strong> <span style={{ fontWeight: 'normal', color: '#6b7280' }}>lb</span>
                                    </div>
                                    {eaTotal > 0 && (
                                      <div style={{ fontWeight: 'bold' }}>
                                        <strong>{eaTotal.toFixed(0)}</strong> <span style={{ fontWeight: 'normal', color: '#6b7280' }}>ea</span>
                                      </div>
                                    )}
                                  </>
                                )
                              })()}
                            </div>
                          </td>
                          <td style={{ padding: '6px', textAlign: 'left' }}>
                            <div style={{ fontSize: '14px', color: '#071429' }}>
                              {(() => {
                                const lbMaterials = materials.filter(m => {
                                  const selectedMaterial = availableTaggedMaterials.find(am => am.name === m.contractMaterial) ||
                                                        availableMaterials.find(am => am.name === m.contractMaterial)
                                  return !selectedMaterial?.isEachMaterial
                                })
                                const eaMaterials = materials.filter(m => {
                                  const selectedMaterial = availableTaggedMaterials.find(am => am.name === m.contractMaterial) ||
                                                        availableMaterials.find(am => am.name === m.contractMaterial)
                                  return selectedMaterial?.isEachMaterial
                                })
                                
                                const lbTotal = lbMaterials.reduce((sum, m) => sum + (m.tareWeight || 0), 0)
                                const eaTotal = eaMaterials.length // Count of ea materials (they don't have tare)
                                
                                return (
                                  <div style={{ fontWeight: 'bold' }}>
                                    <strong>{lbTotal.toFixed(2)}</strong> <span style={{ fontWeight: 'normal', color: '#6b7280' }}>lb</span>
                                  </div>
                                )
                              })()}
                            </div>
                          </td>
                          <td style={{ padding: '6px', textAlign: 'left' }}>
                            <div style={{ fontSize: '14px', color: '#071429' }}>
                              {(() => {
                                const lbMaterials = materials.filter(m => {
                                  const selectedMaterial = availableTaggedMaterials.find(am => am.name === m.contractMaterial) ||
                                                          availableMaterials.find(am => am.name === m.contractMaterial)
                                  return !selectedMaterial?.isEachMaterial
                                })
                                const eaMaterials = materials.filter(m => {
                                  const selectedMaterial = availableTaggedMaterials.find(am => am.name === m.contractMaterial) ||
                                                          availableMaterials.find(am => am.name === m.contractMaterial)
                                  return selectedMaterial?.isEachMaterial
                                })
                                
                                const lbNetTotal = lbMaterials.reduce((sum, m) => sum + ((m.grossWeight || 0) - (m.tareWeight || 0)), 0)
                                const eaTotal = eaMaterials.reduce((sum, m) => sum + (m.grossWeight || 0), 0)
                                
                                return (
                                  <>
                                    <div style={{ fontWeight: 'bold' }}>
                                      <strong>{lbNetTotal.toFixed(2)}</strong> <span style={{ fontWeight: 'normal', color: '#6b7280' }}>lb</span>
                                    </div>
                                    {eaTotal > 0 && (
                                      <div style={{ fontWeight: 'bold' }}>
                                        <strong>{eaTotal.toFixed(0)}</strong> <span style={{ fontWeight: 'normal', color: '#6b7280' }}>ea</span>
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
                          style={{ 
                            width: '80px',
                            ...(isEditable ? {} : {
                              backgroundColor: '#f8f9fa',
                              border: 'none',
                              color: '#495057'
                            })
                          }}
                          size="small"
                          disabled={!isEditable}
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
                              const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                              if (nextElement) {
                                nextElement.style.display = 'block'
                              }
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
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '0px 8px 0px 8px', textAlign: 'left' }}>
                          <span style={{ fontSize: '14px', color: '#071429', fontWeight: '600' }}>
                            {materials.length} Materials
                          </span>
                        </td>
                        <td style={{ padding: '0px 8px 0px 8px', textAlign: 'right' }}>
                          {/* Unit Price column - empty */}
                        </td>
                        <td style={{ padding: '0px 8px 0px 8px', textAlign: 'left' }}>
                          {/* Pricing Unit column - empty */}
                        </td>
                        <td style={{ padding: '0px 8px 0px 8px', textAlign: 'right' }}>
                          <span style={{ fontSize: '14px', color: '#071429', fontWeight: '600' }}>
                            {(() => {
                              // Calculate separate totals for weight materials and each materials
                              const weightMaterials = materials.filter(m => !m.isEachMaterial)
                              const eachMaterials = materials.filter(m => m.isEachMaterial)
                              
                              const weightTotal = weightMaterials.reduce((sum, m) => {
                                const weightInPounds = convertWeight(m.netWeight || 0, weightMode === 'scale' ? 'lb' : (m.pricingUnit || 'lb'), 'lb')
                                return sum + weightInPounds
                              }, 0)
                              
                              const eachTotal = eachMaterials.reduce((sum, m) => sum + (m.netWeight || 0), 0)
                              
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                  {weightTotal > 0 && <div>{weightTotal.toFixed(2)} lb</div>}
                                  {eachTotal > 0 && <div>{eachTotal.toFixed(0)} ea</div>}
                                </div>
                              )
                            })()}
                          </span>
                        </td>
                        <td style={{ padding: '0px 8px 0px 8px', textAlign: 'left' }}>
                          {/* Inventory Tags column - empty */}
                        </td>
                        <td style={{ padding: '0px 8px 0px 8px', textAlign: 'right' }}>
                          <span style={{ fontSize: '14px', color: '#071429', fontWeight: '600' }}>
                            ${(Math.round(materials.reduce((sum, m) => sum + (m.estimatedTotal || 0), 0) * 100) / 100).toFixed(2)}
                          </span>
                        </td>
                        <td style={{ padding: '0px 8px 0px 8px', textAlign: 'center' }}>
                          {/* Actions column - empty */}
                        </td>
                      </tr>
                    </tbody>
                  </table>
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
                        tagNumber: '',
                      }
                      const newMaterials = [...materials, newMaterial]
                      setMaterials(newMaterials)
                      setHasChanges(true)
                    }}
                    style={{ height: '40px' }}
                    disabled={!isEditable}
                  >
                    Add Material
                  </Button>
                  
                  {requestMode === 'staged' && (
                    <Button
                      icon={<Plus size={16} />}
                      disabled={!isEditable}
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
                          tagNumber: '',
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
          <Button onClick={handleDiscard} disabled={!isEditable}>Discard</Button>
          <Button type="primary" onClick={handleSave} disabled={!isEditable} className="load-save-updates-button">Save updates</Button>
        </div>
      )}
    </div>
  )
}