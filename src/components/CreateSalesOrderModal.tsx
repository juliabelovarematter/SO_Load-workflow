import { Button, Input, Select, DatePicker, Checkbox, Upload, Form } from 'antd'
import { useState, useEffect } from 'react'
import { X, Calendar, Upload as UploadIcon, ChevronDown } from 'lucide-react'
import { useLocation } from 'wouter'

const { Option } = Select
const { Dragger } = Upload

interface CreateSalesOrderModalProps {
  visible: boolean
  onClose: () => void
}

export const CreateSalesOrderModal = ({ visible, onClose }: CreateSalesOrderModalProps) => {
  const [form] = Form.useForm()
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({})
  const [sameAsShip, setSameAsShip] = useState(false)
  const [, setLocation] = useLocation()


  if (!visible) return null

  const handleShipToLocationChange = (value: string) => {
    // Clear validation error for this field
    handleFieldChange('shipToLocation')
    
    // If "Same as ship" is checked, update bill to location
    if (sameAsShip) {
      form.setFieldsValue({ billToLocation: value })
    }
  }

  const handleSameAsShipChange = (checked: boolean) => {
    setSameAsShip(checked)
    
    if (checked) {
      // Copy ship to location value to bill to location
      const shipToLocationValue = form.getFieldValue('shipToLocation')
      if (shipToLocationValue) {
        form.setFieldsValue({ billToLocation: shipToLocationValue })
      }
    }
  }

  const handleCreate = () => {
    const values = form.getFieldsValue()
    
    // Check required fields
    const requiredFields = [
      'salesOrderNumber',
      'facility', 
      'startDate',
      'customerName',
      'shipToLocation',
      'billToLocation',
      'paymentCurrency'
    ]
    
    const errors: Record<string, boolean> = {}
    let hasErrors = false
    
    requiredFields.forEach(field => {
      if (!values[field]) {
        errors[field] = true
        hasErrors = true
      }
    })
    
    setValidationErrors(errors)
    
    if (hasErrors) {
      return // Don't create if there are validation errors
    }
    
    // If all required fields are filled, create the sales order
    console.log('Creating Sales Order with values:', values)
    
    // Clear any existing materials for this SO number
    const soNumber = values.salesOrderNumber
    localStorage.removeItem(`so-materials-${soNumber}`)
    console.log('Cleared existing materials for SO:', soNumber)
    
    // Store the form data for the new SO
    localStorage.setItem(`so-form-data-${soNumber}`, JSON.stringify(values))
    console.log('Stored form data for new SO:', soNumber, values)
    
    // Navigate to the Sales Order Detail page
    console.log('About to navigate to: /sales-order/' + soNumber)
    setLocation(`/sales-order/${soNumber}`)
    console.log('Navigation called, closing modal')
    
    onClose()
  }

  const handleClose = () => {
    form.resetFields()
    setValidationErrors({})
    setSameAsShip(false)
    onClose()
  }

  const handleFieldChange = (fieldName: string) => {
    // Clear validation error for this field when user starts typing/selecting
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: false
      }))
    }
  }

  const uploadProps = {
    name: 'file',
    multiple: true,
    action: 'https://run.mocky.io/v3/435e224c-44fb-4773-9faf-380c5e6a2188',
    onChange(info: any) {
      console.log('Upload info:', info)
    },
  }

  return (
    <>
      {/* Full Screen Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--Colors-ReMatter-Semantic-Neutral-200, rgba(7, 20, 41, 0.20))',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
        }}
        onClick={handleClose}
      >
        {/* Centered Modal */}
        <div
          style={{
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            width: '800px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: '24px 24px 16px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
              Create Sales Order
            </h2>
            <Button
              type="text"
              icon={<X size={16} />}
              onClick={handleClose}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
              }}
            />
          </div>

          {/* Form Content */}
          <div style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
            <Form form={form} layout="vertical">
              {/* Contract Info Section */}
              <div style={{ marginBottom: '32px', marginTop: '16px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                  Contract Info
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Sales Order # <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <Form.Item name="salesOrderNumber" style={{ marginBottom: 0 }}>
                      <Input 
                        placeholder="Enter sales order number" 
                        status={validationErrors.salesOrderNumber ? 'error' : ''}
                        onChange={() => handleFieldChange('salesOrderNumber')}
                      />
                    </Form.Item>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Facility <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <Form.Item name="facility" style={{ marginBottom: 0 }}>
                      <Select 
                        placeholder="Select facility" 
                        style={{ width: '100%' }}
                        status={validationErrors.facility ? 'error' : ''}
                        onChange={() => handleFieldChange('facility')}
                        suffixIcon={<ChevronDown size={16} />}
                      >
                        <Option value="headquarters">ReMatter Headquarters</Option>
                        <Option value="ohio">ReMatter Ohio</Option>
                        <Option value="san-diego">ReMatter San Diego</Option>
                        <Option value="los-angeles">ReMatter Los Angeles</Option>
                        <Option value="texas">ReMatter Texas</Option>
                        <Option value="newport-beach">ReMatter Newport Beach</Option>
                        <Option value="santa-monica">ReMatter SantaMonica</Option>
                        <Option value="lake-tahoe">ReMatter Lake Tahoe</Option>
                        <Option value="denver">ReMatter Denver</Option>
                      </Select>
                    </Form.Item>
                  </div>
                </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Sales Order Start Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Form.Item name="startDate" style={{ marginBottom: 0 }}>
                    <DatePicker
                      style={{ width: '100%' }}
                      suffixIcon={<Calendar size={16} />}
                      placeholder="Select start date"
                      status={validationErrors.startDate ? 'error' : ''}
                      onChange={() => handleFieldChange('startDate')}
                    />
                  </Form.Item>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Sales Order End Date
                  </label>
                  <Form.Item name="endDate" style={{ marginBottom: 0 }}>
                    <DatePicker
                      style={{ width: '100%' }}
                      suffixIcon={<Calendar size={16} />}
                      placeholder="Select end date"
                      status={validationErrors.endDate ? 'error' : ''}
                      onChange={() => handleFieldChange('endDate')}
                    />
                  </Form.Item>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Account Representative
                  </label>
                  <Form.Item name="accountRepresentative" style={{ marginBottom: 0 }}>
                    <Select 
                      placeholder="Select account representative" 
                      style={{ width: '100%' }}
                      suffixIcon={<ChevronDown size={16} />}
                    >
                      <Option value="rep1">John Smith</Option>
                      <Option value="rep2">Michael Johnson</Option>
                      <Option value="rep3">David Williams</Option>
                      <Option value="rep4">Robert Brown</Option>
                      <Option value="rep5">James Davis</Option>
                      <Option value="rep6">William Miller</Option>
                      <Option value="rep7">Richard Wilson</Option>
                      <Option value="rep8">Charles Moore</Option>
                      <Option value="rep9">Thomas Taylor</Option>
                      <Option value="rep10">Christopher Anderson</Option>
                    </Select>
                  </Form.Item>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Counterparty Purchase Order #
                  </label>
                  <Form.Item name="counterpartyPO" style={{ marginBottom: 0 }}>
                    <Input placeholder="Enter counterparty PO number" />
                  </Form.Item>
                </div>
              </div>
            </div>

            {/* Customer Information Section */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                Customer Information
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ minWidth: 0 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Customer Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Form.Item name="customerName" style={{ marginBottom: 0 }}>
                    <Select 
                      placeholder="Select customer"
                      style={{ width: '100%', minWidth: 0 }}
                      status={validationErrors.customerName ? 'error' : ''}
                      onChange={() => handleFieldChange('customerName')}
                      suffixIcon={<ChevronDown size={16} />}
                      styles={{
                        selector: {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          minWidth: 0,
                        },
                      }}
                    >
                      <Option value="headquarters">ReMatter Headquarters</Option>
                      <Option value="customer1">Metro Scrap & Metal Co.</Option>
                      <Option value="customer2">Industrial Recycling Solutions</Option>
                      <Option value="customer3">Green Valley Salvage</Option>
                      <Option value="customer4">Premier Metal Works</Option>
                      <Option value="customer5">Allied Scrap Materials</Option>
                      <Option value="customer6">Eco-Friendly Recycling</Option>
                      <Option value="customer7">Central Metal Processing</Option>
                      <Option value="customer8">Advanced Scrap Technologies</Option>
                      <Option value="customer9">Sustainable Materials Group</Option>
                      <Option value="customer10">Progressive Metal Recovery</Option>
                    </Select>
                  </Form.Item>
                </div>
                <div style={{ minWidth: 0 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Contact
                  </label>
                  <Form.Item name="contact" style={{ marginBottom: 0 }}>
                    <Select 
                      placeholder="Select contact"
                      style={{ width: '100%', minWidth: 0 }}
                      suffixIcon={<ChevronDown size={16} />}
                      styles={{
                        selector: {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          minWidth: 0,
                        },
                      }}
                    >
                      <Option value="no-contact">No Contact</Option>
                      <Option value="contact1">Contact 1</Option>
                    </Select>
                  </Form.Item>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ minWidth: 0 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Ship to Location <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Form.Item name="shipToLocation" style={{ marginBottom: 0 }}>
                    <Select 
                      placeholder="Select ship to location"
                      style={{ width: '100%', minWidth: 0 }}
                      status={validationErrors.shipToLocation ? 'error' : ''}
                      onChange={handleShipToLocationChange}
                      suffixIcon={<ChevronDown size={16} />}
                      styles={{
                        selector: {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          minWidth: 0,
                        },
                      }}
                    >
                      <Option value="location1">Metro Scrap & Metal Co. - 1234 Industrial Blvd, Los Angeles, CA 90021</Option>
                      <Option value="location2">Industrial Recycling Solutions - 5678 Commerce St, San Diego, CA 92101</Option>
                      <Option value="location3">Green Valley Salvage - 9012 Valley Rd, Phoenix, AZ 85001</Option>
                      <Option value="location4">Premier Metal Works - 3456 Metal Ave, Houston, TX 77001</Option>
                      <Option value="location5">Allied Scrap Materials - 7890 Scrap Way, Denver, CO 80201</Option>
                      <Option value="location6">Eco-Friendly Recycling - 2468 Green St, Portland, OR 97201</Option>
                      <Option value="location7">Central Metal Processing - 1357 Central Ave, Chicago, IL 60601</Option>
                      <Option value="location8">Advanced Scrap Technologies - 9753 Tech Blvd, Austin, TX 78701</Option>
                      <Option value="location9">Sustainable Materials Group - 8642 Sustain Rd, Seattle, WA 98101</Option>
                      <Option value="location10">Progressive Metal Recovery - 1597 Progress St, Miami, FL 33101</Option>
                    </Select>
                  </Form.Item>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Bill to Location <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <Form.Item name="sameAsShip" valuePropName="checked" style={{ marginBottom: 0 }}>
                      <Checkbox 
                        checked={sameAsShip}
                        onChange={(e) => handleSameAsShipChange(e.target.checked)}
                      >
                        Same as ship
                      </Checkbox>
                    </Form.Item>
                  </div>
                  <Form.Item name="billToLocation" style={{ marginBottom: 0 }}>
                    <Select 
                      placeholder="Select bill to location"
                      style={{ width: '100%', minWidth: 0 }}
                      status={validationErrors.billToLocation ? 'error' : ''}
                      onChange={() => handleFieldChange('billToLocation')}
                      disabled={sameAsShip}
                      suffixIcon={<ChevronDown size={16} />}
                      styles={{
                        selector: {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          minWidth: 0,
                        },
                      }}
                    >
                      <Option value="location1">Metro Scrap & Metal Co. - 1234 Industrial Blvd, Los Angeles, CA 90021</Option>
                      <Option value="location2">Industrial Recycling Solutions - 5678 Commerce St, San Diego, CA 92101</Option>
                      <Option value="location3">Green Valley Salvage - 9012 Valley Rd, Phoenix, AZ 85001</Option>
                      <Option value="location4">Premier Metal Works - 3456 Metal Ave, Houston, TX 77001</Option>
                      <Option value="location5">Allied Scrap Materials - 7890 Scrap Way, Denver, CO 80201</Option>
                      <Option value="location6">Eco-Friendly Recycling - 2468 Green St, Portland, OR 97201</Option>
                      <Option value="location7">Central Metal Processing - 1357 Central Ave, Chicago, IL 60601</Option>
                      <Option value="location8">Advanced Scrap Technologies - 9753 Tech Blvd, Austin, TX 78701</Option>
                      <Option value="location9">Sustainable Materials Group - 8642 Sustain Rd, Seattle, WA 98101</Option>
                      <Option value="location10">Progressive Metal Recovery - 1597 Progress St, Miami, FL 33101</Option>
                    </Select>
                  </Form.Item>
                </div>
              </div>
            </div>

            {/* Payment Info Section */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                Payment Info
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Payment Currency <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Form.Item name="paymentCurrency" style={{ marginBottom: 0 }}>
                    <Select 
                      placeholder="Select payment currency" 
                      style={{ width: '100%' }}
                      status={validationErrors.paymentCurrency ? 'error' : ''}
                      onChange={() => handleFieldChange('paymentCurrency')}
                      suffixIcon={<ChevronDown size={16} />}
                    >
                      <Option value="usd">USD - United States Dollar</Option>
                      <Option value="eur">EUR - Euro</Option>
                      <Option value="gbp">GBP - British Pound</Option>
                    </Select>
                  </Form.Item>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Payment Term
                  </label>
                  <Form.Item name="paymentTerm" style={{ marginBottom: 0 }}>
                    <Select 
                      placeholder="Select payment term" 
                      style={{ width: '100%' }}
                      suffixIcon={<ChevronDown size={16} />}
                    >
                      <Option value="no-contact">No Contact</Option>
                      <Option value="net-30">Net 30</Option>
                      <Option value="net-60">Net 60</Option>
                    </Select>
                  </Form.Item>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Freight Term
                  </label>
                  <Form.Item name="freightTerm" style={{ marginBottom: 0 }}>
                    <Select 
                      placeholder="Select freight term" 
                      style={{ width: '100%' }}
                      suffixIcon={<ChevronDown size={16} />}
                    >
                      <Option value="no-contact">No Contact</Option>
                      <Option value="fob">FOB</Option>
                      <Option value="cif">CIF</Option>
                    </Select>
                  </Form.Item>
                </div>
                <div></div>
              </div>
            </div>

            {/* Other Info Section */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                Other Info
              </h3>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Files
                </label>
                <Form.Item name="files" style={{ marginBottom: 0 }}>
                  <Dragger {...uploadProps} style={{ width: '100%' }}>
                    <p className="ant-upload-drag-icon">
                      <UploadIcon size={48} style={{ color: '#1890ff' }} />
                    </p>
                    <p className="ant-upload-text">Click or drag file to this area to upload</p>
                    <p className="ant-upload-hint">
                      Support for single or bulk upload. Strictly prohibited from uploading company data or other
                      band files
                    </p>
                  </Dragger>
                </Form.Item>
              </div>
            </div>
            </Form>
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}>
            <Button onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              id="save-sales-order-btn"
              data-testid="save-so-btn"
              type="primary" 
              onClick={handleCreate}
              style={{ 
                background: '#3b82f6', 
                borderColor: '#3b82f6',
                fontWeight: '500'
              }}
            >
              Create Sales Order
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}