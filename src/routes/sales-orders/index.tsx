import { Table, Button, Tag, Input, Select, Checkbox, Dropdown, Menu } from 'antd'
import { SearchOutlined, MoreOutlined } from '@ant-design/icons'
import { useState, useMemo } from 'react'
import { useLocation } from 'wouter'
import { CreateSalesOrderModal } from '../../components/CreateSalesOrderModal'
import { 
  Copy, 
  Plus, 
  Printer, 
  Download, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Trash2 
} from 'lucide-react'
import { generateSOData, facilities, customers, accountReps, statuses } from '../../utils/mockData'

export const SalesOrders = () => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [, setLocation] = useLocation()
  const [searchText, setSearchText] = useState('')
  const [selectedFacility, setSelectedFacility] = useState<string | undefined>(undefined)

  // Handle row click to navigate to SO detail page
  const handleRowClick = (record: any) => {
    console.log('Row clicked:', record.soNumber)
    console.log('About to navigate to /sales-order/' + record.soNumber)
    setLocation('/sales-order/' + record.soNumber)
    console.log('Navigation called')
  }

  // Generate contextual menu items based on SO status
  const getMenuItems = (status: string) => {
    const baseItems = [
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
        key: 'printShipping',
        label: 'Print Shipping Summary',
        icon: <Printer size={16} />,
        onClick: () => console.log('Print Shipping Summary')
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
        return [baseItems.find(item => item.key === 'void')!]
      
      case 'Shipped':
        return [
          baseItems.find(item => item.key === 'clone')!,
          baseItems.find(item => item.key === 'createLoad')!,
          baseItems.find(item => item.key === 'printSO')!,
          baseItems.find(item => item.key === 'downloadShipping')!,
          baseItems.find(item => item.key === 'markOpen')!,
          baseItems.find(item => item.key === 'closeSO')!,
          baseItems.find(item => item.key === 'void')!
        ]
      
      case 'Open':
        return [
          baseItems.find(item => item.key === 'clone')!,
          baseItems.find(item => item.key === 'createLoad')!,
          baseItems.find(item => item.key === 'printSO')!,
          baseItems.find(item => item.key === 'downloadShipping')!,
          baseItems.find(item => item.key === 'markShipped')!,
          baseItems.find(item => item.key === 'closeSO')!,
          baseItems.find(item => item.key === 'void')!
        ]
      
      case 'Closed':
        return [
          baseItems.find(item => item.key === 'clone')!,
          baseItems.find(item => item.key === 'revertOpen')!,
          baseItems.find(item => item.key === 'printSO')!,
          baseItems.find(item => item.key === 'downloadShipping')!
        ]
      
      case 'Voided':
        return [
          baseItems.find(item => item.key === 'revertOpen')!,
          baseItems.find(item => item.key === 'printSO')!,
          baseItems.find(item => item.key === 'downloadShipping')!
        ]
      
      default:
        return []
    }
  }
  const columns = [
    {
      title: '',
      key: 'checkbox',
      width: 50,
      render: () => (
        <Checkbox 
          onClick={(e) => {
            e.stopPropagation() // Prevent row click when clicking on checkbox
          }}
        />
      ),
    },
    {
      title: 'SO #',
      dataIndex: 'soNumber',
      key: 'soNumber',
      width: 100,
      render: (text: string) => <span style={{ fontWeight: 'bold' }}>#{text}</span>,
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
    },
    {
      title: 'Counterpart...',
      dataIndex: 'counterpart',
      key: 'counterpart',
      width: 150,
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      width: 200,
    },
    {
      title: 'Facility',
      dataIndex: 'facility',
      key: 'facility',
      width: 150,
    },
    {
      title: '# of Materials',
      dataIndex: 'materialsCount',
      key: 'materialsCount',
      width: 120,
    },
    {
      title: 'Net Weight',
      dataIndex: 'netWeight',
      key: 'netWeight',
      width: 120,
    },
    {
      title: 'Shipped Loa...',
      dataIndex: 'shippedLoads',
      key: 'shippedLoads',
      width: 120,
    },
    {
      title: 'Fulfilled %',
      dataIndex: 'fulfilledPercent',
      key: 'fulfilledPercent',
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const color = status === 'Open' ? 'blue' : 
                     status === 'Closed' ? 'green' : 
                     status === 'Shipped' ? 'orange' : 
                     status === 'Draft' ? 'default' : 'red'
        return <Tag color={color}>{status}</Tag>
      },
    },
    {
      title: 'Total (USD)',
      dataIndex: 'total',
      key: 'total',
      width: 120,
      render: (total: number) => total ? `$${total.toLocaleString()}` : '$ Text',
    },
    {
      title: 'Created on',
      dataIndex: 'createdOn',
      key: 'createdOn',
      width: 120,
    },
    {
      title: 'Created by',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 150,
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, record) => (
        <Dropdown
          menu={{ 
            items: getMenuItems(record.status),
            style: { borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }
          }}
          trigger={['click']}
          placement="bottomRight"
        >
          <MoreOutlined 
            style={{ 
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            onClick={(e) => {
              e.stopPropagation() // Prevent row click when clicking on more icon
            }}
          />
        </Dropdown>
      ),
    },
  ]

  // Generate 50 fixed sales order rows using consistent data generation (memoized)
  const data = useMemo(() => {
    return Array.from({ length: 50 }, (_, index) => {
      const soNumber = String(860098 - index).padStart(6, '0')
      const soData = generateSOData(soNumber)
      
      // Use consistent data from generateSOData for table fields
      const materialsCount = soData.materials.length
      const netWeight = soData.materials.reduce((sum, material) => sum + material.netWeight, 0)
      const shippedLoads = soData.status === 'Closed' ? materialsCount : Math.floor(materialsCount * 0.6) // 60% shipped for non-closed
      const fulfilledPercent = soData.status === 'Closed' ? '100%' : `${Math.floor((shippedLoads / materialsCount) * 100)}%`
      const total = soData.materials.reduce((sum, material) => sum + material.estimatedTotal, 0)
      
      return {
        key: String(index + 1),
        soNumber,
      startDate: new Date(soData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      endDate: new Date(soData.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        counterpart: soData.counterpartPO,
        customer: soData.customerName,
        facility: soData.facility,
        materialsCount,
        netWeight: `${netWeight.toLocaleString()} lb`,
        shippedLoads,
        fulfilledPercent,
        status: soData.status,
        total: total > 0 ? total : null,
        createdOn: new Date(soData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        createdBy: soData.accountRep,
      }
    })
  }, []) // Empty dependency array ensures this only runs once

  // Filter data based on search text and facility
  const filteredData = useMemo(() => {
    return data.filter(record => {
      const matchesSearch = !searchText || 
        record.soNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        record.customer.toLowerCase().includes(searchText.toLowerCase()) ||
        record.counterpart.toLowerCase().includes(searchText.toLowerCase())
      
      const matchesFacility = !selectedFacility || record.facility === selectedFacility
      
      return matchesSearch && matchesFacility
    })
  }, [data, searchText, selectedFacility])

  return (
    <div style={{ padding: '24px', background: '#F8F8F9', minHeight: '100vh' }}>
      {/* Sticky Header Section */}
      <div style={{ 
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: '#F8F8F9',
        paddingBottom: '10px',
        marginBottom: '10px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Input
              placeholder="Search"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Select
              placeholder="All Facilities"
              style={{ width: 180 }}
              value={selectedFacility}
              onChange={setSelectedFacility}
              allowClear
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
          </div>
          
          <Button 
            type="primary" 
            style={{ background: '#3b82f6', border: 'none' }}
            onClick={() => setIsModalVisible(true)}
          >
            Create Sales Order
          </Button>
        </div>
      </div>

              {/* Table with sticky header */}
              <div 
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  height: 'calc(100vh - 200px)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onWheel={(e) => {
                  // Enable horizontal scrolling only with mouse side wheel (deltaX)
                  // Don't interfere with vertical scrolling (deltaY)
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
                  columns={columns}
                  dataSource={filteredData}
                  pagination={{
                    pageSize: 50,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `Total ${total} items`,
                    pageSizeOptions: ['50', '100', '200'],
                  }}
                  scroll={{ x: 1500, y: 'calc(100vh - 280px)' }}
                  sticky={{ offsetHeader: 0 }}
                  style={{
                    background: '#fff',
                    flex: 1,
                    height: '100%'
                  }}
                  onRow={(record) => ({
                    onClick: () => handleRowClick(record),
                    style: { cursor: 'pointer' }
                  })}
                />
              </div>

      <CreateSalesOrderModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      />
    </div>
  )
}
