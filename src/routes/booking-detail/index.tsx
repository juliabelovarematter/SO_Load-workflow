import { useState, useEffect } from 'react'
import { useRoute, useLocation } from 'wouter'
import { Button, Tag, Tabs, Form, Input, Select, DatePicker, InputNumber, Dropdown } from 'antd'
import { ArrowLeft, Trash2, Plus, Upload, FileText, StickyNote, Monitor, MessageCircle, MoreHorizontal, CheckCircle, Ship } from 'lucide-react'
import dayjs from 'dayjs'
import { generateAllBookingsData } from '../../utils/mockData'
import { initializeFormbricks, triggerSurvey } from '../../utils/formbricks'

// Container interface
interface Container {
  id: string
  type: string
  amount: number
  soNumber?: string
}

export const BookingDetail = () => {
  const [, params] = useRoute('/booking/:id')
  const [, setLocation] = useLocation()
  
  // State management
  const [bookingData, setBookingData] = useState<any>(null)
  const [form] = Form.useForm()
  const [hasChanges, setHasChanges] = useState(false)
  const [originalFormData, setOriginalFormData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('booking-info')
  const [loadsCount, setLoadsCount] = useState(0)
  const [containers, setContainers] = useState<Container[]>([])
  const [selectedSOs, setSelectedSOs] = useState<string[]>([])

  // Determine if booking is editable based on status
  const isEditable = bookingData?.status && ['Draft', 'Open'].includes(bookingData.status)

  // Initialize Formbricks
  useEffect(() => {
    console.log('🔄 useEffect: About to initialize Formbricks')
    initializeFormbricks()
  }, [])

  // Load booking data based on the ID from the URL
  useEffect(() => {
    if (params?.id) {
      // Try to load from localStorage first
      const storedBookings = localStorage.getItem('bookings')
      let booking
      
      if (storedBookings) {
        try {
          const bookings = JSON.parse(storedBookings)
          booking = bookings.find((b: any) => b.bookingNumber === params.id)
        } catch (error) {
          console.error('Error parsing stored bookings:', error)
        }
      }
      
      // If not found in localStorage, generate new data
      if (!booking) {
        const allBookings = generateAllBookingsData()
        booking = allBookings.find((b: any) => b.bookingNumber === params.id)
      }
      
      if (booking) {
        setBookingData(booking)
        
        // Set form values
        const formData = {
          bookingNumber: booking.bookingNumber || '',
          salesOrders: booking.salesOrders || [],
          steamshipLine: booking.steamshipLine || '',
          vesselName: booking.vesselName || '',
          portOfLoading: booking.portOfLoading || '',
          loadingTerminal: booking.loadingTerminal || '',
          portOfDischarge: booking.portOfDischarge || '',
          dischargeTerminal: booking.dischargeTerminal || '',
          oceanFreight: booking.oceanFreight || null,
          earlyReturnDate: booking.earlyReturnDate ? dayjs(booking.earlyReturnDate) : null,
          cutoffDate: booking.cutoffDate ? dayjs(booking.cutoffDate) : null,
          vesselDepartureDate: booking.vesselDepartureDate ? dayjs(booking.vesselDepartureDate) : null,
          vesselArrivalDate: booking.vesselArrivalDate ? dayjs(booking.vesselArrivalDate) : null
        }
        
        form.setFieldsValue(formData)
        setOriginalFormData(formData)
        setLoadsCount(booking.loadsCount || 0)
      }
    }
  }, [params?.id, form])

  const handleFieldChange = (field: string, value: any) => {
    const currentValues = form.getFieldsValue()
    const newValues = { ...currentValues, [field]: value }
    
    // Check if there are changes
    const hasFormChanges = JSON.stringify(newValues) !== JSON.stringify(originalFormData)
    setHasChanges(hasFormChanges)
  }

  const handleSave = () => {
    const formValues = form.getFieldsValue()
    console.log('Saving booking:', formValues)
    
    // Update booking data
    const updatedBooking = {
      ...bookingData,
      ...formValues
    }
    
    // Save to localStorage
    const storedBookings = localStorage.getItem('bookings')
    let bookings = []
    
    if (storedBookings) {
      try {
        bookings = JSON.parse(storedBookings)
      } catch (error) {
        console.error('Error parsing stored bookings:', error)
      }
    }
    
    // Update the specific booking
    const bookingIndex = bookings.findIndex((b: any) => b.bookingNumber === params?.id)
    if (bookingIndex !== -1) {
      bookings[bookingIndex] = updatedBooking
    } else {
      bookings.push(updatedBooking)
    }
    
    localStorage.setItem('bookings', JSON.stringify(bookings))
    setBookingData(updatedBooking)
    setOriginalFormData(formValues)
    setHasChanges(false)
  }

  const handleDiscard = () => {
    if (originalFormData) {
      form.setFieldsValue(originalFormData)
      setHasChanges(false)
    }
  }

  // Handle Give Feedback button click
  const handleGiveFeedback = async () => {
    console.log('🔄 Give Feedback button clicked!')
    try {
      await triggerSurvey("cmg6z3ito68osvm01qbqf6n8c", ".booking-detail-give-feedback-button")
      console.log('✅ Give Feedback clicked - survey triggered')
    } catch (error) {
      console.log('❌ Failed to trigger survey:', error)
    }
  }

  const handleBack = () => {
    setLocation('/bookings')
  }

  // Generate status-specific action buttons
  const getStatusActions = (status: string) => {
    switch (status) {
      case 'Draft':
        return {
          primaryActions: [
            <Button 
              key="feedback" 
              type="default" 
              className="booking-detail-give-feedback-button"
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
              className="booking-detail-give-feedback-button"
              icon={<MessageCircle size={16} />}
              onClick={handleGiveFeedback}
            >
              Give Feedback
            </Button>,
            <Button key="void" danger type="default" onClick={() => console.log('Void')}>
              Void
            </Button>
          ],
          moreActions: [
            {
              key: 'createLoad',
              label: 'Create Pending Load',
              icon: <Plus size={16} />,
              onClick: () => console.log('Create Pending Load')
            },
            {
              key: 'viewLoads',
              label: 'View Loads',
              icon: <Monitor size={16} />,
              onClick: () => console.log('View Loads')
            },
            {
              key: 'viewDocuments',
              label: 'View Documents',
              icon: <FileText size={16} />,
              onClick: () => console.log('View Documents')
            },
            {
              key: 'markShipped',
              label: 'Mark as Shipped',
              icon: <Ship size={16} />,
              onClick: () => console.log('Mark as Shipped')
            }
          ]
        }
      
      case 'Shipped':
        return {
          primaryActions: [
            <Button 
              key="feedback" 
              type="default" 
              className="booking-detail-give-feedback-button"
              icon={<MessageCircle size={16} />}
              onClick={handleGiveFeedback}
            >
              Give Feedback
            </Button>,
            <Button key="complete" type="primary" onClick={() => console.log('Complete Booking')}>
              Complete Booking
            </Button>
          ],
          moreActions: [
            {
              key: 'viewLoads',
              label: 'View Loads',
              icon: <Monitor size={16} />,
              onClick: () => console.log('View Loads')
            },
            {
              key: 'viewDocuments',
              label: 'View Documents',
              icon: <FileText size={16} />,
              onClick: () => console.log('View Documents')
            },
            {
              key: 'revertOpen',
              label: 'Revert to Open',
              icon: <ArrowLeft size={16} />,
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
        }
      
      case 'Closed':
        return {
          primaryActions: [
            <Button 
              key="feedback" 
              type="default" 
              className="booking-detail-give-feedback-button"
              icon={<MessageCircle size={16} />}
              onClick={handleGiveFeedback}
            >
              Give Feedback
            </Button>
          ],
          moreActions: [
            {
              key: 'revertShipped',
              label: 'Revert to Shipped',
              icon: <ArrowLeft size={16} />,
              onClick: () => console.log('Revert to Shipped')
            },
            {
              key: 'viewLoads',
              label: 'View Loads',
              icon: <Monitor size={16} />,
              onClick: () => console.log('View Loads')
            },
            {
              key: 'viewDocuments',
              label: 'View Documents',
              icon: <FileText size={16} />,
              onClick: () => console.log('View Documents')
            }
          ]
        }
      
      case 'Voided':
        return {
          primaryActions: [
            <Button 
              key="feedback" 
              type="default" 
              className="booking-detail-give-feedback-button"
              icon={<MessageCircle size={16} />}
              onClick={handleGiveFeedback}
            >
              Give Feedback
            </Button>
          ],
          moreActions: [
            {
              key: 'revertOpen',
              label: 'Revert to Open',
              icon: <ArrowLeft size={16} />,
              onClick: () => console.log('Revert to Open')
            }
          ]
        }
      
      default:
        return {
          primaryActions: [],
          moreActions: []
        }
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return { bgColor: '#f3f4f6', color: '#6b7280' }
      case 'Open':
        return { bgColor: '#dbeafe', color: '#1d4ed8' }
      case 'Shipped':
        return { bgColor: '#fed7aa', color: '#ea580c' }
      case 'Closed':
        return { bgColor: '#dcfce7', color: '#16a34a' }
      case 'Voided':
        return { bgColor: '#fecaca', color: '#dc2626' }
      default:
        return { bgColor: '#f3f4f6', color: '#6b7280' }
    }
  }

  if (!bookingData) {
    return (
      <div style={{ padding: '24px', background: '#F8F8F9', minHeight: '100vh' }}>
        <div style={{ 
          background: '#fff', 
          padding: '24px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h2>Loading Booking #{params?.id || 'Unknown'}...</h2>
          <p>Please wait while we load the booking details.</p>
          <div style={{ marginTop: '16px' }}>
            <button onClick={() => window.history.back()}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  const statusColors = getStatusColor(bookingData?.status || 'Draft')

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      background: '#f8f9fa'
    }}>
      {/* Header Card */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        margin: '20px 20px 12px 20px'
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
                    Booking #{bookingData.bookingNumber}
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
                    {bookingData.status}
                  </Tag>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>
                    Created on {bookingData.createdOn} by {bookingData.createdBy}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {(() => {
                const actions = getStatusActions(bookingData.status)
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
              key: 'booking-info',
              label: 'Booking Info',
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
              key: 'photos',
              label: 'Photos',
            },
            {
              key: 'documents',
              label: 'Documents',
            },
            {
              key: 'notes',
              label: 'Notes',
            },
            {
              key: 'history',
              label: 'History',
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
        margin: '0 20px 20px 20px',
        border: '1px solid #e5e7eb'
      }}>
        {activeTab === 'booking-info' && (
          <Form
            form={form}
            layout="vertical"
            onValuesChange={() => setHasChanges(true)}
          >
            {/* Basic Info Section */}
            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>Basic Info</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Form.Item
                  label="Booking #"
                  name="bookingNumber"
                  rules={[{ required: true, message: 'Please enter booking number' }]}
                  style={{ marginBottom: '6px' }}
                  className="custom-required-field"
                >
                  <Input 
                    disabled 
                    placeholder="Enter booking number"
                    style={{ 
                      backgroundColor: '#f0f0f0',
                      color: '#374151'
                    }}
                  />
                </Form.Item>
                <Form.Item
                  label="SO(s) #"
                  name="salesOrders"
                  style={{ marginBottom: '6px' }}
                >
                  <Select
                    mode="multiple"
                    disabled={!isEditable}
                    placeholder="Select sales orders (optional)"
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
                    options={[
                      { value: '#001234 Allan Co', label: '#001234 Allan Co' },
                      { value: '#002345 EcoHarmony Metals', label: '#002345 EcoHarmony Metals' },
                      { value: '#003456 EarthCycle Reclaim', label: '#003456 EarthCycle Reclaim' },
                      { value: '#004567 GreenMetal Solutions', label: '#004567 GreenMetal Solutions' },
                      { value: '#005678 RecycleTech Inc', label: '#005678 RecycleTech Inc' },
                    ]}
                  />
                </Form.Item>
              </div>
            </div>

            {/* Shipping Dates */}
            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>Shipping Dates</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                <Form.Item
                  label="Early Return Date"
                  name="earlyReturnDate"
                  style={{ marginBottom: '6px' }}
                >
                  <DatePicker 
                    disabled={!isEditable}
                    style={{ width: '100%' }} 
                    placeholder="Select early return date" 
                  />
                </Form.Item>
                <Form.Item
                  label="Cutoff Date"
                  name="cutoffDate"
                  style={{ marginBottom: '6px' }}
                >
                  <DatePicker 
                    disabled={!isEditable}
                    style={{ width: '100%' }} 
                    placeholder="Select cutoff date" 
                  />
                </Form.Item>
                <Form.Item
                  label="Vessel Departure Date"
                  name="vesselDepartureDate"
                  style={{ marginBottom: '6px' }}
                >
                  <DatePicker 
                    disabled={!isEditable}
                    style={{ width: '100%' }} 
                    placeholder="Select departure date" 
                  />
                </Form.Item>
                <Form.Item
                  label="Vessel Estimated Arrival Date"
                  name="vesselArrivalDate"
                  style={{ marginBottom: '6px' }}
                >
                  <DatePicker 
                    disabled={!isEditable}
                    style={{ width: '100%' }} 
                    placeholder="Select arrival date" 
                  />
                </Form.Item>
              </div>
            </div>

            {/* Freight Info */}
            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>Freight Info</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Form.Item
                  label="Steamship Line"
                  name="steamshipLine"
                  rules={[{ required: true, message: 'Please enter steamship line' }]}
                  style={{ marginBottom: '6px' }}
                  className="custom-required-field"
                >
                  <Input 
                    disabled={!isEditable}
                    placeholder="Enter steamship line" 
                  />
                </Form.Item>
                <Form.Item
                  label="Vessel Name"
                  name="vesselName"
                  rules={[{ required: true, message: 'Please enter vessel name' }]}
                  style={{ marginBottom: '6px' }}
                  className="custom-required-field"
                >
                  <Input 
                    disabled={!isEditable}
                    placeholder="Enter vessel name" 
                  />
                </Form.Item>
                <Form.Item
                  label="Port of Loading"
                  name="portOfLoading"
                  rules={[{ required: true, message: 'Please enter port of loading' }]}
                  style={{ marginBottom: '6px' }}
                  className="custom-required-field"
                >
                  <Input 
                    disabled={!isEditable}
                    placeholder="Enter port of loading" 
                  />
                </Form.Item>
                <Form.Item
                  label="Loading Terminal"
                  name="loadingTerminal"
                  rules={[{ required: true, message: 'Please select loading terminal' }]}
                  style={{ marginBottom: '6px' }}
                  className="custom-required-field"
                >
                  <Select 
                    disabled={!isEditable}
                    placeholder="Select terminal"
                  >
                    <Select.Option value="Terminal 1">Terminal 1</Select.Option>
                    <Select.Option value="Terminal 2">Terminal 2</Select.Option>
                    <Select.Option value="Terminal 3">Terminal 3</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  label="Port of Discharge"
                  name="portOfDischarge"
                  rules={[{ required: true, message: 'Please enter port of discharge' }]}
                  style={{ marginBottom: '6px' }}
                  className="custom-required-field"
                >
                  <Input 
                    disabled={!isEditable}
                    placeholder="Enter port of discharge" 
                  />
                </Form.Item>
                <Form.Item
                  label="Discharge Terminal"
                  name="dischargeTerminal"
                  rules={[{ required: true, message: 'Please select discharge terminal' }]}
                  style={{ marginBottom: '6px' }}
                  className="custom-required-field"
                >
                  <Select 
                    disabled={!isEditable}
                    placeholder="Select terminal"
                  >
                    <Select.Option value="Terminal A">Terminal A</Select.Option>
                    <Select.Option value="Terminal B">Terminal B</Select.Option>
                    <Select.Option value="Terminal C">Terminal C</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  label="Ocean Freight"
                  name="oceanFreight"
                  style={{ marginBottom: '6px' }}
                >
                  <InputNumber
                    disabled={!isEditable}
                    placeholder="Enter ocean freight"
                    style={{ width: '100%' }}
                    prefix="$"
                    min={0}
                  />
                </Form.Item>
              </div>
            </div>
          </Form>
        )}

        {activeTab === 'loads' && (
          <>
            <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
              Loads
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Load management will be implemented here.
            </p>
          </>
        )}

        {activeTab === 'photos' && (
          <>
            <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
              Photos
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Photo management will be implemented here.
            </p>
          </>
        )}

        {activeTab === 'documents' && (
          <>
            <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
              Documents
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Document management will be implemented here.
            </p>
          </>
        )}

        {activeTab === 'notes' && (
          <>
            <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
              Notes
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Notes management will be implemented here.
            </p>
          </>
        )}

        {activeTab === 'history' && (
          <>
            <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
              History
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              History tracking will be implemented here.
            </p>
          </>
        )}
      </div>

      {/* Fixed Save/Discard Buttons */}
      {hasChanges && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          borderTop: '1px solid #e5e7eb',
          padding: '16px 24px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          zIndex: 1000
        }}>
          <Button onClick={handleDiscard}>
            Discard
          </Button>
          <Button type="primary" onClick={handleSave} disabled={!isEditable}>
            Save updates
          </Button>
        </div>
      )}
    </div>
  )
}