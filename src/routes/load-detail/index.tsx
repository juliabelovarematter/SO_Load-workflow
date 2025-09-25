import { useState, useEffect } from 'react'
import { useRoute } from 'wouter'
import { Button, Tag, Tabs, Form, Input, Select, DatePicker, InputNumber } from 'antd'
import { ArrowLeft, Trash2, Plus, Upload, FileText, StickyNote, Monitor, Weight } from 'lucide-react'
import dayjs from 'dayjs'

export const LoadDetail = () => {
  const [, params] = useRoute('/load/:id')
  const [loadData, setLoadData] = useState<any>(null)
  const [form] = Form.useForm()
  const [hasChanges, setHasChanges] = useState(false)
  const [originalFormData, setOriginalFormData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('load-info')
  const [materials, setMaterials] = useState<any[]>([])
  const [weightMode, setWeightMode] = useState<'scale' | 'price'>('price')
  const [requestMode, setRequestMode] = useState<'request' | 'staged'>('request')

  useEffect(() => {
    if (params?.id) {
      // Load data from localStorage
      const storedData = localStorage.getItem(`load-${params.id}`)
      if (storedData) {
        const data = JSON.parse(storedData)
        setLoadData(data)
        
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
    setHasChanges(false)
    setOriginalFormData(values)
  }

  const handleDiscard = () => {
    form.setFieldsValue(originalFormData)
    setHasChanges(false)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'load-info':
        return renderLoadInfoContent()
      case 'materials':
        return renderMaterialsContent()
      case 'photos':
        return renderPhotosContent()
      case 'documents':
        return renderDocumentsContent()
      case 'notes':
        return renderNotesContent()
      default:
        return renderLoadInfoContent()
    }
  }

  const renderLoadInfoContent = () => (
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
              placeholder="Select sales order"
              showSearch
              allowClear
              onChange={(value) => {
                // Update load status based on SO selection
                if (value) {
                  setLoadData(prev => ({ ...prev, status: 'Open' }))
                } else {
                  setLoadData(prev => ({ ...prev, status: 'Unassigned' }))
                }
              }}
              options={[
                { value: '#002823', label: '#002823 Gyuako - Los Angeles' },
                { value: '#002345', label: '#002345' },
                { value: '#002346', label: '#002346' },
                { value: '#002347', label: '#002347' },
                { value: '#002348', label: '#002348' },
                { value: '#002349', label: '#002349' },
                { value: '#002350', label: '#002350' },
                { value: '#002351', label: '#002351' },
                { value: '#002352', label: '#002352' },
                { value: '#002353', label: '#002353' },
                { value: '#002354', label: '#002354' },
                { value: '#002355', label: '#002355' },
                { value: '#002356', label: '#002356' },
                { value: '#002357', label: '#002357' },
                { value: '#002358', label: '#002358' },
                { value: '#002359', label: '#002359' },
                { value: '#002360', label: '#002360' },
                { value: '#002361', label: '#002361' },
                { value: '#002362', label: '#002362' },
                { value: '#002363', label: '#002363' },
                { value: '#002364', label: '#002364' },
                { value: '#002365', label: '#002365' },
                { value: '#002366', label: '#002366' },
                { value: '#002367', label: '#002367' },
                { value: '#002368', label: '#002368' },
                { value: '#002369', label: '#002369' },
                { value: '#002370', label: '#002370' },
                { value: '#002371', label: '#002371' },
                { value: '#002372', label: '#002372' },
                { value: '#002373', label: '#002373' },
                { value: '#002374', label: '#002374' },
                { value: '#002375', label: '#002375' },
                { value: '#002376', label: '#002376' },
                { value: '#002377', label: '#002377' },
                { value: '#002378', label: '#002378' },
                { value: '#002379', label: '#002379' },
                { value: '#002380', label: '#002380' },
                { value: '#002381', label: '#002381' },
                { value: '#002382', label: '#002382' },
                { value: '#002383', label: '#002383' },
                { value: '#002384', label: '#002384' },
                { value: '#002385', label: '#002385' },
                { value: '#002386', label: '#002386' },
                { value: '#002387', label: '#002387' },
                { value: '#002388', label: '#002388' },
                { value: '#002389', label: '#002389' },
                { value: '#002390', label: '#002390' },
                { value: '#002391', label: '#002391' },
                { value: '#002392', label: '#002392' },
                { value: '#002393', label: '#002393' },
                { value: '#002394', label: '#002394' },
                { value: '#002395', label: '#002395' },
                { value: '#002396', label: '#002396' },
                { value: '#002397', label: '#002397' },
                { value: '#002398', label: '#002398' },
                { value: '#002399', label: '#002399' },
                { value: '#002400', label: '#002400' },
                { value: '#002401', label: '#002401' },
                { value: '#002402', label: '#002402' },
                { value: '#002403', label: '#002403' },
                { value: '#002404', label: '#002404' },
                { value: '#002405', label: '#002405' },
                { value: '#002406', label: '#002406' },
                { value: '#002407', label: '#002407' },
                { value: '#002408', label: '#002408' },
                { value: '#002409', label: '#002409' },
                { value: '#002410', label: '#002410' },
                { value: '#002411', label: '#002411' },
                { value: '#002412', label: '#002412' },
                { value: '#002413', label: '#002413' },
                { value: '#002414', label: '#002414' },
                { value: '#002415', label: '#002415' },
                { value: '#002416', label: '#002416' },
                { value: '#002417', label: '#002417' },
                { value: '#002418', label: '#002418' },
                { value: '#002419', label: '#002419' },
                { value: '#002420', label: '#002420' },
                { value: '#002421', label: '#002421' },
                { value: '#002422', label: '#002422' },
                { value: '#002423', label: '#002423' },
                { value: '#002424', label: '#002424' },
                { value: '#002425', label: '#002425' },
                { value: '#002426', label: '#002426' },
                { value: '#002427', label: '#002427' },
                { value: '#002428', label: '#002428' },
                { value: '#002429', label: '#002429' },
                { value: '#002430', label: '#002430' },
                { value: '#002431', label: '#002431' },
                { value: '#002432', label: '#002432' },
                { value: '#002433', label: '#002433' },
                { value: '#002434', label: '#002434' },
                { value: '#002435', label: '#002435' },
                { value: '#002436', label: '#002436' },
                { value: '#002437', label: '#002437' },
                { value: '#002438', label: '#002438' },
                { value: '#002439', label: '#002439' },
                { value: '#002440', label: '#002440' },
                { value: '#002441', label: '#002441' },
                { value: '#002442', label: '#002442' },
                { value: '#002443', label: '#002443' },
                { value: '#002444', label: '#002444' },
                { value: '#002445', label: '#002445' },
                { value: '#002446', label: '#002446' },
                { value: '#002447', label: '#002447' },
                { value: '#002448', label: '#002448' },
                { value: '#002449', label: '#002449' },
                { value: '#002450', label: '#002450' },
                { value: '#002451', label: '#002451' },
                { value: '#002452', label: '#002452' },
                { value: '#002453', label: '#002453' },
                { value: '#002454', label: '#002454' },
                { value: '#002455', label: '#002455' },
                { value: '#002456', label: '#002456' },
                { value: '#002457', label: '#002457' },
                { value: '#002458', label: '#002458' },
                { value: '#002459', label: '#002459' },
                { value: '#002460', label: '#002460' },
                { value: '#002461', label: '#002461' },
                { value: '#002462', label: '#002462' },
                { value: '#002463', label: '#002463' },
                { value: '#002464', label: '#002464' },
                { value: '#002465', label: '#002465' },
                { value: '#002466', label: '#002466' },
                { value: '#002467', label: '#002467' },
                { value: '#002468', label: '#002468' },
                { value: '#002469', label: '#002469' },
                { value: '#002470', label: '#002470' },
                { value: '#002471', label: '#002471' },
                { value: '#002472', label: '#002472' },
                { value: '#002473', label: '#002473' },
                { value: '#002474', label: '#002474' },
                { value: '#002475', label: '#002475' },
                { value: '#002476', label: '#002476' },
                { value: '#002477', label: '#002477' },
                { value: '#002478', label: '#002478' },
                { value: '#002479', label: '#002479' },
                { value: '#002480', label: '#002480' },
                { value: '#002481', label: '#002481' },
                { value: '#002482', label: '#002482' },
                { value: '#002483', label: '#002483' },
                { value: '#002484', label: '#002484' },
                { value: '#002485', label: '#002485' },
                { value: '#002486', label: '#002486' },
                { value: '#002487', label: '#002487' },
                { value: '#002488', label: '#002488' },
                { value: '#002489', label: '#002489' },
                { value: '#002490', label: '#002490' },
                { value: '#002491', label: '#002491' },
                { value: '#002492', label: '#002492' },
                { value: '#002493', label: '#002493' },
                { value: '#002494', label: '#002494' },
                { value: '#002495', label: '#002495' },
                { value: '#002496', label: '#002496' },
                { value: '#002497', label: '#002497' },
                { value: '#002498', label: '#002498' },
                { value: '#002499', label: '#002499' },
                { value: '#002500', label: '#002500' },
              ]}
            />
          </Form.Item>
          
          <Form.Item
            label="Booking #"
            name="bookingNumber"
          >
            <Select
              placeholder="Select booking"
              showSearch
              allowClear
              options={[
                { value: '#000025', label: '#000025' },
                { value: '#030723', label: '#030723' },
                { value: '#123456', label: '#123456' },
              ]}
            />
          </Form.Item>
          
          <Form.Item
            label={
              <span>
                Expected Ship Date <span style={{ color: 'red' }}>*</span>
              </span>
            }
            name="expectedShipDate"
            rules={[{ required: true, message: 'Please select expected ship date' }]}
            required={false}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="Select expected ship date"
            />
          </Form.Item>
          
          <Form.Item
            label={
              <span>
                Facility <span style={{ color: 'red' }}>*</span>
              </span>
            }
            name="facility"
            rules={[{ required: true, message: 'Please select facility' }]}
            required={false}
          >
            <Select
              placeholder="Select facility"
              options={[
                { value: 'ReMatter Headquarters', label: 'ReMatter Headquarters' },
                { value: 'ReMatter Ohio', label: 'ReMatter Ohio' },
                { value: 'ReMatter San Diego', label: 'ReMatter San Diego' },
              ]}
            />
          </Form.Item>
        </div>
      </div>

      {/* Shipping Carrier Information Section */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>Shipping Carrier Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0px 12px' }}>
          <Form.Item
            label="Shipping Carrier Name"
            name="shippingCarrier"
          >
            <Select
              placeholder="Select carrier"
              options={[
                { value: 'Shipment and Co.', label: 'Shipment and Co.' },
                { value: 'ShipSmart Headquarters', label: 'ShipSmart Headquarters' },
              ]}
            />
          </Form.Item>
          
          <Form.Item
            label="SCAC"
            name="scac"
          >
            <Input placeholder="Enter SCAC" />
          </Form.Item>
          
          <Form.Item
            label="Freight Forwarder"
            name="freightForwarder"
          >
            <Input placeholder="Enter freight forwarder" />
          </Form.Item>
          
          <Form.Item
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  Truck Freight
                </span>
                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'normal' }}>per container</span>
              </div>
            }
            name="truckFreight"
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="0.00"
              prefix="$"
              precision={2}
            />
          </Form.Item>
          
          <Form.Item
            label="Delivery #"
            name="deliveryNumber"
          >
            <Input placeholder="Enter delivery number" />
          </Form.Item>
          
          <Form.Item
            label="Release #"
            name="releaseNumber"
          >
            <Input placeholder="Enter release number" />
          </Form.Item>
          
          <Form.Item
            label="Booking #"
            name="bookingNumber2"
          >
            <Input placeholder="Enter booking number" />
          </Form.Item>
          
          <Form.Item
            label="Driver Name"
            name="driverName"
          >
            <Select
              placeholder="Select driver"
              options={[
                { value: 'Oliver Smith', label: 'Oliver Smith' },
                { value: 'John Doe', label: 'John Doe' },
              ]}
            />
          </Form.Item>
          
          <Form.Item
            label="Truck #"
            name="truckNumber"
          >
            <Input placeholder="Enter truck number" />
          </Form.Item>
          
          <Form.Item
            label="Trailer #"
            name="trailerNumber"
          >
            <Input placeholder="Enter trailer number" />
          </Form.Item>
          
          <Form.Item
            label="Container #"
            name="containerNumber"
          >
            <Input placeholder="Enter container number" />
          </Form.Item>
          
          <Form.Item
            label="Seal #"
            name="sealNumber"
          >
            <Input placeholder="Enter seal number" />
          </Form.Item>
        </div>
      </div>

    </Form>
  )

  const renderMaterialsContent = () => {
    if (materials.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <FileText size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              No materials added yet
            </h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
              Add materials to this load to track what's being shipped
            </p>
          </div>
          <Button 
            type="primary" 
            icon={<Plus size={16} />}
            onClick={() => setMaterials([{ id: 1 }])}
          >
            Add Material
          </Button>
        </div>
      )
    }

    return (
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Load Materials</h2>
          <div style={{ display: 'flex', gap: '6px' }}>
            {/* Weight Mode Toggle */}
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

            {/* Request/Stage Toggle */}
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
                <Monitor size={14} />
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
                <Weight size={14} />
                Stage
              </button>
            </div>
          </div>
        </div>

        <p>Materials table will go here...</p>
      </div>
    )
  }

  const renderPhotosContent = () => (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Upload size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
          No photos uploaded yet
        </h3>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
          Upload photos to document the load condition and contents
        </p>
      </div>
      <Button type="primary" icon={<Upload size={16} />}>
        Upload Photos
      </Button>
    </div>
  )

  const renderDocumentsContent = () => (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <FileText size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
          No documents uploaded yet
        </h3>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
          Upload documents like bills of lading, certificates, or other paperwork
        </p>
      </div>
      <Button type="primary" icon={<Upload size={16} />}>
        Upload Documents
      </Button>
    </div>
  )

  const renderNotesContent = () => (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <StickyNote size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
          No notes added yet
        </h3>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
          Add notes to track important information about this load
        </p>
      </div>
      <Button type="primary" icon={<Plus size={16} />}>
        Add Note
      </Button>
    </div>
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Unassigned':
        return { color: '#6b7280', bgColor: '#f3f4f6' }
      case 'Open':
        return { color: '#1d4ed8', bgColor: '#dbeafe' }
      case 'Shipped':
        return { color: '#ea580c', bgColor: '#fed7aa' }
      case 'Closed':
        return { color: '#16a34a', bgColor: '#dcfce7' }
      case 'Voided':
        return { color: '#dc2626', bgColor: '#fecaca' }
      default:
        return { color: '#6b7280', bgColor: '#f3f4f6' }
    }
  }

  if (!loadData) {
    return <div>Loading...</div>
  }

  const statusColors = getStatusColor(loadData.status)

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
                  {loadData.relatedSO && (
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>
                      SO {loadData.relatedSO}
                    </span>
                  )}
                  {loadData.bookingNumber && (
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>
                      BK {loadData.bookingNumber}
                    </span>
                  )}
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>
                    Created on {loadData.createdOn} by {loadData.createdBy}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                danger
                icon={<Trash2 size={16} />}
              >
                Void
              </Button>
              {loadData.status === 'Open' && (
                <Button type="primary">
                  Mark as Shipped
                </Button>
              )}
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
                  Materials <Tag style={{ marginLeft: '8px', fontSize: '10px' }}>{loadData.materialsCount || 0}</Tag>
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
        {renderTabContent()}
      </div>

      {/* Bottom Action Buttons */}
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
          alignItems: 'center',
          gap: '12px',
          zIndex: 1000
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
