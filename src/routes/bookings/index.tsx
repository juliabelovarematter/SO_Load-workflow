import { Card, Table, Button, Space, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'

export const Bookings = () => {
  const columns = [
    {
      title: 'Booking ID',
      dataIndex: 'bookingId',
      key: 'bookingId',
      width: 120,
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      width: 200,
    },
    {
      title: 'Destination',
      dataIndex: 'destination',
      key: 'destination',
      width: 150,
    },
    {
      title: 'Material',
      dataIndex: 'material',
      key: 'material',
      width: 150,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (quantity: number) => `${quantity.toLocaleString()} MT`,
    },
    {
      title: 'Vessel',
      dataIndex: 'vessel',
      key: 'vessel',
      width: 120,
    },
    {
      title: 'ETD',
      dataIndex: 'etd',
      key: 'etd',
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const color = status === 'Booked' ? 'green' : status === 'Pending' ? 'orange' : status === 'Cancelled' ? 'red' : 'blue'
        return <Tag color={color}>{status}</Tag>
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: () => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} size="small" />
          <Button type="text" icon={<EditOutlined />} size="small" />
          <Button type="text" icon={<DeleteOutlined />} size="small" danger />
        </Space>
      ),
    },
  ]

  const data = [
    {
      key: '1',
      bookingId: 'BK-2024-001',
      customer: 'ABC Steel Corp',
      destination: 'Shanghai, China',
      material: 'Steel Scrap',
      quantity: 500,
      vessel: 'MV Ocean Star',
      etd: '2024-02-15',
      status: 'Booked',
    },
    {
      key: '2',
      bookingId: 'BK-2024-002',
      customer: 'XYZ Metals Ltd',
      destination: 'Hamburg, Germany',
      material: 'Aluminum Scrap',
      quantity: 300,
      vessel: 'MV Atlantic',
      etd: '2024-02-20',
      status: 'Pending',
    },
    {
      key: '3',
      bookingId: 'BK-2024-003',
      customer: 'Global Recycling',
      destination: 'Tokyo, Japan',
      material: 'Copper Scrap',
      quantity: 150,
      vessel: 'MV Pacific',
      etd: '2024-02-18',
      status: 'In Transit',
    },
    {
      key: '4',
      bookingId: 'BK-2024-004',
      customer: 'Metal Works Inc',
      destination: 'Rotterdam, Netherlands',
      material: 'Steel Scrap',
      quantity: 750,
      vessel: 'MV North Sea',
      etd: '2024-02-25',
      status: 'Booked',
    },
    {
      key: '5',
      bookingId: 'BK-2024-005',
      customer: 'Scrap Solutions',
      destination: 'Busan, South Korea',
      material: 'Iron Scrap',
      quantity: 400,
      vessel: 'MV Asia Pacific',
      etd: '2024-02-22',
      status: 'Cancelled',
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Bookings"
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            New Booking
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} bookings`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  )
}
