import { Button, Input, Select, DatePicker, Checkbox, Tag, Dropdown, Tabs, Table } from 'antd'
import { useLocation, useRoute } from 'wouter'
import { ArrowLeft, Calendar, ChevronDown, MoreHorizontal, Copy, Plus, Printer, Download, RotateCcw, CheckCircle, Trash2, MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { generateSOData } from '../../utils/mockData'
import MaterialsTab from '../../components/MaterialsTab'
import { initializeFormbricks, triggerSurvey, SO_FEEDBACK_SURVEY_ID, resetUserForSurvey } from '../../utils/formbricks'

const { Option } = Select

export const SalesOrderDetail = () => {
  const [, setLocation] = useLocation()
  const [, params] = useRoute('/sales-order/:id')
  
  const [formData, setFormData] = useState({
    facility: '',
    startDate: '',
    endDate: '',
    accountRep: '',
    counterpartPO: '',
    customerName: '',
    contact: '',
    shipToLocation: '',
    billToLocation: '',
    sameAsShip: true,
    paymentCurrency: '',
    paymentTerm: '',
    freightTerm: '',
    doNotShip: false
  })

  const [soData, setSoData] = useState<any>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalFormData, setOriginalFormData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('contract')
  const [materialsCount, setMaterialsCount] = useState(0)
  const [savedMaterials, setSavedMaterials] = useState<any[]>([])
  const [loadsCount, setLoadsCount] = useState(0)
  
  // Initialize Formbricks
  useEffect(() => {
    console.log('🔄 useEffect: About to initialize Formbricks')
    initializeFormbricks()
  }, [])

  // Load SO data based on the ID from the URL
  useEffect(() => {
    if (params?.id) {
      // Check for stored form data first (for new SOs)
      const formDataKey = `so-form-data-${params.id}`
      const storedFormData = localStorage.getItem(formDataKey)
      
      let data
      if (storedFormData) {
        try {
          const formValues = JSON.parse(storedFormData)
          console.log('Loaded stored form data for new SO:', params.id, formValues)
          // Create SO data from form values
          data = {
            soNumber: formValues.salesOrderNumber,
            facility: formValues.facility,
            startDate: formValues.startDate,
            endDate: formValues.endDate,
            accountRep: formValues.accountRep,
            counterpartPO: formValues.counterpartPO,
            customerName: formValues.customerName,
            contact: formValues.contact,
            shipToLocation: formValues.shipToLocation,
            billToLocation: formValues.billToLocation,
            sameAsShip: formValues.sameAsShip,
            paymentCurrency: formValues.paymentCurrency,
            paymentTerm: formValues.paymentTerm,
            freightTerm: formValues.freightTerm,
            doNotShip: formValues.doNotShip,
            status: 'Draft', // New SOs start as Draft
            fulfillment: 0, // New SOs start with 0% fulfillment
            materials: [] // New SOs start with no materials
          }
        } catch (error) {
          console.error('Error parsing stored form data:', error)
          data = generateSOData(params.id)
        }
      } else {
        data = generateSOData(params.id)
        console.log('Generated data for existing SO:', params.id, data)
      }
      
      // Check for saved materials in localStorage
      const savedMaterialsKey = `so-materials-${params.id}`
      const savedMaterialsFromStorage = localStorage.getItem(savedMaterialsKey)
      let materialsToUse = []
      
      if (savedMaterialsFromStorage) {
        try {
          materialsToUse = JSON.parse(savedMaterialsFromStorage)
          console.log('Loaded saved materials from localStorage:', materialsToUse)
        } catch (error) {
          console.error('Error parsing saved materials:', error)
          materialsToUse = []
        }
      } else {
        // If no saved materials in localStorage, check if this is a new SO or existing SO
        if (storedFormData) {
          // This is a new SO created via modal - start with empty materials
          materialsToUse = []
          console.log('New SO detected, starting with empty materials')
        } else {
          // This is an existing SO clicked from table - use materials from generated data
          materialsToUse = data.materials || []
          console.log('Existing SO detected, using materials from generated data:', materialsToUse)
        }
      }
      
      // Update data with saved materials (empty for new SOs)
      const dataWithSavedMaterials = { ...data, materials: materialsToUse }
      setSoData(dataWithSavedMaterials)
      
      const initialFormData = {
        facility: data.facility,
        startDate: data.startDate,
        endDate: data.endDate,
        accountRep: data.accountRep,
        counterpartPO: data.counterpartPO,
        customerName: data.customerName,
        contact: data.contact,
        shipToLocation: data.shipToLocation,
        billToLocation: data.billToLocation,
        sameAsShip: data.sameAsShip,
        paymentCurrency: data.paymentCurrency,
        paymentTerm: data.paymentTerm,
        freightTerm: data.freightTerm,
        doNotShip: data.doNotShip
      }
      setFormData(initialFormData)
      setOriginalFormData(initialFormData)
      setHasChanges(false)
      
      // Set materials from SO data
      if (materialsToUse) {
        setSavedMaterials(materialsToUse)
        setMaterialsCount(materialsToUse.length)
      }
      
      // Set loads count (mock data for now)
      setLoadsCount(4)
    }
  }, [params?.id])

  // Determine if editing is allowed based on status
  const status = soData?.status || 'Open'
  const canEdit = ['Draft', 'Open', 'Shipped'].includes(status)
  const isReadOnly = !canEdit

  console.log('SalesOrderDetail component is rendering!')
  console.log('Current location:', window.location.pathname)
  console.log('SO ID:', params?.id)
  console.log('SO Data:', soData)
  console.log('Status:', status, 'Can edit:', canEdit)

  // Show loading state if SO data is not loaded yet
  if (!soData && params?.id) {
    return (
      <div style={{ padding: '24px', background: '#F8F8F9', minHeight: '100vh' }}>
        <div style={{ 
          background: '#3b82f6', 
          color: '#fff', 
          padding: '8px 16px', 
          borderRadius: '4px', 
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Loading Sales Order #{params.id}...
        </div>
      </div>
    )
  }

  const handleBack = () => {
    setLocation('/sales-orders')
  }

  const handleSave = () => {
    console.log('Saving form data:', formData)
    // Here you would typically make an API call to save the data
    setOriginalFormData({ ...formData })
    setHasChanges(false)
  }

  const handleSaveMaterials = (materials: any[]) => {
    console.log('Saving materials to SO data:', materials)
    setSavedMaterials(materials)
    // Update the SO data with the new materials
    if (soData) {
      setSoData({ ...soData, materials })
    }
    // Store in localStorage for persistence across navigation
    localStorage.setItem(`so-materials-${params?.id}`, JSON.stringify(materials))
  }

  const handleDiscard = () => {
    if (originalFormData) {
      setFormData({ ...originalFormData })
      setHasChanges(false)
    }
  }

  // Generate status-specific action buttons
  const getStatusActions = (status: string) => {
    const baseActions = [
      {
        key: 'clone',
        label: 'Clone Sales Order',
        icon: <Copy size={16} />,
        onClick: () => console.log('Clone Sales Order')
      },
      {
        key: 'createLoad',
        label: 'Create Pending Load',
        icon: <Plus size={16} />,
        onClick: () => console.log('Create Pending Load')
      },
      {
        key: 'printSO',
        label: 'Print Sales Order',
        icon: <Printer size={16} />,
        onClick: () => console.log('Print Sales Order')
      },
      {
        key: 'downloadShipping',
        label: 'Download Shipping Summary',
        icon: <Download size={16} />,
        onClick: () => console.log('Download Shipping Summary')
      },
      {
        key: 'markOpen',
        label: 'Mark as Open',
        icon: <RotateCcw size={16} />,
        onClick: () => console.log('Mark as Open')
      },
      {
        key: 'markShipped',
        label: 'Mark as Shipped',
        icon: <CheckCircle size={16} />,
        onClick: () => console.log('Mark as Shipped')
      },
      {
        key: 'closeSO',
        label: 'Close Sales Order',
        icon: <CheckCircle size={16} />,
        onClick: () => console.log('Close Sales Order')
      },
      {
        key: 'revertOpen',
        label: 'Revert to Open',
        icon: <RotateCcw size={16} />,
        onClick: () => console.log('Revert to Open')
      },
      {
        key: 'void',
        label: 'Void',
        icon: <Trash2 size={16} />,
        onClick: () => console.log('Void'),
        danger: true
      }
    ]

    switch (status) {
      case 'Draft':
        return {
          primaryActions: [
            <Button 
              key="feedback" 
              type="default" 
              className="so-give-feedback-button"
              icon={<MessageCircle size={16} />}
              onClick={handleGiveFeedback}
            >
              Give Feedback
            </Button>,
            <Button key="void" danger type="default" onClick={() => console.log('Void')}>
              Void
            </Button>
          ],
          moreActions: []
        }
      
      case 'Open':
        return {
          primaryActions: [
            <Button 
              key="feedback" 
              type="default" 
              className="so-give-feedback-button"
              icon={<MessageCircle size={16} />}
              onClick={handleGiveFeedback}
            >
              Give Feedback
            </Button>,
            <Button key="void" danger type="default" onClick={() => console.log('Void')}>
              Void
            </Button>,
            <Button key="finish" type="primary" onClick={() => console.log('Close SO')}>
              Close SO
            </Button>
          ],
          moreActions: [
            baseActions.find(item => item.key === 'clone')!,
            baseActions.find(item => item.key === 'createLoad')!,
            baseActions.find(item => item.key === 'printSO')!,
            baseActions.find(item => item.key === 'downloadShipping')!,
            baseActions.find(item => item.key === 'markShipped')!
          ]
        }
      
      case 'Shipped':
        return {
          primaryActions: [
            <Button 
              key="feedback" 
              type="default" 
              className="so-give-feedback-button"
              icon={<MessageCircle size={16} />}
              onClick={handleGiveFeedback}
            >
              Give Feedback
            </Button>,
            <Button key="void" danger type="default" onClick={() => console.log('Void')}>
              Void
            </Button>,
            <Button key="finish" type="primary" onClick={() => console.log('Close SO')}>
              Close SO
            </Button>
          ],
          moreActions: [
            baseActions.find(item => item.key === 'clone')!,
            baseActions.find(item => item.key === 'createLoad')!,
            baseActions.find(item => item.key === 'printSO')!,
            baseActions.find(item => item.key === 'downloadShipping')!,
            baseActions.find(item => item.key === 'markOpen')!
          ]
        }
      
      case 'Closed':
        return {
          primaryActions: [
            <Button 
              key="feedback" 
              type="default" 
              className="so-give-feedback-button"
              icon={<MessageCircle size={16} />}
              onClick={handleGiveFeedback}
            >
              Give Feedback
            </Button>,
            <Button key="revert" type="default" onClick={() => console.log('Revert to Open')}>
              Revert to Open
            </Button>
          ],
          moreActions: [
            baseActions.find(item => item.key === 'clone')!,
            baseActions.find(item => item.key === 'printSO')!,
            baseActions.find(item => item.key === 'downloadShipping')!
          ]
        }
      
      case 'Voided':
        return {
          primaryActions: [
            <Button 
              key="feedback" 
              type="default" 
              className="so-give-feedback-button"
              icon={<MessageCircle size={16} />}
              onClick={handleGiveFeedback}
            >
              Give Feedback
            </Button>,
            <Button key="revert" type="default" onClick={() => console.log('Revert to Open')}>
              Revert to Open
            </Button>
          ],
          moreActions: [
            baseActions.find(item => item.key === 'printSO')!,
            baseActions.find(item => item.key === 'downloadShipping')!
          ]
        }
      
      default:
        return {
          primaryActions: [],
          moreActions: []
        }
    }
  }


  const handleGiveFeedback = async () => {
    console.log('🔄 Give Feedback button clicked!')
    try {
      await triggerSurvey(SO_FEEDBACK_SURVEY_ID)
      console.log('✅ Give Feedback clicked - survey triggered')
    } catch (error) {
      console.log('❌ Failed to trigger survey:', error)
    }
  }

  const handleResetUser = async () => {
    console.log('🔄 Resetting user to see survey again...')
    try {
      await resetUserForSurvey()
      console.log('✅ User reset complete - survey will show again')
    } catch (error) {
      console.log('❌ Failed to reset user:', error)
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Handle "Same as ship" dependency
      if (field === 'shipToLocation' && newData.sameAsShip) {
        newData.billToLocation = value
      }
      
      // Check if there are changes
      const hasFormChanges = JSON.stringify(newData) !== JSON.stringify(originalFormData)
      setHasChanges(hasFormChanges)
      
      return newData
    })
  }

  const handleSameAsShipChange = (checked: boolean) => {
    setFormData(prev => {
      const newData = { ...prev, sameAsShip: checked }
      
      if (checked) {
        // Copy ship to location to bill to location
        newData.billToLocation = prev.shipToLocation
      }
      
      // Check if there are changes
      const hasFormChanges = JSON.stringify(newData) !== JSON.stringify(originalFormData)
      setHasChanges(hasFormChanges)
      
      return newData
    })
  }

  // Loads table columns
  const loadsColumns = [
    {
      title: 'Load #',
      dataIndex: 'loadNumber',
      key: 'loadNumber',
      width: 120,
      render: (text: string) => (
        <span style={{ fontWeight: '500', color: '#1f2937' }}>{text}</span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const statusColors: { [key: string]: string } = {
          'Pending': 'default',
          'In Transit': 'processing',
          'Delivered': 'success',
          'Cancelled': 'error'
        }
        return <Tag color={statusColors[status] || 'default'}>{status}</Tag>
      }
    },
    {
      title: 'Carrier',
      dataIndex: 'carrier',
      key: 'carrier',
      width: 150
    },
    {
      title: 'Truck #',
      dataIndex: 'truckNumber',
      key: 'truckNumber',
      width: 120
    },
    {
      title: 'Driver',
      dataIndex: 'driver',
      key: 'driver',
      width: 150
    },
    {
      title: 'Pickup Date',
      dataIndex: 'pickupDate',
      key: 'pickupDate',
      width: 120
    },
    {
      title: 'Delivery Date',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      width: 120
    },
    {
      title: 'Weight (lbs)',
      dataIndex: 'weight',
      key: 'weight',
      width: 120,
      align: 'right' as const,
      render: (weight: number) => weight.toLocaleString()
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: () => (
        <Dropdown
          menu={{
            items: [
              { key: 'edit', label: 'Edit', icon: <Plus size={14} /> },
              { key: 'track', label: 'Track', icon: <Plus size={14} /> },
              { key: 'print', label: 'Print', icon: <Printer size={14} /> },
              { key: 'cancel', label: 'Cancel', icon: <Trash2 size={14} />, danger: true }
            ]
          }}
          trigger={['click']}
        >
          <Button 
            type="text" 
            icon={<MoreHorizontal size={16} />}
            style={{ color: '#6b7280' }}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      )
    }
  ]

  // Mock loads data
  const loadsData = [
    {
      key: '1',
      loadNumber: 'L001',
      status: 'Pending',
      carrier: 'ABC Transport',
      truckNumber: 'TRK-001',
      driver: 'John Smith',
      pickupDate: '2024-01-15',
      deliveryDate: '2024-01-16',
      weight: 25000
    },
    {
      key: '2',
      loadNumber: 'L002',
      status: 'In Transit',
      carrier: 'XYZ Logistics',
      truckNumber: 'TRK-002',
      driver: 'Mike Johnson',
      pickupDate: '2024-01-14',
      deliveryDate: '2024-01-17',
      weight: 30000
    },
    {
      key: '3',
      loadNumber: 'L003',
      status: 'Delivered',
      carrier: 'Fast Freight',
      truckNumber: 'TRK-003',
      driver: 'Sarah Wilson',
      pickupDate: '2024-01-12',
      deliveryDate: '2024-01-13',
      weight: 28000
    },
    {
      key: '4',
      loadNumber: 'L004',
      status: 'Cancelled',
      carrier: 'Reliable Haulers',
      truckNumber: 'TRK-004',
      driver: 'Tom Brown',
      pickupDate: '2024-01-10',
      deliveryDate: '2024-01-11',
      weight: 22000
    }
  ]

  return (
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
                onClick={handleBack}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                    Sales Order #{soData?.soNumber || params?.id || 'Loading...'}
                  </h1>
                  <Tag
                    style={{
                      backgroundColor: status === 'Open' ? '#dbeafe' : 
                                     status === 'Closed' ? '#dcfce7' : 
                                     status === 'Shipped' ? '#fed7aa' : 
                                     status === 'Draft' ? '#f3f4f6' : '#fecaca',
                      color: status === 'Open' ? '#1d4ed8' : 
                             status === 'Closed' ? '#16a34a' : 
                             status === 'Shipped' ? '#ea580c' : 
                             status === 'Draft' ? '#6b7280' : '#dc2626',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    {status}
                  </Tag>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>
                    Created on {soData?.startDate ? new Date(soData.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Loading...'} by {soData?.accountRep || 'Loading...'}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {(() => {
                const actions = getStatusActions(status)
                return (
                  <>
                    {actions.primaryActions}
                    {actions.moreActions.length > 0 && (
                      <Dropdown
                        menu={{ 
                          items: actions.moreActions,
                          style: { borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }
                        }}
                        trigger={['click']}
                        placement="bottomRight"
                      >
                        <Button icon={<MoreHorizontal size={16} />} />
                      </Dropdown>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'contract',
              label: 'Contract Info',
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
              key: 'customer',
              label: 'Customer',
            },
            {
              key: 'loads',
              label: (
                <span>
                  Loads <Tag style={{ marginLeft: '8px', fontSize: '10px' }}>{loadsCount}</Tag>
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


      {/* Main Content Section */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '8px', 
        padding: '24px', 
        marginBottom: '10px',
        border: '1px solid #e5e7eb'
      }}>
        {activeTab === 'contract' && (
          <>
            {/* Contract Info Section */}
            <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
              Contract Info
            </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Sales Order #
            </label>
            <div style={{ 
              padding: '8px 12px', 
              background: '#f0f0f0', 
              border: '1px solid #d1d5db', 
              borderRadius: '6px',
              color: '#374151'
            }}>
              #{soData?.soNumber || params?.id || 'Loading...'}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Facility
            </label>
            {isReadOnly ? (
              <div style={{ 
                padding: '8px 12px', 
                background: '#fff', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                color: '#374151'
              }}>
                {formData.facility}
              </div>
            ) : (
              <Select
                value={formData.facility}
                onChange={(value) => handleFieldChange('facility', value)}
                style={{ width: '100%' }}
                suffixIcon={<ChevronDown size={16} />}
              >
                <Option value="ReMatter Headquarters">ReMatter Headquarters</Option>
                <Option value="ReMatter Ohio">ReMatter Ohio</Option>
                <Option value="ReMatter San Diego">ReMatter San Diego</Option>
                <Option value="ReMatter Los Angeles">ReMatter Los Angeles</Option>
                <Option value="ReMatter Texas">ReMatter Texas</Option>
                <Option value="ReMatter Newport Beach">ReMatter Newport Beach</Option>
                <Option value="ReMatter SantaMonica">ReMatter SantaMonica</Option>
                <Option value="ReMatter Lake Tahoe">ReMatter Lake Tahoe</Option>
                <Option value="ReMatter Denver">ReMatter Denver</Option>
              </Select>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Sales Order Start Date
            </label>
            {isReadOnly ? (
              <div style={{ 
                padding: '8px 12px', 
                background: '#fff', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                color: '#374151'
              }}>
                {formData.startDate}
              </div>
            ) : (
              <DatePicker
                value={formData.startDate ? dayjs(formData.startDate) : null}
                onChange={(date) => handleFieldChange('startDate', date?.format('YYYY-MM-DD'))}
                style={{ width: '100%' }}
                suffixIcon={<Calendar size={16} />}
              />
            )}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Sales Order End Date
            </label>
            {isReadOnly ? (
              <div style={{ 
                padding: '8px 12px', 
                background: '#fff', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                color: '#374151'
              }}>
                {formData.endDate}
              </div>
            ) : (
              <DatePicker
                value={formData.endDate ? dayjs(formData.endDate) : null}
                onChange={(date) => handleFieldChange('endDate', date?.format('YYYY-MM-DD'))}
                style={{ width: '100%' }}
                suffixIcon={<Calendar size={16} />}
              />
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Account Representative
            </label>
            {isReadOnly ? (
              <div style={{ 
                padding: '8px 12px', 
                background: '#fff', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                color: '#374151'
              }}>
                {formData.accountRep}
              </div>
            ) : (
              <Select
                value={formData.accountRep}
                onChange={(value) => handleFieldChange('accountRep', value)}
                style={{ width: '100%' }}
                suffixIcon={<ChevronDown size={16} />}
              >
                <Option value="Tyler Anderson">Tyler Anderson</Option>
                <Option value="Matthew Brown">Matthew Brown</Option>
                <Option value="Sarah Wilson">Sarah Wilson</Option>
                <Option value="David Lee">David Lee</Option>
                <Option value="Lisa Garcia">Lisa Garcia</Option>
                <Option value="Robert Johnson">Robert Johnson</Option>
                <Option value="Jennifer Davis">Jennifer Davis</Option>
                <Option value="Michael Wilson">Michael Wilson</Option>
                <Option value="Christopher Martinez">Christopher Martinez</Option>
                <Option value="Amanda Taylor">Amanda Taylor</Option>
              </Select>
            )}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Counterparty Purchase Order #
            </label>
            {isReadOnly ? (
              <div style={{ 
                padding: '8px 12px', 
                background: '#fff', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                color: '#374151'
              }}>
                {formData.counterpartPO}
              </div>
            ) : (
              <Input
                value={formData.counterpartPO}
                onChange={(e) => handleFieldChange('counterpartPO', e.target.value)}
                placeholder="Enter PO number"
              />
            )}
          </div>
        </div>
        

                {/* Divider */}
                <div style={{ 
                  height: '1px', 
                  background: 'rgba(7, 20, 41, 0.1)', 
                  margin: '12px 0' 
                }}></div>

        {/* Customer Information Section */}
        <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
          Customer Information
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Customer Name
            </label>
            {isReadOnly ? (
              <div style={{ 
                padding: '8px 12px', 
                background: '#fff', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                color: '#374151'
              }}>
                {formData.customerName}
              </div>
            ) : (
              <Select
                value={formData.customerName}
                onChange={(value) => handleFieldChange('customerName', value)}
                style={{ width: '100%' }}
                suffixIcon={<ChevronDown size={16} />}
              >
                <Option value="RecycleHub Yard">RecycleHub Yard</Option>
                <Option value="GreenStream Scrap">GreenStream Scrap</Option>
                <Option value="EcoMetal Solutions">EcoMetal Solutions</Option>
                <Option value="MetalWorks Inc">MetalWorks Inc</Option>
                <Option value="ScrapKing Corp">ScrapKing Corp</Option>
                <Option value="Metro Scrap & Metal Co.">Metro Scrap & Metal Co.</Option>
                <Option value="Industrial Recycling Solutions">Industrial Recycling Solutions</Option>
                <Option value="Premier Scrap Metals">Premier Scrap Metals</Option>
                <Option value="Advanced Metal Recovery">Advanced Metal Recovery</Option>
                <Option value="EcoScrap Industries">EcoScrap Industries</Option>
              </Select>
            )}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Contact
            </label>
            {isReadOnly ? (
              <div style={{ 
                padding: '8px 12px', 
                background: '#fff', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                color: '#374151'
              }}>
                {formData.contact}
              </div>
            ) : (
              <Select
                value={formData.contact}
                onChange={(value) => handleFieldChange('contact', value)}
                style={{ width: '100%' }}
                suffixIcon={<ChevronDown size={16} />}
              >
                <Option value="No Contact">No Contact</Option>
                <Option value="John Smith">John Smith</Option>
                <Option value="Jane Doe">Jane Doe</Option>
                <Option value="Mike Johnson">Mike Johnson</Option>
              </Select>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Ship to Location
            </label>
            {isReadOnly ? (
              <div style={{ 
                padding: '8px 12px', 
                background: '#fff', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                color: '#374151'
              }}>
                {formData.shipToLocation}
              </div>
            ) : (
              <Select
                value={formData.shipToLocation}
                onChange={(value) => {
                  handleFieldChange('shipToLocation', value)
                  // If "Same as ship" is checked, update bill to location
                  if (formData.sameAsShip) {
                    handleFieldChange('billToLocation', value)
                  }
                }}
                style={{ width: '100%' }}
                suffixIcon={<ChevronDown size={16} />}
              >
                <Option value="RecycleHub Yard - 123 Main St, Chicago, IL 60601">RecycleHub Yard - 123 Main St, Chicago, IL 60601</Option>
                <Option value="GreenStream Scrap - 456 Oak Ave, Houston, TX 77001">GreenStream Scrap - 456 Oak Ave, Houston, TX 77001</Option>
                <Option value="EcoMetal Solutions - 789 Pine Rd, Phoenix, AZ 85001">EcoMetal Solutions - 789 Pine Rd, Phoenix, AZ 85001</Option>
                <Option value="MetalWorks Inc - 321 Elm St, Philadelphia, PA 19101">MetalWorks Inc - 321 Elm St, Philadelphia, PA 19101</Option>
                <Option value="ScrapKing Corp - 654 Maple Dr, San Antonio, TX 78201">ScrapKing Corp - 654 Maple Dr, San Antonio, TX 78201</Option>
                <Option value="Metro Scrap & Metal Co. - 1234 Industrial Blvd, Los Angeles, CA 90021">Metro Scrap & Metal Co. - 1234 Industrial Blvd, Los Angeles, CA 90021</Option>
                <Option value="Industrial Recycling Solutions - 987 Cedar Ln, San Diego, CA 92101">Industrial Recycling Solutions - 987 Cedar Ln, San Diego, CA 92101</Option>
                <Option value="Premier Scrap Metals - 147 Birch St, Dallas, TX 75201">Premier Scrap Metals - 147 Birch St, Dallas, TX 75201</Option>
                <Option value="Advanced Metal Recovery - 258 Spruce Ave, San Jose, CA 95101">Advanced Metal Recovery - 258 Spruce Ave, San Jose, CA 95101</Option>
                <Option value="EcoScrap Industries - 369 Willow Way, Austin, TX 78701">EcoScrap Industries - 369 Willow Way, Austin, TX 78701</Option>
              </Select>
            )}
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Bill to Location
              </label>
              <Checkbox
                checked={formData.sameAsShip}
                onChange={(e) => handleSameAsShipChange(e.target.checked)}
                disabled={isReadOnly}
                style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}
              >
                Same as ship
              </Checkbox>
            </div>
            {isReadOnly ? (
              <div style={{ 
                padding: '8px 12px', 
                background: '#f0f0f0', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                color: '#374151'
              }}>
                {formData.billToLocation}
              </div>
            ) : (
              <Select
                value={formData.billToLocation}
                onChange={(value) => handleFieldChange('billToLocation', value)}
                style={{ width: '100%' }}
                suffixIcon={<ChevronDown size={16} />}
                disabled={formData.sameAsShip}
              >
                <Option value="RecycleHub Yard - 123 Main St, Chicago, IL 60601">RecycleHub Yard - 123 Main St, Chicago, IL 60601</Option>
                <Option value="GreenStream Scrap - 456 Oak Ave, Houston, TX 77001">GreenStream Scrap - 456 Oak Ave, Houston, TX 77001</Option>
                <Option value="EcoMetal Solutions - 789 Pine Rd, Phoenix, AZ 85001">EcoMetal Solutions - 789 Pine Rd, Phoenix, AZ 85001</Option>
                <Option value="MetalWorks Inc - 321 Elm St, Philadelphia, PA 19101">MetalWorks Inc - 321 Elm St, Philadelphia, PA 19101</Option>
                <Option value="ScrapKing Corp - 654 Maple Dr, San Antonio, TX 78201">ScrapKing Corp - 654 Maple Dr, San Antonio, TX 78201</Option>
                <Option value="Metro Scrap & Metal Co. - 1234 Industrial Blvd, Los Angeles, CA 90021">Metro Scrap & Metal Co. - 1234 Industrial Blvd, Los Angeles, CA 90021</Option>
                <Option value="Industrial Recycling Solutions - 987 Cedar Ln, San Diego, CA 92101">Industrial Recycling Solutions - 987 Cedar Ln, San Diego, CA 92101</Option>
                <Option value="Premier Scrap Metals - 147 Birch St, Dallas, TX 75201">Premier Scrap Metals - 147 Birch St, Dallas, TX 75201</Option>
                <Option value="Advanced Metal Recovery - 258 Spruce Ave, San Jose, CA 95101">Advanced Metal Recovery - 258 Spruce Ave, San Jose, CA 95101</Option>
                <Option value="EcoScrap Industries - 369 Willow Way, Austin, TX 78701">EcoScrap Industries - 369 Willow Way, Austin, TX 78701</Option>
              </Select>
            )}
          </div>
        </div>

                {/* Divider */}
                <div style={{ 
                  height: '1px', 
                  background: 'rgba(7, 20, 41, 0.1)', 
                  margin: '12px 0' 
                }}></div>

        {/* Payment Info Section */}
        <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
          Payment Info
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Payment Currency
            </label>
            {isReadOnly ? (
              <div style={{ 
                padding: '8px 12px', 
                background: '#fff', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                color: '#374151'
              }}>
                {formData.paymentCurrency}
              </div>
            ) : (
              <Select
                value={formData.paymentCurrency}
                onChange={(value) => handleFieldChange('paymentCurrency', value)}
                style={{ width: '100%' }}
                suffixIcon={<ChevronDown size={16} />}
              >
                <Option value="USD - United States Dollar">USD - United States Dollar</Option>
                <Option value="EUR - Euro">EUR - Euro</Option>
                <Option value="GBP - British Pound">GBP - British Pound</Option>
                <Option value="CAD - Canadian Dollar">CAD - Canadian Dollar</Option>
                <Option value="AUD - Australian Dollar">AUD - Australian Dollar</Option>
              </Select>
            )}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Payment Term
            </label>
            {isReadOnly ? (
              <div style={{ 
                padding: '8px 12px', 
                background: '#fff', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                color: '#374151'
              }}>
                {formData.paymentTerm}
              </div>
            ) : (
              <Select
                value={formData.paymentTerm}
                onChange={(value) => handleFieldChange('paymentTerm', value)}
                style={{ width: '100%' }}
                suffixIcon={<ChevronDown size={16} />}
              >
                <Option value="No Contact">No Contact</Option>
                <Option value="Net 30">Net 30</Option>
                <Option value="Net 60">Net 60</Option>
                <Option value="Net 90">Net 90</Option>
                <Option value="Cash on Delivery">Cash on Delivery</Option>
              </Select>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Freight Term
            </label>
            {isReadOnly ? (
              <div style={{ 
                padding: '8px 12px', 
                background: '#fff', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                color: '#374151'
              }}>
                {formData.freightTerm}
              </div>
            ) : (
              <Select
                value={formData.freightTerm}
                onChange={(value) => handleFieldChange('freightTerm', value)}
                style={{ width: '100%' }}
                suffixIcon={<ChevronDown size={16} />}
              >
                <Option value="No Contact">No Contact</Option>
                <Option value="FOB Origin">FOB Origin</Option>
                <Option value="FOB Destination">FOB Destination</Option>
                <Option value="CIF">CIF</Option>
                <Option value="EXW">EXW</Option>
              </Select>
            )}
          </div>
          <div></div>
        </div>

                {/* Divider */}
                <div style={{ 
                  height: '1px', 
                  background: 'rgba(7, 20, 41, 0.1)', 
                  margin: '12px 0' 
                }}></div>

        {/* Other Info Section */}
        <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
          Other Info
        </h3>
        
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            Files
          </label>
          <div style={{ 
            border: '1px dashed #d1d5db', 
            borderRadius: '6px', 
            padding: '24px', 
            textAlign: 'center', 
            color: '#6b7280',
            background: '#f9fafb'
          }}>
            Click here or drag file to this area to upload
          </div>
        </div>
          </>
        )}

        {activeTab === 'materials' && (
          <MaterialsTab 
            onMaterialsChange={setMaterialsCount}
            savedMaterials={savedMaterials}
            onSaveMaterials={handleSaveMaterials}
            facilityName={soData?.facility || 'ReMatter Headquarters'}
          />
        )}

        {activeTab === 'customer' && (
          <div style={{ 
            background: '#fff',
            borderRadius: '8px',
            border: '1px solid rgba(7, 20, 41, 0.1)',
            padding: '24px'
          }}>
            {/* Profile Section */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                Profile
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Company Type
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    Supplier • Customer
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Company Name
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    Metals Inc
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Account Manager
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    Steve James
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Payee Name
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    Craig Tuoa
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Custom Company ID
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    UH001SYYD90D
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Business License Number
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    CA-9823894-12
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Attributes Section */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                Custom Attributes
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Business Type
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    Dealer
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Credit Limit
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    —
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Donate
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    Yes
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Donation Organisation
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    Green Red
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Hours
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    12
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Local
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    Yes
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Number of Employees
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    28
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Start Date
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    Sep 10, 2021
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div style={{ marginBottom: '24px', padding: '0 20px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                Contact
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Owner */}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Owner
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      background: '#3b82f6', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      KT
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                      Katherine Tomera
                    </span>
                  </div>
                  <div style={{ marginLeft: '44px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>+1 (913) 890-1234</span>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                        📋
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>tomera.kat@gmail.com</span>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                        📋
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Dispatcher */}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Dispatcher
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      background: '#10b981', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      OS
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                      Oliver Smith
                    </span>
                  </div>
                  <div style={{ marginLeft: '44px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>+1 (415) 345-6789</span>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                        📋
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>oliver.smith@gmail.com</span>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                        📋
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Preferences Section */}
            <div style={{ marginBottom: '24px', padding: '0 20px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                Pricing Preferences
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Price List Group
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    —
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Inbound Tax Rate
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    None
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Outbound Tax Rate
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    Sales Tax - 7.00%
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Preferences Section */}
            <div style={{ marginBottom: '24px', padding: '0 20px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                Payment Preferences
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Default Payment Type
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    ACH
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Default Payment Schedule
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    EOM
                  </div>
                </div>
              </div>
            </div>

            {/* Supplier Notes Section */}
            <div style={{ marginBottom: '24px', padding: '0 20px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                Supplier Notes
              </h3>
              
              <div style={{ 
                padding: '16px', 
                background: '#f8f9fa', 
                border: '1px solid #e5e7eb', 
                borderRadius: '6px',
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#374151'
              }}>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>PER DANIEL SPLIT OUT 1X40' TO NEW BOOKING ON SAME VESSEL --ON 5/7 JX</strong> This booking is for single transshipment.
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>**HECS1000011- Dry cargo bookings:</strong> Please check terminal website to ensure vessel is open for receiving.
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>**AECC1000008- For USA origin cargo:</strong> detention tariff free time is 4 working days for dry van, 3 working days for reefer, open top or flat rack.
                </p>
                <p style={{ margin: '0' }}>
                  Detention free time includes date of empty pick up & date of load return. Any equipment return unused will be subject to $200/per dry van or $300/per reefer, open top, flat rack equipment unused fee plus any detention fee if applicable.
                </p>
              </div>
            </div>

            {/* Attachments Section */}
            <div>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                Attachments
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ 
                  padding: '20px', 
                  background: '#f8f9fa', 
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                    Business License
                  </div>
                  <div style={{ marginBottom: '8px', fontSize: '12px', color: '#6b7280' }}>
                    PDF
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '4px' }}>
                      <Download size={16} />
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div style={{ 
                  padding: '20px', 
                  background: '#f8f9fa', 
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                    Commercial Purchase...
                  </div>
                  <div style={{ marginBottom: '8px', fontSize: '12px', color: '#6b7280' }}>
                    PDF
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '4px' }}>
                      <Download size={16} />
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div style={{ 
                  padding: '20px', 
                  background: '#f8f9fa', 
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                    Commercial Purchase...
                  </div>
                  <div style={{ marginBottom: '8px', fontSize: '12px', color: '#6b7280' }}>
                    PDF
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '4px' }}>
                      <Download size={16} />
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div style={{ 
                  padding: '20px', 
                  background: '#f8f9fa', 
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                    Commercial Purchase...
                  </div>
                  <div style={{ marginBottom: '8px', fontSize: '12px', color: '#6b7280' }}>
                    PDF
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '4px' }}>
                      <Download size={16} />
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'loads' && (
          <div>
            {/* Loads Header */}
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                Loads
              </h3>
              <Button 
                type="primary"
                icon={<Plus size={16} />}
                style={{ background: '#3b82f6', border: 'none' }}
              >
                Create Load
              </Button>
            </div>

            {/* Loads Table Container */}
            <div 
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
                height: 'calc(100vh - 300px)',
                display: 'flex',
                flexDirection: 'column'
              }}
              onWheel={(e) => {
                // Enable horizontal scrolling only with mouse side wheel (deltaX)
                if (e.deltaX !== 0) {
                  e.preventDefault()
                  const tableBody = e.currentTarget.querySelector('.ant-table-body')
                  if (tableBody) {
                    tableBody.scrollLeft += e.deltaX
                  }
                }
              }}
            >
              <Table
                columns={loadsColumns}
                dataSource={loadsData}
                pagination={{
                  pageSize: 50,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `Total ${total} items`,
                  pageSizeOptions: ['50', '100', '200'],
                }}
                scroll={{ x: 1200, y: 'calc(100vh - 350px)' }}
                sticky={{ offsetHeader: 0 }}
                style={{
                  background: '#fff',
                  flex: 1,
                  height: '100%'
                }}
                size="small"
              />
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <h3>Documents</h3>
            <p>Documents content will be added here</p>
          </div>
        )}

        {activeTab === 'notes' && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <h3>Notes</h3>
            <p>Notes content will be added here</p>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Buttons */}
      {hasChanges && canEdit && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          borderTop: '1px solid #e5e7eb',
          padding: '16px 24px',
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <Button onClick={handleDiscard}>
            Discard
          </Button>
          <Button type="primary" onClick={handleSave}>
            Save updates
          </Button>
        </div>
      )}
    </div>
  )
}