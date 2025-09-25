import { Layout, Typography, Input, Select } from 'antd'
import { BellOutlined, SettingOutlined, MailOutlined, QuestionCircleOutlined, SearchOutlined } from '@ant-design/icons'
import { ArrowLeftToLine } from 'lucide-react'

const { Header } = Layout
const { Title } = Typography

interface TopBarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

export const TopBar = ({ collapsed, onCollapse }: TopBarProps) => {
  const buttonStyle = {
    padding: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
  }


  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: '#071429',
        borderBottom: 'none',
        height: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 200
      }}
    >
      {/* Left Section - Logo + Collapse Button + Search */}
      <div style={{ display: 'flex', alignItems: 'center', height: '64px' }}>
        {/* ReMatter Logo - centered horizontally */}
        <Title level={3} style={{ 
          margin: 0, 
          color: '#fff', 
          fontWeight: 'bold', 
          marginTop: '8px', // Adjust to align with Trade icon vertical position
          textAlign: 'center',
          flex: 1,
        }}>
          ReMatter
        </Title>
        
        {/* Collapse/Expand Button - positioned with right margin */}
        <div 
          style={{
            ...buttonStyle,
            marginLeft: '40px', // 40px spacing from logo (24px + 16px)
            marginRight: '8px', // Changed from 10px to 8px
          }}
          onClick={() => onCollapse(!collapsed)}
        >
          <ArrowLeftToLine size={16} />
        </div>

        {/* Search Field - moved here with 8px spacing */}
        <div style={{ marginLeft: '8px' }}>
          <Input
            placeholder="Search"
            style={{ width: 200 }}
            className="custom-search"
            prefix={<SearchOutlined style={{ color: '#FFFFFF', marginRight: '6px' }} />}
            styles={{
              input: {
                background: 'rgba(255, 255, 255, 0.1) !important',
                border: '1px solid rgba(255, 255, 255, 0.2) !important',
                borderRadius: '6px !important',
                boxShadow: 'none !important',
                color: '#fff !important',
              },
            }}
          />
        </div>
      </div>

      {/* Right Section - Fields + Button Group */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Facilities Select Field */}
        <Select
          defaultValue="All Facilities"
          style={{ width: 150 }}
          className="custom-select"
          styles={{
            root: {
              background: 'rgba(255, 255, 255, 0.1) !important',
              border: '1px solid rgba(255, 255, 255, 0.2) !important',
              borderRadius: '6px !important',
              boxShadow: 'none !important',
            },
          }}
          options={[
            { value: 'all', label: 'All Facilities' },
            { value: 'headquarters', label: 'ReMatter Headquarters' },
            { value: 'san-diego', label: 'ReMatter San Diego' },
            { value: 'los-angeles', label: 'ReMatter Los Angeles' },
          ]}
        />
        
        {/* User Selection Field */}
        <Select
          defaultValue="Oliver Smith"
          style={{ width: 120 }}
          className="custom-select"
          styles={{
            root: {
              background: 'rgba(255, 255, 255, 0.1) !important',
              border: '1px solid rgba(255, 255, 255, 0.2) !important',
              borderRadius: '6px !important',
              boxShadow: 'none !important',
            },
          }}
          options={[
            { value: 'oliver', label: 'Oliver Smith' },
            { value: 'admin', label: 'Admin User' },
          ]}
        />
        
        {/* Button Group */}
        <div style={buttonStyle}>
          <BellOutlined style={{ fontSize: '16px' }} />
        </div>
        
        <div style={buttonStyle}>
          <QuestionCircleOutlined style={{ fontSize: '16px' }} />
        </div>
        
        <div style={buttonStyle}>
          <MailOutlined style={{ fontSize: '16px' }} />
        </div>
        
        <div style={buttonStyle}>
          <SettingOutlined style={{ fontSize: '16px' }} />
        </div>
      </div>
    </Header>
  )
}