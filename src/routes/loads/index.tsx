import { Table, Button, Input, Select, Dropdown, Modal, Form, DatePicker } from 'antd'
import { MoreOutlined } from '@ant-design/icons'
import { useState, useMemo } from 'react'
import { FileText, Ship, CheckCircle, RotateCcw, Printer, Trash2 } from 'lucide-react'
import { useLocation } from 'wouter'
import dayjs from 'dayjs'
import { generateAllLoadsData } from '../../utils/mockData'

export const Loads = () => {
  
  // Generate 50 fixed loads using memoized data generation
  const allData = useMemo(() => {
    const sharedData = generateAllLoadsData()
    // Transform shared data to match table structure
    return sharedData.map((load, index) => ({
      key: String(index),
      orderNumber: load.loadNumber,
      expectedShipDate: new Date(load.expectedShipDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      facility: load.facility,
      relatedSO: load.relatedSO || '',
      bookingNumber: load.bookingNumber || '',
      shippingCarrier: load.shippingCarrier,
      customer: load.customer,
      materialsCount: load.materialsCount,
      netWeight: load.netWeight,
      status: load.status,
      createdOn: load.createdOn,
      createdBy: load.createdBy,
      // Add missing fields for table compatibility
      salesNumber: load.relatedSO || `#${String(2000 + index).padStart(6, '0')}`,
      containerNumber: `#${String(400000 + index).padStart(6, '0')}`,
      releaseNumber: `#${String(500000 + index).padStart(6, '0')}`
    }))
  }, [])
  
  // Filter states
  const [searchText, setSearchText] = useState('')
  const [selectedFacility, setSelectedFacility] = useState<string | undefined>()
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>()
  
  // Modal states
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [, setLocation] = useLocation()
  
  // Filter the data based on search and filters (memoized)
  const filteredData = useMemo(() => {
    return allData.filter(load => {
      const matchesSearch = !searchText || 
        load.orderNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        load.salesNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        load.customer.toLowerCase().includes(searchText.toLowerCase()) ||
        load.shippingCarrier.toLowerCase().includes(searchText.toLowerCase())
      
      const matchesFacility = !selectedFacility || load.facility === selectedFacility
      const matchesStatus = !selectedStatus || selectedStatus === 'all' || load.status === selectedStatus
      
      return matchesSearch && matchesFacility && matchesStatus
    })
  }, [allData, searchText, selectedFacility, selectedStatus])
  
  // Handle row click to navigate to Load detail page
  const handleRowClick = (record: any) => {
    console.log('Load row clicked:', record.orderNumber)
    const loadId = record.orderNumber.replace('#', '')
    console.log('Navigating to load ID:', loadId)
    setLocation(`/load/${loadId}`)
  }

  // Handle create load
  const handleCreateLoad = () => {
    form.validateFields().then((values) => {
      console.log('Create Load:', values)
      // Generate a new load number (use timestamp for uniqueness)
      const loadNumber = String(860000 + Date.now() % 1000).padStart(6, '0')
      
      // Store the load data for the detail page
      const loadData = {
        loadNumber: `#${loadNumber}`,
        expectedShipDate: values.expectedShipDate,
        facility: values.facility,
        relatedSO: values.relatedSO,
        bookingNumber: values.bookingNumber,
        status: values.relatedSO ? 'Open' : 'Unassigned',
        createdBy: 'John Smith', // Mock creator
        createdOn: dayjs().format('MMM YYYY'),
        // Keep modal data but leave shipping carrier fields empty
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
        notes: '',
        materialsCount: 0,
        photosCount: 0
      }
      
      localStorage.setItem(`load-form-data-${loadNumber}`, JSON.stringify(loadData))
      
      // Navigate to the load detail page
      setLocation(`/load/${loadNumber}`)
      
      setIsCreateModalVisible(false)
      form.resetFields()
    }).catch((errorInfo) => {
      console.log('Validation failed:', errorInfo)
    })
  }
  
  const handleCancelCreate = () => {
    setIsCreateModalVisible(false)
    form.resetFields()
  }

  const columns = [
    {
      title: 'Expected Ship Date',
      dataIndex: 'expectedShipDate',
      key: 'expectedShipDate',
    },
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: 'Sales #',
      dataIndex: 'salesNumber',
      key: 'salesNumber',
    },
    {
      title: 'Booking #',
      dataIndex: 'bookingNumber',
      key: 'bookingNumber',
    },
    {
      title: 'Container #',
      dataIndex: 'containerNumber',
      key: 'containerNumber',
    },
    {
      title: 'Release #',
      dataIndex: 'releaseNumber',
      key: 'releaseNumber',
    },
    {
      title: 'Shipping Carrier',
      dataIndex: 'shippingCarrier',
      key: 'shippingCarrier',
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Facility',
      dataIndex: 'facility',
      key: 'facility',
    },
    {
      title: '# of Materials',
      dataIndex: 'materialsCount',
      key: 'materialsCount',
    },
    {
      title: 'Net Weight',
      dataIndex: 'netWeight',
      key: 'netWeight',
      render: (weight: number) => `${weight.toLocaleString()} lb`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (status: string) => {
        let color = '#6b7280' // default grey
        let bgColor = '#f3f4f6'
        
        if (status === 'Unassigned') {
          color = '#6b7280'
          bgColor = '#f3f4f6'
        } else if (status === 'Open') {
          color = '#1d4ed8'
          bgColor = '#dbeafe'
        } else if (status === 'Shipped') {
          color = '#ea580c'
          bgColor = '#fed7aa'
        } else if (status === 'Closed') {
          color = '#16a34a'
          bgColor = '#dcfce7'
        } else if (status === 'Voided') {
          color = '#dc2626'
          bgColor = '#fecaca'
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
      }
    },
    {
      title: 'Created on',
      dataIndex: 'createdOn',
      key: 'createdOn',
    },
    {
      title: 'Created by',
      dataIndex: 'createdBy',
      key: 'createdBy',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => {
        const getMenuItems = (status: string) => {
          switch (status) {
            case 'Unassigned':
              return [
                {
                  key: 'assign-so',
                  label: 'Assign SO',
                  icon: <FileText size={16} />,
                },
                {
                  key: 'assign-booking',
                  label: 'Assign Booking',
                  icon: <FileText size={16} />,
                },
                {
                  key: 'void',
                  label: 'Void Load',
                  icon: <Trash2 size={16} />,
                  danger: true,
                },
              ]
            
            case 'Open':
              return [
                {
                  key: 'mark-shipped',
                  label: 'Mark as Shipped',
                  icon: <CheckCircle size={16} />,
                },
                {
                  key: 'print-packing',
                  label: 'Print Packing List',
                  icon: <Printer size={16} />,
                },
                {
                  key: 'print-bol',
                  label: 'Print Bill of Lading',
                  icon: <Printer size={16} />,
                },
                {
                  key: 'reassign-so',
                  label: 'Reassign SO',
                  icon: <FileText size={16} />,
                },
                {
                  key: 'reassign-booking',
                  label: 'Reassign Booking',
                  icon: <FileText size={16} />,
                },
                {
                  key: 'void',
                  label: 'Void Load',
                  icon: <Trash2 size={16} />,
                  danger: true,
                },
              ]
            
            case 'Shipped':
              return [
                {
                  key: 'mark-received',
                  label: 'Mark as Received',
                  icon: <CheckCircle size={16} />,
                },
                {
                  key: 'revert-open',
                  label: 'Revert to Open',
                  icon: <RotateCcw size={16} />,
                },
                {
                  key: 'print-packing',
                  label: 'Print Packing List',
                  icon: <Printer size={16} />,
                },
                {
                  key: 'print-bol',
                  label: 'Print Bill of Lading',
                  icon: <Printer size={16} />,
                },
                {
                  key: 'print-invoice',
                  label: 'Print Invoice',
                  icon: <Printer size={16} />,
                },
                {
                  key: 'reassign-so',
                  label: 'Reassign SO',
                  icon: <FileText size={16} />,
                },
                {
                  key: 'reassign-booking',
                  label: 'Reassign Booking',
                  icon: <FileText size={16} />,
                },
                {
                  key: 'void',
                  label: 'Void Load',
                  icon: <Trash2 size={16} />,
                  danger: true,
                },
              ]
            
            case 'Pending Reconciliation':
              return [
                {
                  key: 'mark-reconciled',
                  label: 'Mark as Reconciled',
                  icon: <CheckCircle size={16} />,
                },
                {
                  key: 'revert-shipped',
                  label: 'Revert to Shipped',
                  icon: <RotateCcw size={16} />,
                },
                {
                  key: 'print-packing',
                  label: 'Print Packing List',
                  icon: <Printer size={16} />,
                },
                {
                  key: 'print-bol',
                  label: 'Print Bill of Lading',
                  icon: <Printer size={16} />,
                },
                {
                  key: 'print-invoice',
                  label: 'Print Invoice',
                  icon: <Printer size={16} />,
                },
                {
                  key: 'reassign-so',
                  label: 'Reassign SO',
                  icon: <FileText size={16} />,
                },
                {
                  key: 'reassign-booking',
                  label: 'Reassign Booking',
                  icon: <FileText size={16} />,
                },
              ]
            
            case 'Reconciled':
              return [
                {
                  key: 'mark-closed',
                  label: 'Mark as Closed',
                  icon: <CheckCircle size={16} />,
                },
                {
                  key: 'revert-pending',
                  label: 'Revert to Pending Reconciliation',
                  icon: <RotateCcw size={16} />,
                },
                {
                  key: 'print-packing',
                  label: 'Print Packing List',
                  icon: <Printer size={16} />,
                },
                {
                  key: 'print-bol',
                  label: 'Print Bill of Lading',
                  icon: <Printer size={16} />,
                },
                {
                  key: 'print-invoice',
                  label: 'Print Invoice',
                  icon: <Printer size={16} />,
                },
                {
                  key: 'reassign-so',
                  label: 'Reassign SO',
                  icon: <FileText size={16} />,
                },
                {
                  key: 'reassign-booking',
                  label: 'Reassign Booking',
                  icon: <FileText size={16} />,
                },
              ]
            
            case 'Closed':
              return [
                {
                  key: 'print-packing',
                  label: 'Print Packing List',
                  icon: <Printer size={16} />,
                },
                {
                  key: 'print-bol',
                  label: 'Print Bill of Lading',
                  icon: <Printer size={16} />,
                },
                {
                  key: 'print-invoice',
                  label: 'Print Invoice',
                  icon: <Printer size={16} />,
                },
                {
                  key: 'revert-reconciled',
                  label: 'Revert to Reconciled',
                  icon: <RotateCcw size={16} />,
                },
              ]
            
            case 'Voided':
              return [
                {
                  key: 'revert-open',
                  label: 'Revert to Open',
                  icon: <RotateCcw size={16} />,
                },
                {
                  key: 'print-packing',
                  label: 'Print Packing List',
                  icon: <Printer size={16} />,
                },
                {
                  key: 'print-bol',
                  label: 'Print Bill of Lading',
                  icon: <Printer size={16} />,
                },
                {
                  key: 'print-invoice',
                  label: 'Print Invoice',
                  icon: <Printer size={16} />,
                },
              ]
            
            default:
              return [
                {
                  key: 'edit',
                  label: 'Edit Load',
                  icon: <FileText size={16} />,
                },
                {
                  key: 'void',
                  label: 'Void Load',
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
                console.log(`Action clicked: ${key} for load ${record.orderNumber}`)
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
      {/* Fixed Header with search and CTA */}
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
              { value: 'ReMatter Headquarters', label: 'ReMatter Headquarters' },
              { value: 'ReMatter Ohio', label: 'ReMatter Ohio' },
              { value: 'ReMatter San Diego', label: 'ReMatter San Diego' },
              { value: 'ReMatter Los Angeles', label: 'ReMatter Los Angeles' },
              { value: 'ReMatter Texas', label: 'ReMatter Texas' },
              { value: 'ReMatter Newport Beach', label: 'ReMatter Newport Beach' },
              { value: 'ReMatter SantaMonica', label: 'ReMatter SantaMonica' },
              { value: 'ReMatter Lake Tahoe', label: 'ReMatter Lake Tahoe' },
              { value: 'ReMatter Denver', label: 'ReMatter Denver' },
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
              { value: 'Unassigned', label: 'Unassigned' },
              { value: 'Open', label: 'Open' },
              { value: 'Shipped', label: 'Shipped' },
              { value: 'Pending Reconciliation', label: 'Pending Reconciliation' },
              { value: 'Reconciled', label: 'Reconciled' },
              { value: 'Closed', label: 'Closed' },
              { value: 'Voided', label: 'Voided' },
            ]}
          />
        </div>
        
        <Button 
          type="primary"
          style={{ background: '#3b82f6', border: 'none' }}
          onClick={() => setIsCreateModalVisible(true)}
        >
          Create Load
        </Button>
      </div>

      {/* Scrollable Table Container */}
      <div style={{
        background: '#fff',
        border: '1px solid #d1d5db',
        borderRadius: '10px',
        overflow: 'hidden',
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
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} loads`
          }}
          size="small"
          scroll={{ 
            x: 1500,
            y: 'calc(100vh - 200px)' // Fixed height for vertical scroll
          }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' }
          })}
        />
      </div>
      
      {/* Create Load Modal */}
      <Modal
        title="Create Load"
        open={isCreateModalVisible}
        onOk={handleCreateLoad}
        onCancel={handleCancelCreate}
        okText="Create Load"
        cancelText="Cancel"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            label={
              <span>
                Expected Ship Date <span style={{ color: 'red' }}>*</span>
              </span>
            }
            name="expectedShipDate"
            rules={[{ required: true, message: 'Please select expected ship date' }]}
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
          >
            <Select
              placeholder="Select facility"
              options={[
                { value: 'ReMatter Headquarters', label: 'ReMatter Headquarters' },
                { value: 'ReMatter Ohio', label: 'ReMatter Ohio' },
                { value: 'ReMatter San Diego', label: 'ReMatter San Diego' },
                { value: 'ReMatter Los Angeles', label: 'ReMatter Los Angeles' },
                { value: 'ReMatter Texas', label: 'ReMatter Texas' },
                { value: 'ReMatter Newport Beach', label: 'ReMatter Newport Beach' },
                { value: 'ReMatter SantaMonica', label: 'ReMatter SantaMonica' },
                { value: 'ReMatter Lake Tahoe', label: 'ReMatter Lake Tahoe' },
                { value: 'ReMatter Denver', label: 'ReMatter Denver' },
              ]}
            />
          </Form.Item>
          
          <Form.Item
            label="Related SO#"
            name="relatedSO"
          >
            <Select
              placeholder="Select related sales order"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={[
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
              ]}
            />
          </Form.Item>
          
          <Form.Item
            label="Booking#"
            name="bookingNumber"
          >
            <Select
              placeholder="Select booking number"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={[
                { value: '#030723', label: '#030723' },
                { value: '#123456', label: '#123456' },
                { value: '#654321', label: '#654321' },
                { value: '#789012', label: '#789012' },
                { value: '#345678', label: '#345678' },
                { value: '#901234', label: '#901234' },
                { value: '#567890', label: '#567890' },
                { value: '#234567', label: '#234567' },
                { value: '#890123', label: '#890123' },
                { value: '#456789', label: '#456789' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}