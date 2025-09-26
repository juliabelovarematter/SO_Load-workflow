import { Layout, Menu } from 'antd'
import { ShopOutlined } from '@ant-design/icons'
import { Link, useLocation } from 'wouter'
import { useState, useEffect } from 'react'
import { FileOutput, Ship, Container } from 'lucide-react'

const { Sider } = Layout

interface SideBarProps {
  collapsed: boolean
  // onCollapse: (collapsed: boolean) => void
}

export const SideBar = ({ collapsed }: SideBarProps) => {
  const [location] = useLocation()
  const [openKeys, setOpenKeys] = useState<string[]>([])

  useEffect(() => {
    if (location.startsWith('/sales-orders') || location.startsWith('/sales-order/') || 
        location.startsWith('/bookings') || location.startsWith('/booking/') ||
        location.startsWith('/loads') || location.startsWith('/load/')) {
      setOpenKeys(['trade'])
    } else {
      setOpenKeys([])
    }
  }, [location])

  const menuItems = [
    {
      key: 'trade',
      icon: <ShopOutlined />,
      label: 'Trade',
      children: [
        {
          key: '/sales-orders',
          icon: <FileOutput size={16} />,
          label: <Link href="/sales-orders">Sales Orders</Link>,
        },
        {
          key: '/bookings',
          icon: <Ship size={16} />,
          label: <Link href="/bookings">Bookings</Link>,
        },
        {
          key: '/loads',
          icon: <Container size={16} />,
          label: <Link href="/loads">Loads</Link>,
        },
      ],
    },
  ]

  const getSelectedKey = () => {
    if (location === '/sales-orders' || location.startsWith('/sales-order/')) return ['/sales-orders']
    if (location === '/bookings' || location.startsWith('/booking/')) return ['/bookings']
    if (location === '/loads' || location.startsWith('/load/')) return ['/loads']
    if (location === '/analytics') return ['/analytics']
    if (location === '/settings') return ['/settings']
    return ['/']
  }

  return (
    <Sider
      collapsed={collapsed}
      width={216}
      collapsedWidth={80}
      style={{
        background: '#fff',
        borderRight: '1px solid #e5e7eb',
        transition: 'all 0.2s ease-in-out',
        position: 'fixed',
        top: '64px',
        height: 'calc(100vh - 64px)',
        zIndex: 50,
        overflow: 'hidden'
      }}
    >
      <div style={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        <Menu
          mode="inline"
          selectedKeys={getSelectedKey()}
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={setOpenKeys}
          items={menuItems}
          style={{
            height: 'auto',
            borderRight: 0,
            fontSize: '14px',
          }}
          theme="light"
          inlineCollapsed={collapsed}
          className="custom-sidebar-menu"
        />
      </div>
    </Sider>
  )
}