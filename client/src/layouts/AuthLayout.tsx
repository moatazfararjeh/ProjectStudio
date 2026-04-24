import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import './AuthLayout.css';

const { Content } = Layout;

export default function AuthLayout() {
  return (
    <Layout className="auth-layout">
      <Content className="auth-content">
        <div className="auth-container">
          <div className="auth-header">
            <h1 className="auth-logo">EPM</h1>
            <p className="auth-subtitle">Project Management Studio</p>
          </div>
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
}
