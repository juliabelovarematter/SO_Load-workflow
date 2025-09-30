import { Layout, Menu } from 'antd'
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
    // No nested menus, so no need to manage openKeys
    setOpenKeys([])
  }, [location])

  const menuItems = [
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
        <style dangerouslySetInnerHTML={{
          __html: `
            .custom-sidebar-menu .ant-menu-item-selected {
              background-color: #040C19 !important;
              color: #fff !important;
            }
            .custom-sidebar-menu .ant-menu-item-selected .ant-menu-item-icon {
              color: #fff !important;
            }
            .custom-sidebar-menu .ant-menu-item-selected a {
              color: #fff !important;
            }
            .custom-sidebar-menu .ant-menu-item:hover {
              background-color: #f3f4f6 !important;
            }
          `
        }} />
      </div>
    </Sider>
  )
}