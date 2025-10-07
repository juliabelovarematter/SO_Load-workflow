import React, { useState, useEffect, useRef } from 'react'
import { Button, Input, Select, Table, InputNumber, Popconfirm, Dropdown, Switch } from 'antd'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { PriceInput } from './PriceInput'

const { Option } = Select

interface Material {
  id: string
  contractMaterial: string
  netWeight: number
  unitPrice: string | number
  pricingUnit: 'lb' | 'NT' | 'kg' | 'MT' | 'ea'
  estimatedTotal: number
  isFormula: boolean
  isEachMaterial?: boolean
  selectedExchange?: string
}

interface AvailableMaterial {
  name: string
  unit: 'lb' | 'NT' | 'kg' | 'MT' | 'ea'
  availableWeight: number
  details: {
    loose: number
    tagged: {
      wip: number
      fg: number
    }
  }
  isEachMaterial?: boolean
}

interface MaterialsTabProps {
  onMaterialsChange?: (count: number) => void
  savedMaterials?: Material[]
  onSaveMaterials?: (materials: Material[]) => void
  facilityName?: string
}

// Weight conversion utility
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
    case 'lb':
      weightInPounds = weight
      break
    case 'ea':
      return weight // No conversion for 'each' materials
    default:
      weightInPounds = weight
  }
  
  // Convert from pounds to target unit
  switch (toUnit) {
    case 'NT':
      return weightInPounds / 2000
    case 'kg':
      return weightInPounds / 2.20462
    case 'MT':
      return weightInPounds / 2204.62
    case 'lb':
      return weightInPounds
    case 'ea':
      return weight // No conversion for 'each' materials
    default:
      return weightInPounds
  }
}

const MaterialsTab: React.FC<MaterialsTabProps> = ({ 
  onMaterialsChange, 
  savedMaterials = [], 
  onSaveMaterials,
  facilityName = 'ReMatter Headquarters'
}) => {
  const [materials, setMaterials] = useState<Material[]>(savedMaterials)
  const [weightMode, setWeightMode] = useState<'scale' | 'price'>('scale')
  const [expandedMaterials, setExpandedMaterials] = useState<Set<number>>(new Set())
  const [hasChanges, setHasChanges] = useState(false)
  const [originalMaterials, setOriginalMaterials] = useState<Material[]>(savedMaterials)

  // Sync materials with parent component
  useEffect(() => {
    setMaterials(savedMaterials)
    setOriginalMaterials(savedMaterials)
    setHasChanges(false)
  }, [savedMaterials])
  const [showAvailableInventory, setShowAvailableInventory] = useState(true)
  const [dropdownVisible, setDropdownVisible] = useState<{ [key: number]: boolean }>({})
  const [dropdownPosition, setDropdownPosition] = useState<{ [key: number]: { top: number, left: number } }>({})
  const inputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})
  const previousValues = useRef<{ [key: number]: string }>({})

  // Handle weight mode changes and unit conversions
  useEffect(() => {
    if (materials.length === 0) return
    
    const updatedMaterials = materials.map(material => {
      if (material.isEachMaterial) return material // Skip conversion for "ea" materials
      
      const currentWeight = material.netWeight
      const currentUnit = material.pricingUnit
      
      if (weightMode === 'scale') {
        // Convert to scale unit (pounds) - always show in pounds
        const weightInPounds = convertWeight(currentWeight, currentUnit, 'lb')
        return {
          ...material,
          netWeight: weightInPounds
        }
      } else {
        // Convert to price unit - show in the material's pricing unit
        const weightInPriceUnit = convertWeight(currentWeight, 'lb', currentUnit)
        return {
          ...material,
          netWeight: weightInPriceUnit
        }
      }
    })
    
    setMaterials(updatedMaterials)
    setHasChanges(true)
  }, [weightMode])


  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.formula-dropdown') && !target.closest('.formula-input')) {
        setDropdownVisible({})
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const availableMaterials: AvailableMaterial[] = [
    { name: 'Copper', unit: 'lb', availableWeight: 5000, details: { loose: 2000, tagged: { wip: 1500, fg: 1500 } } },
    { name: 'Aluminum', unit: 'lb', availableWeight: 3000, details: { loose: 1200, tagged: { wip: 900, fg: 900 } } },
    { name: 'Steel', unit: 'lb', availableWeight: 8000, details: { loose: 3000, tagged: { wip: 2500, fg: 2500 } } },
    { name: '305 - Brass Rod', unit: 'lb', availableWeight: 2500, details: { loose: 1000, tagged: { wip: 800, fg: 700 } } },
    { name: '107 - Al 1100', unit: 'lb', availableWeight: 4000, details: { loose: 1500, tagged: { wip: 1200, fg: 1300 } } },
    { name: '605 - Lead Cable', unit: 'ea', availableWeight: 150, details: { loose: 50, tagged: { wip: 40, fg: 60 } }, isEachMaterial: true },
    { name: '101 - Aluminum Cans', unit: 'lb', availableWeight: 6000, details: { loose: 2500, tagged: { wip: 2000, fg: 1500 } } },
    { name: 'Brass', unit: 'lb', availableWeight: 3500, details: { loose: 1400, tagged: { wip: 1100, fg: 1000 } } },
    { name: 'Lead', unit: 'lb', availableWeight: 2000, details: { loose: 800, tagged: { wip: 600, fg: 600 } } },
    { name: 'Tin', unit: 'lb', availableWeight: 1500, details: { loose: 600, tagged: { wip: 450, fg: 450 } } },
    { name: '#108 - Al 6063', unit: 'lb', availableWeight: 1001088, details: { loose: 917976, tagged: { wip: 65608, fg: 17504 } } },
    // Each materials - these should default to 'ea' unit and cannot be changed
    { name: 'EACH', unit: 'ea', availableWeight: 100, details: { loose: 40, tagged: { wip: 30, fg: 30 } }, isEachMaterial: true },
    { name: 'EA MAT 2', unit: 'ea', availableWeight: 75, details: { loose: 30, tagged: { wip: 25, fg: 20 } }, isEachMaterial: true },
    { name: 'EA MAT 3', unit: 'ea', availableWeight: 50, details: { loose: 20, tagged: { wip: 15, fg: 15 } }, isEachMaterial: true },
    { name: 'EA MAT 4', unit: 'ea', availableWeight: 25, details: { loose: 10, tagged: { wip: 8, fg: 7 } }, isEachMaterial: true },
    { name: 'Freight pick under 10 Miles', unit: 'ea', availableWeight: 200, details: { loose: 80, tagged: { wip: 60, fg: 60 } }, isEachMaterial: true },
    { name: 'Online Review', unit: 'ea', availableWeight: 150, details: { loose: 60, tagged: { wip: 45, fg: 45 } }, isEachMaterial: true },
    { name: 'First Time Customer', unit: 'ea', availableWeight: 100, details: { loose: 40, tagged: { wip: 30, fg: 30 } }, isEachMaterial: true },
    { name: 'Freight', unit: 'ea', availableWeight: 300, details: { loose: 120, tagged: { wip: 90, fg: 90 } }, isEachMaterial: true },
    { name: 'Landfill Fee', unit: 'ea', availableWeight: 80, details: { loose: 32, tagged: { wip: 24, fg: 24 } }, isEachMaterial: true },
    { name: 'Tipping Fee', unit: 'ea', availableWeight: 60, details: { loose: 24, tagged: { wip: 18, fg: 18 } }, isEachMaterial: true },
    { name: 'Dirt', unit: 'ea', availableWeight: 40, details: { loose: 16, tagged: { wip: 12, fg: 12 } }, isEachMaterial: true },
    { name: 'HVAC 1', unit: 'ea', availableWeight: 90, details: { loose: 36, tagged: { wip: 27, fg: 27 } }, isEachMaterial: true }
  ]

  const addMaterial = () => {
    const newMaterial: Material = {
      id: Date.now().toString(),
      contractMaterial: '',
      netWeight: 0,
      unitPrice: 0,
      pricingUnit: 'lb',
      estimatedTotal: 0,
      isFormula: false,
      isEachMaterial: false,
      selectedExchange: 'COMEX'
    }
    setMaterials([...materials, newMaterial])
    setHasChanges(true)
  }

  const updateMaterial = (index: number, field: keyof Material, value: any) => {
    console.log('Updating material:', { index, field, value })
    const updatedMaterials = [...materials]
    updatedMaterials[index] = { ...updatedMaterials[index], [field]: value }
    
    // Auto-expand material in sidebar when contractMaterial is selected
    if (field === 'contractMaterial' && value) {
      const newExpanded = new Set(expandedMaterials)
      newExpanded.add(index)
      setExpandedMaterials(newExpanded)
    }
    
    // Handle each material logic
    if (field === 'contractMaterial') {
      const selectedMaterial = availableMaterials.find(am => am.name === value)
      if (selectedMaterial?.isEachMaterial) {
        updatedMaterials[index].isEachMaterial = true
        updatedMaterials[index].pricingUnit = 'ea'
      } else if (updatedMaterials[index].pricingUnit === 'ea') {
        updatedMaterials[index].pricingUnit = 'lb'
        updatedMaterials[index].isEachMaterial = false
      }
    }
    
    // Calculate estimated total
    const material = updatedMaterials[index]
    if (material.netWeight && material.unitPrice) {
      if (material.isFormula) {
        // For formula mode, use a simple calculation (in real app, would parse formula)
        if (material.isEachMaterial) {
          // For each materials, no conversion needed
          updatedMaterials[index].estimatedTotal = material.netWeight * 10 // placeholder calculation
        } else {
          // Convert weight to pounds for calculation if needed
          const weightForCalculation = convertWeight(material.netWeight, weightMode === 'scale' ? 'lb' : material.pricingUnit, 'lb')
          updatedMaterials[index].estimatedTotal = weightForCalculation * 10 // placeholder calculation
        }
      } else {
        if (material.isEachMaterial) {
          // For each materials, no conversion needed
          updatedMaterials[index].estimatedTotal = material.netWeight * (typeof material.unitPrice === 'number' ? material.unitPrice : 0)
        } else {
          // Calculate estimated total with proper unit conversion
          let weightInPricingUnit = material.netWeight
          
          // If weight mode is 'scale' (pounds) but pricing unit is different, convert weight to pricing unit
          if (weightMode === 'scale' && material.pricingUnit !== 'lb') {
            switch (material.pricingUnit) {
              case 'NT': // Net Ton = 2000 lbs
                weightInPricingUnit = material.netWeight / 2000
                break
              case 'kg': // Kilogram = 2.20462 lbs
                weightInPricingUnit = material.netWeight / 2.20462
                break
              case 'MT': // Metric Ton = 2204.62 lbs
                weightInPricingUnit = material.netWeight / 2204.62
                break
              default:
                weightInPricingUnit = material.netWeight
            }
          }
          // If weight mode is 'price' (pricing unit), no conversion needed
          else if (weightMode === 'price') {
            weightInPricingUnit = material.netWeight
          }
          
          updatedMaterials[index].estimatedTotal = weightInPricingUnit * (typeof material.unitPrice === 'number' ? material.unitPrice : 0)
        }
      }
    } else {
      // Reset estimated total if no weight or price
      updatedMaterials[index].estimatedTotal = 0
    }
    
    // Handle formula mode toggle
    if (field === 'isFormula') {
      if (value === true) {
        // Switching to formula mode
        updatedMaterials[index].unitPrice = 'COMEX * 0.6'
        updatedMaterials[index].selectedExchange = 'COMEX'
      } else {
        // Switching to value mode
        updatedMaterials[index].unitPrice = 0
      }
    }
    
    setMaterials(updatedMaterials)
    setHasChanges(true)
  }

  const deleteMaterial = (index: number) => {
    const updatedMaterials = materials.filter((_, i) => i !== index)
    setMaterials(updatedMaterials)
    setHasChanges(true)
  }

  const toggleMaterialExpansion = (index: number) => {
    const newExpanded = new Set(expandedMaterials)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedMaterials(newExpanded)
  }

  const handleFormulaInput = (index: number, value: string) => {
    console.log('Formula input change:', { index, value })
    
    // Update the material first
    updateMaterial(index, 'unitPrice', value)
    
    // Check if $ was just typed
    if (value.endsWith('$')) {
      console.log('$ detected, showing dropdown')
      const inputElement = inputRefs.current[index]
      if (inputElement) {
        const rect = inputElement.getBoundingClientRect()
        console.log('Setting dropdown position:', rect)
        
        setDropdownPosition(prev => ({
          ...prev,
          [index]: {
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width
          }
        }))
        
        setDropdownVisible(prev => ({
          ...prev,
          [index]: true
        }))
        
        console.log('Dropdown should now be visible')
      }
    }
  }

  const insertVariable = (index: number, variable: string) => {
    console.log('Inserting variable:', variable, 'at index:', index)
    
    const currentValue = typeof materials[index].unitPrice === 'string' ? materials[index].unitPrice : ''
    const newValue = currentValue.replace(/\$$/, variable) // Replace the last $ with the variable
    
    console.log('Replacing:', currentValue, 'with:', newValue)
    
    updateMaterial(index, 'unitPrice', newValue)
    
    // Close dropdown
    setDropdownVisible(prev => ({
      ...prev,
      [index]: false
    }))
    
    // Focus back on input
    setTimeout(() => {
      const inputElement = inputRefs.current[index]
      if (inputElement) {
        inputElement.focus()
      }
    }, 0)
  }

  const handleSave = () => {
    console.log('Saving materials:', materials)
    setOriginalMaterials([...materials])
    setHasChanges(false)
    onSaveMaterials?.(materials)
    onMaterialsChange?.(materials.length)
    console.log('Materials saved successfully')
    
  }

  const handleDiscard = () => {
    setMaterials([...originalMaterials])
    setHasChanges(false)
  }

  const columns = [
    {
      title: 'Contract Materials',
      dataIndex: 'contractMaterial',
      key: 'contractMaterial',
      width: 200,
      render: (value: string, record: Material, index: number) => (
        <Select
          value={value}
          onChange={(val) => updateMaterial(index, 'contractMaterial', val)}
          placeholder="Select material"
          style={{ width: '100%' }}
          showSearch
          filterOption={(input, option) =>
            (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
          }
        >
          {availableMaterials.map(material => (
            <Option key={material.name} value={material.name}>
              {material.name}
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 200,
      align: 'right' as const,
      render: (value: string | number, record: Material, index: number) => (
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
                background: !record.isFormula ? '#3b82f6' : 'transparent',
                color: !record.isFormula ? '#fff' : '#374151',
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
              data-testid="formula-toggle"
              style={{
                padding: '4px 8px',
                borderRadius: '3px',
                border: 'none',
                background: record.isFormula ? '#3b82f6' : 'transparent',
                color: record.isFormula ? '#fff' : '#374151',
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
          {record.isFormula ? (
            <div style={{ position: 'relative', flex: 1 }} className="formula-input">
              <Input
                ref={(el) => { inputRefs.current[index] = el }}
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => {
                  const newValue = e.target.value
                  console.log('Input changed to:', newValue)
                  
                  // Update the material
                  updateMaterial(index, 'unitPrice', newValue)
                  
                  // IMMEDIATELY check for $ and show dropdown
                  if (newValue.includes('$')) {
                    console.log('$ FOUND! Showing dropdown immediately')
                    const inputElement = inputRefs.current[index]
                    if (inputElement) {
                      const rect = inputElement.getBoundingClientRect()
                      console.log('Input rect:', rect)
                      
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
                      
                      console.log('Dropdown state set to visible')
                    }
                  }
                }}
                onKeyDown={(e) => {
                  console.log('Key pressed:', e.key)
                  // Also check on keydown for immediate response
                  if (e.key === '$' || (e.shiftKey && e.key === '4')) {
                    console.log('$ KEY DETECTED! Showing dropdown')
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
              {(dropdownVisible[index] || (typeof value === 'string' && value.includes('$'))) && (
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
                  {console.log('Rendering dropdown for index:', index, 'visible:', dropdownVisible[index], 'value:', value)}
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
              className="so-unit-price-input"
              value={typeof value === 'number' ? value : 0}
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
      )
    },
    {
      title: 'Pricing Unit',
      dataIndex: 'pricingUnit',
      key: 'pricingUnit',
      width: 120,
      render: (value: string, record: Material, index: number) => (
        <Select
          value={value}
          onChange={(val) => updateMaterial(index, 'pricingUnit', val)}
          style={{ width: '100%' }}
          disabled={record.isEachMaterial}
          data-testid="material-price-unit"
        >
          <Option value="lb">lb</Option>
          <Option value="NT">NT</Option>
          <Option value="kg">kg</Option>
          <Option value="MT">MT</Option>
          <Option value="ea">ea</Option>
        </Select>
      )
    },
    {
      title: 'Net Weight',
      dataIndex: 'netWeight',
      key: 'netWeight',
      width: 150,
      align: 'right' as const,
      render: (value: number, record: Material, index: number) => {
        // Handle each materials - always show in 'ea' unit
        if (record.isEachMaterial) {
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
                value={value}
                onChange={(val) => updateMaterial(index, 'netWeight', val || 0)}
                style={{ 
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'right',
                  boxShadow: 'none',
                  padding: 0
                }}
                min={0}
                precision={0}
                />
                <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>ea</span>
              </div>
            </div>
          )
        }
        
        // Convert weight based on mode for regular materials
        const displayWeight = weightMode === 'scale' ? value : convertWeight(value, 'lb', record.pricingUnit)
        const displayUnit = weightMode === 'scale' ? 'lb' : record.pricingUnit
        
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
                  const newWeight = weightMode === 'scale' ? val || 0 : convertWeight(val || 0, record.pricingUnit, 'lb')
                  updateMaterial(index, 'netWeight', newWeight)
                }}
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
              <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>{displayUnit}</span>
            </div>
          </div>
        )
      }
    },
    {
      title: 'Estimated Total',
      dataIndex: 'estimatedTotal',
      key: 'estimatedTotal',
      width: 120,
      align: 'right' as const,
      render: (value: number) => `$${value.toLocaleString()}`
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record: Material, index: number) => (
        <Popconfirm
          title="Are you sure you want to delete this material?"
          onConfirm={() => deleteMaterial(index)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="text" danger icon={<Trash2 size={16} />} />
        </Popconfirm>
      )
    }
  ]

  const totalWeightInPounds = materials.reduce((sum, material) => {
    if (material.isEachMaterial) return sum
    // For weight materials, sum the actual netWeight values (they're already in the correct units)
    return sum + (material.netWeight || 0)
  }, 0)

  const totalEachCount = materials.reduce((sum, material) => {
    if (material.isEachMaterial) return sum + (material.netWeight || 0)
    return sum
  }, 0)

  const totalEstimatedValue = materials.reduce((sum, material) => {
    return sum + (material.estimatedTotal || 0)
  }, 0)


  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      paddingBottom: materials.length > 0 && hasChanges ? '80px' : '0' // Add space for fixed buttons
    }}>
      {/* Header Section */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
            Sales Order Materials
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Weight Mode Toggle */}
            {materials.length > 0 && materials.some(m => !m.isEachMaterial) && (
              <div style={{ 
                display: 'flex', 
                background: '#f3f4f6', 
                borderRadius: '8px', 
                padding: '2px',
                border: '1px solid #e5e7eb'
              }}>
                <button
                  className="scale-unit-weight-toggle"
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
                  className="price-unit-weight-toggle"
                  onClick={() => setWeightMode('price')}
                  data-testid="price-unit-weight-toggle"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: weightMode === 'price' ? '#3b82f6' : 'transparent',
                    color: weightMode === 'price' ? '#fff' : '#374151',
                    fontWeight: '500',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Price Unit Weight
                </button>
              </div>
            )}
            
            {/* Show Available Inventory Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Switch
                checked={showAvailableInventory}
                onChange={setShowAvailableInventory}
                size="small"
              />
              <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                Show available inventory
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Container Layout */}
      <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
        {/* Left Container - Materials Table */}
        <div style={{ flex: 1 }}>
          {materials.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: '#fff',
              borderRadius: '8px',
              border: '1px solid rgba(7, 20, 41, 0.1)'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  background: '#f3f4f6', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <Plus size={24} color="#6b7280" />
                </div>
                <h3 style={{ margin: '0 0 8px', color: '#374151' }}>No materials added yet</h3>
                <p style={{ margin: '0 0 24px', color: '#6b7280' }}>
                  Add materials to this sales order to get started
                </p>
              </div>
              <Button 
                type="primary" 
                icon={<Plus size={16} />}
                onClick={addMaterial}
                style={{ background: '#3b82f6', border: 'none' }}
              >
                Add Material
              </Button>
            </div>
          ) : (
            <div style={{ 
              background: '#fff',
              borderRadius: '8px',
              border: '1px solid rgba(7, 20, 41, 0.1)',
              overflow: 'hidden'
            }}>
              <Table
                columns={columns}
                dataSource={materials}
                pagination={false}
                size="small"
                summary={() => (
                  materials.length > 0 ? (
                    <Table.Summary.Row style={{ 
                      backgroundColor: '#F9FAFB',
                      borderTop: '1px solid #e5e7eb',
                      fontWeight: '600'
                    }}>
                      <Table.Summary.Cell index={0}>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>
                          {materials.length} Materials
                        </div>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <div style={{ textAlign: 'right', fontWeight: '600', color: '#1f2937' }}>
                        </div>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>
                        <div style={{ textAlign: 'right', fontWeight: '600', color: '#1f2937' }}>
                        </div>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <div style={{ textAlign: 'right', fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                          {totalWeightInPounds.toLocaleString()} lb
                          {totalEachCount > 0 && (
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', fontWeight: '500' }}>
                              {totalEachCount.toLocaleString()} ea
                            </div>
                          )}
                        </div>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>
                        <div style={{ textAlign: 'right', fontWeight: '600', color: '#1f2937' }}>
                          ${totalEstimatedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5}>
                        <div style={{ textAlign: 'right', fontWeight: '600', color: '#1f2937' }}>
                        </div>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  ) : null
                )}
              />
              
              {/* Add Material Button */}
              <div style={{ 
                padding: '16px', 
                display: 'flex', 
                justifyContent: 'flex-start' 
              }}>
                <Button 
                  type="default"
                  icon={<Plus size={16} />}
                  onClick={addMaterial}
                  style={{ 
                    height: '40px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    color: '#374151',
                    fontWeight: '500'
                  }}
                >
                  Add Material
                </Button>
              </div>
            </div>
          )}

          {/* Fixed Save/Discard Buttons */}
          {materials.length > 0 && hasChanges && (
            <div style={{ 
              position: 'fixed',
              bottom: 0,
              left: 0, // Start from viewport edge
              right: 0,
              zIndex: 1000,
              display: 'flex', 
              justifyContent: 'flex-end', 
              alignItems: 'center',
              gap: '12px', 
              padding: '16px 24px 16px 0',
              background: '#fff',
              borderTop: '1px solid #e5e7eb'
            }}>
              <Button 
                onClick={handleDiscard} 
                type="default"
                style={{
                  height: '40px',
                  padding: '0 20px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  color: '#374151',
                  fontWeight: '500'
                }}
              >
                Discard
              </Button>
              <Button 
                onClick={handleSave} 
                type="primary" 
                className="save-updates-button"
                data-testid="save-materials-btn"
                style={{ 
                  height: '40px',
                  padding: '0 20px',
                  borderRadius: '6px',
                  background: '#3b82f6', 
                  border: 'none',
                  fontWeight: '500'
                }}
              >
                Save updates
              </Button>
            </div>
          )}
        </div>

        {/* Right Container - Available Inventory */}
        {materials.length > 0 && showAvailableInventory && (
          <div style={{ width: '280px' }}>
            <div style={{ 
              background: '#fff',
              borderRadius: '8px',
              border: '1px solid rgba(7, 20, 41, 0.1)',
              padding: '16px'
            }}>
              <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                Available at {facilityName}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {materials.map((material, index) => {
                  const availableMaterial = availableMaterials.find(am => am.name === material.contractMaterial)
                  if (!availableMaterial) return null
                  
                  return (
                    <div key={index}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '6px 0'
                      }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                          {material.contractMaterial}
                        </span>
                        <button
                          onClick={() => toggleMaterialExpansion(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            color: '#6b7280'
                          }}
                        >
                          {expandedMaterials.has(index) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </div>
                      
                      {expandedMaterials.has(index) && (
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '12px',
                          paddingBottom: '6px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                            <span>Loose:</span>
                            <span>{availableMaterial.details.loose.toLocaleString()} {availableMaterial.unit}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                            <span>Tagged:</span>
                            <span>{(availableMaterial.details.tagged.wip + availableMaterial.details.tagged.fg).toLocaleString()} {availableMaterial.unit}</span>
                          </div>
                          <div style={{ marginLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
                              <span>• WIP:</span>
                              <span>{availableMaterial.details.tagged.wip.toLocaleString()} {availableMaterial.unit}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
                              <span>• FG:</span>
                              <span>{availableMaterial.details.tagged.fg.toLocaleString()} {availableMaterial.unit}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Divider line between materials */}
                      {index < materials.length - 1 && (
                        <div style={{ 
                          height: '1px', 
                          background: '#e5e7eb', 
                          margin: '0'
                        }}></div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MaterialsTab