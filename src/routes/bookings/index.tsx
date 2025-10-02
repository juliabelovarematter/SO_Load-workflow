import { Table, Button, Input, Select, Dropdown, Modal, Form, DatePicker, InputNumber, Tag } from 'antd'
import { MoreOutlined } from '@ant-design/icons'
import { useState, useMemo, useEffect } from 'react'
import { FileText, Ship, CheckCircle, RotateCcw, Trash2, Plus } from 'lucide-react'
import { generateAllBookingsData } from '../../utils/mockData'
import { useLocation } from 'wouter'
import dayjs from 'dayjs'

export const Bookings = () => {
  console.log('Bookings component rendering...')
  
  const [, setLocation] = useLocation()
  
  // Filter states
  const [searchText, setSearchText] = useState('')
  const [selectedFacility, setSelectedFacility] = useState<string | undefined>()
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>()
  
  // Modal states
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [form] = Form.useForm()
  const [formValues, setFormValues] = useState({})
  const [selectedSOs, setSelectedSOs] = useState<string[]>([])
  const [containers, setContainers] = useState<{[key: string]: Array<{type: string, amount: number}>}>({})
  
  // Generate 50 bookings with persistence
  const allData = useMemo(() => {
    try {
      console.log('Generating bookings data...')
      const generatedData = generateAllBookingsData()
      console.log('Generated data:', generatedData.length, 'bookings')
      return generatedData.map((booking, index) => ({
        key: String(index),
        ...booking
      }))
    } catch (error) {
      console.error('Error generating bookings data:', error)
      return []
    }
  }, [])
  
  // Table data state for updates
  const [data, setData] = useState(allData)
  
  // Load saved data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('bookings-data')
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        setData(parsedData)
      } catch (error) {
        console.error('Error loading saved bookings data:', error)
        setData(allData)
      }
    } else {
      setData(allData)
    }
  }, [allData])
  
  // Save data to localStorage whenever data changes
  useEffect(() => {
    if (data.length > 0) {
      localStorage.setItem('bookings-data', JSON.stringify(data))
    }
  }, [data])

  // Handle row click navigation
  const handleRowClick = (record: any) => {
    console.log('Row clicked:', record)
    setLocation(`/booking/${record.bookingNumber}`)
  }

  // Handle create booking
  const handleCreateBooking = () => {
    form.validateFields().then((values) => {
      console.log('Create Booking:', values)
      // Generate a new booking number (use timestamp for uniqueness)
      const bookingNumber = `BK-2024-${String(Date.now() % 1000).padStart(3, '0')}`
      
      // Store the booking data
      const bookingData = {
        bookingNumber,
        soNumber: values.soNumber || '',
        poNumber: values.poNumber || '',
        customer: values.customer || '',
        portOfDestination: values.portOfDischarge || '',
        facility: values.portOfLoading || '',
        containers: 0, // Will be set in step 2
        cutoffDate: values.cutoffDate ? values.cutoffDate.format('YYYY-MM-DD') : '',
        earlyReturnDate: values.earlyReturnDate ? values.earlyReturnDate.format('YYYY-MM-DD') : '',
        vessel: values.vesselName || '',
        createdOn: dayjs().format('MMM D, YYYY'),
        status: 'Draft',
        notes: values.notes || ''
      }
      
      // Add to table data
      const newBooking = {
        key: String(data.length),
        ...bookingData
      }
      setData(prev => [...prev, newBooking])
      
      setIsCreateModalVisible(false)
      setCurrentStep(0)
      form.resetFields()
      setFormValues({})
      setSelectedSOs([])
      setContainers({})
    }).catch((errorInfo) => {
      console.log('Validation failed:', errorInfo)
    })
  }
  
  const handleCancelCreate = () => {
    setIsCreateModalVisible(false)
    setCurrentStep(0)
    form.resetFields()
    setFormValues({})
    setSelectedSOs([])
    setContainers({})
  }

  const handleNext = () => {
    if (currentStep === 0) {
      // Check if all required fields are filled
      if (!isStep1Valid()) {
        // Validate and show error messages for empty required fields
        form.validateFields(['bookingNumber', 'steamshipLine', 'vesselName', 'portOfLoading', 'loadingTerminal', 'portOfDischarge', 'dischargeTerminal'])
          .catch((errorInfo) => {
            console.log('Validation failed:', errorInfo)
          })
        return // Don't proceed to next step
      }
      
      // If validation passes, proceed to next step
      form.validateFields().then(() => {
        setCurrentStep(1)
      }).catch((errorInfo) => {
        console.log('Validation failed:', errorInfo)
      })
    } else if (currentStep === 1) {
      // Step 2 validation - check if at least one container is configured
      const hasGeneralContainers = containers['general'] && containers['general'].length > 0
      const hasSOContainers = selectedSOs.some(soId => containers[soId] && containers[soId].length > 0)
      
      if (!hasGeneralContainers && !hasSOContainers) {
        // No containers configured, show validation error
        console.log('Please add at least one container')
        return
      }
      
      // If validation passes, proceed to create booking
      handleCreateBooking()
    }
  }

  // Check if all required fields are filled for step 1
  const isStep1Valid = () => {
    const requiredFields = ['bookingNumber', 'steamshipLine', 'vesselName', 'portOfLoading', 'loadingTerminal', 'portOfDischarge', 'dischargeTerminal']
    
    // Get current form values directly from the form instance
    const currentFormValues = form.getFieldsValue()
    
    return requiredFields.every(field => {
      const value = currentFormValues[field]
      return value && value.toString().trim() !== ''
    })
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Container management functions
  const addContainerToSO = (soId: string) => {
    setContainers(prev => ({
      ...prev,
      [soId]: [...(prev[soId] || []), { type: '', amount: 1 }]
    }))
  }

  const removeContainerFromSO = (soId: string, index: number) => {
    setContainers(prev => ({
      ...prev,
      [soId]: prev[soId].filter((_, i) => i !== index)
    }))
  }

  const removeFirstSOContainer = (soId: string) => {
    // Remove the first additional container for this SO (index 0)
    if (containers[soId] && containers[soId].length > 0) {
      setContainers(prev => ({
        ...prev,
        [soId]: prev[soId].filter((_, i) => i !== 0)
      }))
    }
  }

  const updateContainer = (soId: string, index: number, field: 'type' | 'amount', value: string | number) => {
    setContainers(prev => ({
      ...prev,
      [soId]: prev[soId].map((container, i) => 
        i === index ? { ...container, [field]: value } : container
      )
    }))
  }

  const addGeneralContainer = () => {
    setContainers(prev => ({
      ...prev,
      'general': [...(prev['general'] || []), { type: '', amount: 1 }]
    }))
  }

  const removeGeneralContainer = (index: number) => {
    setContainers(prev => ({
      ...prev,
      'general': prev['general'].filter((_, i) => i !== index)
    }))
  }

  const removeFirstGeneralContainer = () => {
    // Remove the first additional container (index 0)
    if (containers['general'] && containers['general'].length > 0) {
      setContainers(prev => ({
        ...prev,
        'general': prev['general'].filter((_, i) => i !== 0)
      }))
    }
  }

  const updateGeneralContainer = (index: number, field: 'type' | 'amount', value: string | number) => {
    setContainers(prev => ({
      ...prev,
      'general': prev['general'].map((container, i) => 
        i === index ? { ...container, [field]: value } : container
      )
    }))
  }

  // Sample data
  const salesOrders = [
    { value: '#001234 Allan Co', label: '#001234 Allan Co' },
    { value: '#002345 EcoHarmony Metals', label: '#002345 EcoHarmony Metals' },
    { value: '#003456 EarthCycle Reclaim', label: '#003456 EarthCycle Reclaim' },
    { value: '#004567 GreenMetal Solutions', label: '#004567 GreenMetal Solutions' },
    { value: '#005678 RecycleTech Inc', label: '#005678 RecycleTech Inc' },
  ]

  const containerTypes = [
    { value: '20ft', label: '20ft' },
    { value: '40ft', label: '40ft' },
    { value: '40y', label: '40y' },
    { value: '50y', label: '50y' },
    { value: '4 x 4', label: '4 x 4' },
    { value: '6 x 6', label: '6 x 6' },
  ]

  // Filter the data based on search and filters (memoized)
  const filteredData = useMemo(() => {
    return data.filter(booking => {
      const matchesSearch = !searchText || 
        booking.bookingNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        booking.soNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        booking.customer.toLowerCase().includes(searchText.toLowerCase()) ||
        booking.vessel.toLowerCase().includes(searchText.toLowerCase())
      
      const matchesFacility = !selectedFacility || booking.facility === selectedFacility
      const matchesStatus = !selectedStatus || selectedStatus === 'all' || booking.status === selectedStatus
      
      return matchesSearch && matchesFacility && matchesStatus
    })
  }, [data, searchText, selectedFacility, selectedStatus])

  const columns = [
    {
      title: 'Booking#',
      dataIndex: 'bookingNumber',
      key: 'bookingNumber',
      width: 120,
    },
    {
      title: 'SO#',
      dataIndex: 'soNumber',
      key: 'soNumber',
      width: 120,
    },
    {
      title: 'PO#',
      dataIndex: 'poNumber',
      key: 'poNumber',
      width: 120,
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      width: 200,
    },
    {
      title: 'Port of Destination',
      dataIndex: 'portOfDestination',
      key: 'portOfDestination',
      width: 180,
    },
    {
      title: 'Facility',
      dataIndex: 'facility',
      key: 'facility',
      width: 150,
    },
    {
      title: 'Containers',
      dataIndex: 'containers',
      key: 'containers',
      width: 100,
      render: (containers: number) => `${containers} containers`,
    },
    {
      title: 'Cutoff Date',
      dataIndex: 'cutoffDate',
      key: 'cutoffDate',
      width: 120,
    },
    {
      title: 'Early Return Date',
      dataIndex: 'earlyReturnDate',
      key: 'earlyReturnDate',
      width: 140,
    },
    {
      title: 'Vessel',
      dataIndex: 'vessel',
      key: 'vessel',
      width: 150,
    },
    {
      title: 'Created on',
      dataIndex: 'createdOn',
      key: 'createdOn',
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        let color = '#6b7280' // default grey
        let bgColor = '#f3f4f6'
        
        if (status === 'Draft') {
          color = '#6b7280'
          bgColor = '#f3f4f6'
        } else if (status === 'Open') {
          color = '#1d4ed8'
          bgColor = '#dbeafe'
        } else if (status === 'Shipped') {
          color = '#ea580c'
          bgColor = '#fed7aa'
        } else if (status === 'Voided') {
          color = '#dc2626'
          bgColor = '#fecaca'
        } else if (status === 'Closed') {
          color = '#16a34a'
          bgColor = '#dcfce7'
        }
        
        return (
          <span style={{
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: bgColor,
            color: color
          }}>
            {status}
          </span>
        )
      },
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      width: 200,
      render: (notes: string) => notes ? (
        <span title={notes} style={{ 
          display: 'block', 
          maxWidth: '180px', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap' 
        }}>
          {notes}
        </span>
      ) : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: any) => {
        const getMenuItems = (status: string) => {
          switch (status) {
            case 'Draft':
              return [
                {
                  key: 'void',
                  label: 'Void',
                  icon: <Trash2 size={16} />,
                  danger: true,
                },
              ]
            
            case 'Open':
              return [
                {
                  key: 'create-pending-load',
                  label: 'Create Pending Load',
                  icon: <FileText size={16} />,
                },
                {
                  key: 'view-loads',
                  label: 'View Loads',
                  icon: <Ship size={16} />,
                },
                {
                  key: 'view-documents',
                  label: 'View Documents',
                  icon: <FileText size={16} />,
                },
                {
                  key: 'mark-shipped',
                  label: 'Mark as Shipped',
                  icon: <CheckCircle size={16} />,
                },
                {
                  key: 'void',
                  label: 'Void',
                  icon: <Trash2 size={16} />,
                  danger: true,
                },
              ]
            
            case 'Shipped':
              return [
                {
                  key: 'view-loads',
                  label: 'View Loads',
                  icon: <Ship size={16} />,
                },
                {
                  key: 'view-documents',
                  label: 'View Documents',
                  icon: <FileText size={16} />,
                },
                {
                  key: 'complete-booking',
                  label: 'Complete Booking',
                  icon: <CheckCircle size={16} />,
                },
                {
                  key: 'revert-open',
                  label: 'Revert to Open',
                  icon: <RotateCcw size={16} />,
                },
                {
                  key: 'void',
                  label: 'Void',
                  icon: <Trash2 size={16} />,
                  danger: true,
                },
              ]
            
            case 'Closed':
              return [
                {
                  key: 'revert-shipped',
                  label: 'Revert to Shipped',
                  icon: <RotateCcw size={16} />,
                },
                {
                  key: 'view-loads',
                  label: 'View Loads',
                  icon: <Ship size={16} />,
                },
                {
                  key: 'view-documents',
                  label: 'View Documents',
                  icon: <FileText size={16} />,
                },
              ]
            
            case 'Voided':
              return [
                {
                  key: 'revert-open',
                  label: 'Revert to Open',
                  icon: <RotateCcw size={16} />,
                },
              ]
            
            default:
              return [
                {
                  key: 'void',
                  label: 'Void',
                  icon: <Trash2 size={16} />,
                  danger: true,
                },
              ]
          }
        }

        const menuItems = getMenuItems(record.status)

        return (
          <Dropdown
            menu={{ 
              items: menuItems,
              onClick: ({ key }) => {
                console.log(`Action clicked: ${key} for booking ${record.bookingNumber}`)
                // Handle action logic here
              }
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              style={{
                border: 'none',
                boxShadow: 'none',
                padding: '4px 8px',
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        )
      }
    },
  ]
  
  // Simple test data
  const testData = [
    {
      key: '1',
      bookingNumber: 'BK-2024-001',
      soNumber: '#000123',
      poNumber: 'PO-2024-001',
      customer: 'ABC Steel Corp',
      portOfDestination: 'Shanghai, China',
      facility: 'Port of Los Angeles',
      containers: 12,
      cutoffDate: '2024-02-10',
      earlyReturnDate: '2024-02-08',
      vessel: 'MV Ocean Star',
      createdOn: '2024-01-15',
      status: 'Open',
      notes: 'Priority shipment - expedite processing',
    }
  ]

  return (
    <div style={{ 
      padding: '24px', 
      background: '#F8F8F9', 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Fixed Header with search and filters */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Input
            placeholder="Search"
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="Filter by Facility"
            style={{ width: 200 }}
            allowClear
            value={selectedFacility}
            onChange={setSelectedFacility}
            options={[
              { value: 'Port of Los Angeles', label: 'Port of Los Angeles' },
              { value: 'Port of Long Beach', label: 'Port of Long Beach' },
              { value: 'Port of Oakland', label: 'Port of Oakland' },
              { value: 'Port of Seattle', label: 'Port of Seattle' },
              { value: 'Port of Tacoma', label: 'Port of Tacoma' },
              { value: 'Port of Houston', label: 'Port of Houston' },
              { value: 'Port of Miami', label: 'Port of Miami' },
              { value: 'Port of New York', label: 'Port of New York' },
              { value: 'Port of Savannah', label: 'Port of Savannah' },
              { value: 'Port of Charleston', label: 'Port of Charleston' },
              { value: 'Port of Norfolk', label: 'Port of Norfolk' },
              { value: 'Port of Baltimore', label: 'Port of Baltimore' },
            ]}
          />
          <Select
            placeholder="Filter by Status"
            style={{ width: 200 }}
            allowClear
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'Draft', label: 'Draft' },
              { value: 'Open', label: 'Open' },
              { value: 'Shipped', label: 'Shipped' },
              { value: 'Closed', label: 'Closed' },
              { value: 'Voided', label: 'Voided' },
            ]}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button 
            type="primary"
            style={{ background: '#3b82f6', border: 'none' }}
            onClick={() => setIsCreateModalVisible(true)}
          >
            Create Booking
          </Button>
        </div>
      </div>

      {/* Scrollable Table Container */}
      <div style={{
        background: '#fff',
        border: '1px solid #d1d5db',
        borderRadius: '10px',
        overflow: 'auto',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{
            pageSize: 50,
            pageSizeOptions: ['50', '100', '200'],
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} bookings`
          }}
          size="small"
          scroll={{ 
            x: 1800,
            y: 'calc(100vh - 200px)' // Fixed height for vertical scroll
          }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' }
          })}
        />
      </div>
      
      {/* Create Booking Modal */}
      <Modal
        title="Create Booking"
        open={isCreateModalVisible}
        onCancel={handleCancelCreate}
        width={800}
        footer={null}
        destroyOnClose
      >
        {/* Step Indicator */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-start', 
          alignItems: 'center',
          marginBottom: '12px',
          gap: '8px'
        }}>
          <div style={{
            color: currentStep === 0 ? '#1CB285' : '#6b7280',
            fontWeight: '500',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{
              width: '20px',
              height: '20px',
              borderRadius: '3px',
              backgroundColor: currentStep === 0 ? 'rgba(28, 178, 133, 0.1)' : '#9ca3af',
              border: currentStep === 0 ? '1px solid #1CB285' : 'none',
              color: currentStep === 0 ? '#1CB285' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              1
            </span>
            Booking Info
          </div>
          
          {/* Connector Line */}
          <div style={{
            width: '20px',
            height: '1px',
            backgroundColor: '#e5e7eb',
            margin: '0 4px'
          }} />
          
          <div style={{
            color: currentStep === 1 ? '#1CB285' : '#6b7280',
            fontWeight: '500',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{
              width: '20px',
              height: '20px',
              borderRadius: '3px',
              backgroundColor: currentStep === 1 ? 'rgba(28, 178, 133, 0.1)' : '#9ca3af',
              border: currentStep === 1 ? '1px solid #1CB285' : 'none',
              color: currentStep === 1 ? '#1CB285' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              2
            </span>
            Containers
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          style={{ gap: '12px' }}
          onValuesChange={(changedValues, allValues) => {
            setFormValues(allValues)
          }}
        >
          {currentStep === 0 && (
            <>
              {/* Basic Info */}
              <div style={{ marginBottom: '12px' }}>
                <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>Basic Info</h4>
                <Form.Item
                  label={<span>Booking # <span style={{ color: '#DF173E' }}>*</span></span>}
                  name="bookingNumber"
                  rules={[{ required: true, message: 'Please enter booking number' }]}
                  style={{ marginBottom: '6px' }}
                  className="custom-required-field"
                >
                  <Input placeholder="Enter booking number" />
                </Form.Item>
              </div>

              {/* Freight Info */}
              <div style={{ marginBottom: '12px' }}>
                <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>Freight Info</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Form.Item
                    label={<span>Steamship Line <span style={{ color: '#DF173E' }}>*</span></span>}
                    name="steamshipLine"
                    rules={[{ required: true, message: 'Please enter steamship line' }]}
                    style={{ marginBottom: '6px' }}
                    className="custom-required-field"
                  >
                    <Input placeholder="Enter steamship line" />
                  </Form.Item>
                  <Form.Item
                    label={<span>Vessel Name <span style={{ color: '#DF173E' }}>*</span></span>}
                    name="vesselName"
                    rules={[{ required: true, message: 'Please enter vessel name' }]}
                    style={{ marginBottom: '6px' }}
                    className="custom-required-field"
                  >
                    <Input placeholder="Enter vessel name" />
                  </Form.Item>
                  <Form.Item
                    label={<span>Port of Loading <span style={{ color: '#DF173E' }}>*</span></span>}
                    name="portOfLoading"
                    rules={[{ required: true, message: 'Please enter port of loading' }]}
                    style={{ marginBottom: '6px' }}
                    className="custom-required-field"
                  >
                    <Input placeholder="Enter port of loading" />
                  </Form.Item>
                  <Form.Item
                    label={<span>Loading Terminal <span style={{ color: '#DF173E' }}>*</span></span>}
                    name="loadingTerminal"
                    rules={[{ required: true, message: 'Please select loading terminal' }]}
                    style={{ marginBottom: '6px' }}
                    className="custom-required-field"
                  >
                    <Select placeholder="Select terminal">
                      <Select.Option value="Terminal 1">Terminal 1</Select.Option>
                      <Select.Option value="Terminal 2">Terminal 2</Select.Option>
                      <Select.Option value="Terminal 3">Terminal 3</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    label={<span>Port of Discharge <span style={{ color: '#DF173E' }}>*</span></span>}
                    name="portOfDischarge"
                    rules={[{ required: true, message: 'Please enter port of discharge' }]}
                    style={{ marginBottom: '6px' }}
                    className="custom-required-field"
                  >
                    <Input placeholder="Enter port of discharge" />
                  </Form.Item>
                  <Form.Item
                    label={<span>Discharge Terminal <span style={{ color: '#DF173E' }}>*</span></span>}
                    name="dischargeTerminal"
                    rules={[{ required: true, message: 'Please select discharge terminal' }]}
                    style={{ marginBottom: '6px' }}
                    className="custom-required-field"
                  >
                    <Select placeholder="Select terminal">
                      <Select.Option value="Taiwan">Taiwan</Select.Option>
                      <Select.Option value="Main Terminal">Main Terminal</Select.Option>
                      <Select.Option value="Secondary Terminal">Secondary Terminal</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    label="Ocean Freight"
                    name="oceanFreight"
                    style={{ marginBottom: '6px' }}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="Enter ocean freight amount"
                      prefix="$"
                      min={0}
                      step={0.01}
                    />
                  </Form.Item>
                </div>
              </div>

              {/* Shipping Dates */}
              <div style={{ marginBottom: '12px' }}>
                <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>Shipping Dates</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Form.Item
                    label="Early Return Date"
                    name="earlyReturnDate"
                    style={{ marginBottom: '6px' }}
                  >
                    <DatePicker style={{ width: '100%' }} placeholder="Select early return date" />
                  </Form.Item>
                  <Form.Item
                    label="Cutoff Date"
                    name="cutoffDate"
                    style={{ marginBottom: '6px' }}
                  >
                    <DatePicker style={{ width: '100%' }} placeholder="Select cutoff date" />
                  </Form.Item>
                  <Form.Item
                    label="Vessel Departure Date"
                    name="vesselDepartureDate"
                    style={{ marginBottom: '6px' }}
                  >
                    <DatePicker style={{ width: '100%' }} placeholder="Select departure date" />
                  </Form.Item>
                  <Form.Item
                    label="Vessel Estimated Arrival Date"
                    name="vesselArrivalDate"
                    style={{ marginBottom: '6px' }}
                  >
                    <DatePicker style={{ width: '100%' }} placeholder="Select arrival date" />
                  </Form.Item>
                </div>
              </div>
            </>
          )}

          {currentStep === 1 && (
            <>
              {/* Sales Orders Section */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>Sales Orders</h4>
                <Form.Item
                  label="SO(s) #"
                  name="salesOrders"
                >
                  <Select
                    mode="multiple"
                    placeholder="Select sales orders (optional)"
                    value={selectedSOs}
                    onChange={setSelectedSOs}
                    options={salesOrders}
                    style={{ width: '100%' }}
                    tagRender={(props) => {
                      const { label, value, closable, onClose } = props
                      return (
                        <Tag
                          closable={closable}
                          onClose={onClose}
                          style={{ marginRight: 3 }}
                        >
                          {label}
                        </Tag>
                      )
                    }}
                  />
                </Form.Item>
              </div>

              {/* Containers Section */}
              <div>
                <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>Containers</h4>
                
                {selectedSOs.length === 0 ? (
                  // No SOs selected - show general container form
                  <div>
                    {/* First row with labels */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', marginBottom: '12px' }}>
                      <Form.Item
                        label="Container Type"
                        name="generalContainerType"
                        rules={[{ required: true, message: 'Please select container type' }]}
                        style={{ marginBottom: 0 }}
                        className="custom-required-field"
                      >
                        <Select placeholder="Select container type" options={containerTypes} />
                      </Form.Item>
                      <Form.Item
                        label="Container Amount"
                        name="generalContainerAmount"
                        rules={[{ required: true, message: 'Please enter container amount' }]}
                        style={{ marginBottom: 0 }}
                        className="custom-required-field"
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          placeholder="Enter amount"
                          min={1}
                        />
                      </Form.Item>
                      <div style={{ display: 'flex', alignItems: 'end', paddingBottom: '0px', justifyContent: 'center' }}>
                        <Button
                          danger
                          icon={<Trash2 size={16} />}
                          disabled={!containers['general'] || containers['general'].length === 0}
                          onClick={removeFirstGeneralContainer}
                          style={{ 
                            width: '32px',
                            height: '32px',
                            opacity: (!containers['general'] || containers['general'].length === 0) ? 0.3 : 1
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Dynamic general containers */}
                    {containers['general']?.map((container, index) => (
                      <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', marginBottom: '12px', alignItems: 'end' }}>
                        <Select
                          placeholder="Container Type"
                          value={container.type}
                          onChange={(value) => updateGeneralContainer(index, 'type', value)}
                          options={containerTypes}
                        />
                        <InputNumber
                          placeholder="Amount"
                          value={container.amount}
                          onChange={(value) => updateGeneralContainer(index, 'amount', value || 1)}
                          min={1}
                          style={{ width: '100%' }}
                        />
                        <Button
                          danger
                          icon={<Trash2 size={16} />}
                          onClick={() => removeGeneralContainer(index)}
                          disabled={!containers['general'] || containers['general'].length === 0}
                          style={{ 
                            width: '32px',
                            height: '32px'
                          }}
                        />
                      </div>
                    ))}
                    
                    <Button
                      icon={<Plus size={16} />}
                      onClick={addGeneralContainer}
                      style={{ marginTop: '8px' }}
                    >
                      Add Another Type
                    </Button>
                  </div>
                ) : (
                  // SOs selected - show containers per SO
                  <div>
                    {selectedSOs.map((soId) => (
                      <div key={soId} style={{ marginBottom: '24px' }}>
                        <div style={{ marginBottom: '12px' }}>
                          <Input
                            value={soId}
                            disabled
                            style={{ backgroundColor: '#f8f9fa', color: '#6b7280' }}
                          />
                        </div>
                        
                        {/* First container row with labels */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', marginBottom: '12px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                              Container Type <span style={{ color: 'red' }}>*</span>
                            </label>
                            <Select
                              placeholder="Select container type"
                              options={containerTypes}
                              style={{ width: '100%' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                              Container Amount <span style={{ color: 'red' }}>*</span>
                            </label>
                            <InputNumber
                              placeholder="Enter amount"
                              min={1}
                              style={{ width: '100%' }}
                            />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'end', paddingBottom: '0px', justifyContent: 'center' }}>
                            <Button
                              danger
                              icon={<Trash2 size={16} />}
                              disabled={!containers[soId] || containers[soId].length === 0}
                              onClick={() => removeFirstSOContainer(soId)}
                              style={{ 
                                width: '32px',
                                height: '32px',
                                opacity: (!containers[soId] || containers[soId].length === 0) ? 0.3 : 1
                              }}
                            />
                          </div>
                        </div>

                        {/* Dynamic container rows for this SO */}
                        {containers[soId]?.map((container, index) => (
                          <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', marginBottom: '12px', alignItems: 'end' }}>
                            <Select
                              placeholder="Container Type"
                              value={container.type}
                              onChange={(value) => updateContainer(soId, index, 'type', value)}
                              options={containerTypes}
                            />
                            <InputNumber
                              placeholder="Amount"
                              value={container.amount}
                              onChange={(value) => updateContainer(soId, index, 'amount', value || 1)}
                              min={1}
                              style={{ width: '100%' }}
                            />
                            <Button
                              danger
                              icon={<Trash2 size={16} />}
                              onClick={() => removeContainerFromSO(soId, index)}
                              disabled={!containers[soId] || containers[soId].length === 0}
                              style={{ 
                                width: '32px',
                                height: '32px'
                              }}
                            />
                          </div>
                        ))}
                        
                        <Button
                          icon={<Plus size={16} />}
                          onClick={() => addContainerToSO(soId)}
                          style={{ marginTop: '8px' }}
                        >
                          Add Another Type
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Modal Footer */}
          <div style={{ 
            display: 'flex', 
            justifyContent: currentStep === 0 ? 'flex-end' : 'space-between', 
            gap: '12px', 
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #e5e7eb'
          }}>
            {currentStep === 0 ? (
              // Step 1: Only Next button
              <Button 
                type="primary" 
                onClick={handleNext}
              >
                Next
              </Button>
            ) : (
              // Step 2: Back on left, Create Booking on right
              <>
                <Button onClick={handlePrev}>
                  Back
                </Button>
                <Button 
                  type="primary" 
                  onClick={handleNext}
                >
                  Create Booking
                </Button>
              </>
            )}
          </div>
        </Form>
      </Modal>
    </div>
  )
}