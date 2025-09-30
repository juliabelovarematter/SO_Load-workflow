import { Layout } from 'antd'
import { Router, Route, Switch, Redirect } from 'wouter'
import { TopBar } from './components/Layout/TopBar'
import { SideBar } from './components/Layout/SideBar'
// import { Dashboard } from './routes/dashboard'
import { Analytics } from './routes/analytics'
import { Settings } from './routes/settings'
import { SalesOrders } from './routes/sales-orders'
import { Bookings } from './routes/bookings'
import { Loads } from './routes/loads'
import { LoadDetail } from './routes/load-detail'
import { SalesOrderDetail } from './routes/sales-order-detail'
import { useState } from 'react'

const { Content } = Layout

function App() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <TopBar collapsed={collapsed} onCollapse={setCollapsed} />
        <Layout>
          <SideBar collapsed={collapsed} />
          <Layout style={{ padding: '0', marginLeft: collapsed ? '80px' : '216px' }}>
            <Content
              style={{
                margin: 0,
                minHeight: 280,
                background: '#f0f2f5',
              }}
            >
              <Switch>
                <Route path="/sales-orders" component={SalesOrders} />
                <Route path="/sales-order/:id" component={SalesOrderDetail} />
                <Route path="/bookings" component={Bookings} />
                <Route path="/loads" component={Loads} />
                <Route path="/load/:id" component={LoadDetail} />
                <Route path="/analytics" component={Analytics} />
                <Route path="/settings" component={Settings} />
                <Route path="/">
                  <Redirect to="/sales-orders" />
                </Route>
              </Switch>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </Router>
  )
}

export default App
