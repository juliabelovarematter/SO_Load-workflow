import { useState, useEffect, useRef } from 'react'
import { useRoute } from 'wouter'
import { Button, Tag, Tabs, Form, Input, Select, DatePicker, InputNumber } from 'antd'
import { ArrowLeft, Trash2, Plus, Upload, FileText, StickyNote, Monitor, Weight, Camera, CheckCircle } from 'lucide-react'
import dayjs from 'dayjs'
import { generateLoadData, generateSOData } from '../../utils/mockData'

// Material interface (enhanced for SO Materials)
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
  // SO Material specific properties
  soWeight?: number
  soRemainingWeight?: number
  requestedWeight?: number
  source?: 'so' | 'load'
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

  // Handle SO selection - ONLY change status if load is editable (Unassigned/Open)
  const handleSOSelection = (soNumber: string) => {
    if (soNumber) {
      // Add the exact SO materials from the screenshot
      const soMaterialsData = [
        {
          id: 'so-1',
          contractMaterial: '101 - Aluminum Cans',
          unitPrice: 0.12,
          pricingUnit: 'lb' as const,
          soWeight: 500,
          soRemainingWeight: 450,
          requestedWeight: 450,
          estimatedTotal: 1230.90,
          source: 'so' as const
        },
        {
          id: 'so-2', 
          contractMaterial: '100 - Aluminum Radiator',
          unitPrice: 0.12,
          pricingUnit: 'lb' as const,
          soWeight: 500,
          soRemainingWeight: 450,
          requestedWeight: 450,
          estimatedTotal: 5000.50,
          source: 'so' as const
        },
        {
          id: 'so-3',
          contractMaterial: '300 - Copper',
          unitPrice: 0.12,
          pricingUnit: 'lb' as const,
          soWeight: 500,
          soRemainingWeight: 450,
          requestedWeight: 450,
          estimatedTotal: 910.00,
          source: 'so' as const
        },
        {
          id: 'so-4',
          contractMaterial: '302 - Copper no. 2',
          unitPrice: 0.12,
          pricingUnit: 'NT' as const,
          soWeight: 12,
          soRemainingWeight: 10,
          requestedWeight: 3,
          estimatedTotal: 18865.50,
          source: 'so' as const
        },
        {
          id: 'so-5',
          contractMaterial: '303 - Copper no. 1',
          unitPrice: 3.00,
          pricingUnit: 'ea' as const,
          soWeight: 10,
          soRemainingWeight: 4,
          requestedWeight: 4,
          estimatedTotal: 1005.00,
          source: 'so' as const
        }
      ]
      
      setSoMaterials(soMaterialsData)
      
      // ONLY change status if load is editable (Unassigned/Open)
      if (isEditable) {
        setLoadData((prev: any) => {
          return { ...prev, status: 'Open', relatedSO: soNumber }
        })
        console.log('SO selected:', soNumber, '- Status changed to Open (editable load)')
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
      
      // ONLY change status if load is editable (Unassigned/Open)
      if (isEditable) {
        setLoadData((prev: any) => {
          return { ...prev, status: 'Unassigned', relatedSO: null }
        })
        console.log('SO cleared - Status changed to Unassigned (editable load)')
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

  // Update materials count whenever materials or soMaterials arrays change
  useEffect(() => {
    setMaterialsCount(soMaterials.length + materials.length)
  }, [materials, soMaterials])

  // Handle SO material deletion
  const handleDeleteSOMaterial = (materialId: string) => {
    const updatedSOmaterials = soMaterials.filter(material => material.id !== materialId)
    setSoMaterials(updatedSOmaterials)
    setHasChanges(true)
    console.log('SO Material deleted:', materialId)
  }

  // Handle SO material requested weight update
  const handleSOmaterialWeightChange = (materialId: string, newWeight: number) => {
    const updatedSOmaterials = soMaterials.map(material => {
      if (material.id === materialId) {
        const updatedMaterial = { ...material, requestedWeight: newWeight }
        // Recalculate estimated total
        updatedMaterial.estimatedTotal = newWeight * (material.unitPrice || 0)
        return updatedMaterial
      }
      return material
    })
    setSoMaterials(updatedSOmaterials)
    setHasChanges(true)
    console.log('SO Material weight updated:', materialId, newWeight)
  }

  // Handle "Use remaining weight" button click
  const handleUseRemainingWeight = (materialId: string) => {
    const material = soMaterials.find(m => m.id === materialId)
    if (material && material.soRemainingWeight) {
      handleSOmaterialWeightChange(materialId, material.soRemainingWeight)
      console.log('Used remaining weight for material:', materialId, material.soRemainingWeight)
    }
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
          // PRESERVE THE EXACT STATUS from generated data - DO NOT OVERRIDE!
          console.log('🔍 Load from table - preserving exact status:', data.status)
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
        relatedSO: data.relatedSO,
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
      
      // Load SO materials if this load has a related SO (regardless of status)
      if (data.relatedSO) {
        console.log('🔍 Load has related SO:', data.relatedSO, 'Status:', data.status)
        
        // Use the exact SO materials data for consistency
        const soMaterialsData = [
          {
            id: 'so-1',
            contractMaterial: '101 - Aluminum Cans',
            unitPrice: 0.12,
            pricingUnit: 'lb' as const,
            soWeight: 500,
            soRemainingWeight: 450,
            requestedWeight: 450,
            estimatedTotal: 1230.90,
            source: 'so' as const
          },
          {
            id: 'so-2', 
            contractMaterial: '100 - Aluminum Radiator',
            unitPrice: 0.12,
            pricingUnit: 'lb' as const,
            soWeight: 500,
            soRemainingWeight: 450,
            requestedWeight: 450,
            estimatedTotal: 5000.50,
            source: 'so' as const
          },
          {
            id: 'so-3',
            contractMaterial: '300 - Copper',
            unitPrice: 0.12,
            pricingUnit: 'lb' as const,
            soWeight: 500,
            soRemainingWeight: 450,
            requestedWeight: 450,
            estimatedTotal: 910.00,
            source: 'so' as const
          },
          {
            id: 'so-4',
            contractMaterial: '302 - Copper no. 2',
            unitPrice: 0.12,
            pricingUnit: 'NT' as const,
            soWeight: 12,
            soRemainingWeight: 10,
            requestedWeight: 3,
            estimatedTotal: 18865.50,
            source: 'so' as const
          },
          {
            id: 'so-5',
            contractMaterial: '303 - Copper no. 1',
            unitPrice: 3.00,
            pricingUnit: 'ea' as const,
            soWeight: 10,
            soRemainingWeight: 4,
            requestedWeight: 4,
            estimatedTotal: 1005.00,
            source: 'so' as const
          }
        ]
        
        setSoMaterials(soMaterialsData)
        console.log('🔍 SO Materials loaded:', soMaterialsData.length)
      } else {
        console.log('🔍 No related SO, clearing SO materials')
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
                    placeholder="Select SO"
                    disabled={!isEditable}
                    allowClear
                    onChange={handleSOSelection}
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
            <h2>Materials Tab</h2>
            <p>SO Materials functionality will be implemented here.</p>
            {soMaterials.length > 0 && (
              <div>
                <h3>SO Materials ({soMaterials.length})</h3>
                <ul>
                  {soMaterials.map((material: any) => (
                    <li key={material.id}>
                      {material.contractMaterial} - ${material.unitPrice}/{material.pricingUnit}
                      <button onClick={() => handleDeleteSOMaterial(material.id)} disabled={!isEditable}>
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <h3>Load Materials ({materials.length})</h3>
              {materials.length === 0 ? (
                <div>
                  <p>No materials added yet</p>
                  <Button onClick={() => setMaterials([{ id: 1 }])} disabled={!isEditable}>
                    Add Material
                  </Button>
                </div>
              ) : (
                <p>Load materials will go here</p>
              )}
            </div>
          </div>
        )}

        {/* Other tabs content can go here */}
        {activeTab !== 'materials' && (
          <div style={{ padding: '24px' }}>
            <p>Content for {activeTab} tab</p>
          </div>
        )}

        {/* Fixed Bottom Action Bar */}
        {hasChanges && isEditable && (
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
            <Button type="primary" onClick={handleSave} disabled={!isEditable}>Save updates</Button>
          </div>
        )}
      </div>
    )
  }

