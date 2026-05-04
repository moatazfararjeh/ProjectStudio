import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Button, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  ProjectOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  GlobalOutlined,
  ControlOutlined,
  AppstoreOutlined,
  DownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ArrowLeftOutlined,
  CheckSquareOutlined,
  TeamOutlined,
  FileTextOutlined,
  WarningOutlined,
  SaveOutlined,
  RocketOutlined,
  CalendarOutlined,
  FilePptOutlined,
  CheckCircleOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';
import api from '../lib/api';
import './MainLayout.css';

const { Sider, Header, Content } = Layout;

export default function MainLayout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  const [collapsed, setCollapsed] = useState(false);

  // Detect whether we're inside a project detail page
  const pathParts = location.pathname.split('/').filter(Boolean);
  const isProjectPage = pathParts[0] === 'projects' && pathParts.length >= 2;
  const projectId = isProjectPage ? pathParts[1] : null;
  const activeProjectTab = !projectId
    ? null
    : pathParts.length === 2
    ? 'dashboard'
    : pathParts[2];

  // Fetch project name when inside a project
  const { data: projectData } = useQuery({
    queryKey: ['project-name', projectId],
    queryFn: () => api.getProject(projectId!),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });

  const projectNavItems: MenuProps['items'] = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { type: 'divider' },
    {
      key: 'group-work',
      type: 'group',
      label: 'Work',
      children: [
        { key: 'tasks', icon: <CheckSquareOutlined />, label: 'Tasks' },
        { key: 'team', icon: <TeamOutlined />, label: 'Team' },
      ],
    },
    {
      key: 'group-tracking',
      type: 'group',
      label: 'Tracking',
      children: [
        { key: 'raid', icon: <WarningOutlined />, label: 'RAID Log' },
        { key: 'this-week', icon: <RocketOutlined />, label: 'This Week' },
        { key: 'next-week', icon: <CalendarOutlined />, label: 'Next Week' },
        { key: 'weekly-highlights', icon: <CheckCircleOutlined />, label: 'Weekly Highlights' },
        { key: 'meeting-minutes', icon: <AuditOutlined />, label: 'Meeting Minutes' },
      ],
    },
    {
      key: 'group-reports',
      type: 'group',
      label: 'Reports',
      children: [
        { key: 'reports', icon: <FileTextOutlined />, label: 'Reports' },
        { key: 'saved-reports', icon: <SaveOutlined />, label: 'Saved Reports' },
      ],
    },
    { type: 'divider' },
    { key: 'report-template', icon: <FilePptOutlined />, label: 'Report Template' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
  ];

  const navItems: MenuProps['items'] = [
    { key: '/', icon: <DashboardOutlined />, label: t('nav.dashboard') },
    { key: '/projects', icon: <ProjectOutlined />, label: t('nav.projects') },
    { key: '/accounts', icon: <UserOutlined />, label: t('nav.accounts') },
    {
      key: 'admin',
      icon: <SettingOutlined />,
      label: t('nav.administration') || 'Administration',
      children: [
        { key: '/settings', icon: <SettingOutlined />, label: t('nav.settings') },
        { key: '/system-settings', icon: <ControlOutlined />, label: t('nav.systemSettings') },
      ],
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('nav.profile'),
      onClick: () => navigate('/profile'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('auth.logout'),
      danger: true,
      onClick: () => { logout(); navigate('/login'); },
    },
  ];

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const handleProjectNavClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'dashboard') {
      navigate(`/projects/${projectId}`);
    } else {
      navigate(`/projects/${projectId}/${key}`);
    }
  };

  const selectedKey = '/' + location.pathname.split('/')[1];

  return (
    <Layout className="main-layout" style={{ minHeight: '100vh' }}>
      {/* ===== Left Sidebar ===== */}
      <Sider
        collapsed={collapsed}
        collapsedWidth={64}
        width={230}
        className="main-sider"
        trigger={null}
      >
        {/* Logo area — always visible */}
        <div className="sider-logo" onClick={() => navigate('/')}>
          {collapsed ? (
            <div className="sider-logo-icon">
              <AppstoreOutlined />
            </div>
          ) : (
            <img
              src="https://www.netways.com/img/case-studies/LOGO%20-%20netways%20png%202.png"
              alt="Netways"
              className="sider-logo-img"
            />
          )}
        </div>

        {/* Project context header — shown only inside a project */}
        {isProjectPage && (
          <div className="sider-project-header">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/projects')}
              className="sider-back-btn"
              title="Back to Projects"
            />
            {!collapsed && (
              <span className="sider-project-name">
                {projectData?.name ?? 'Project'}
              </span>
            )}
          </div>
        )}

        {/* Navigation menu */}
        {isProjectPage ? (
          <Menu
            mode="inline"
            selectedKeys={activeProjectTab ? [activeProjectTab] : []}
            items={projectNavItems}
            onClick={handleProjectNavClick}
            className="sider-menu"
            inlineCollapsed={collapsed}
          />
        ) : (
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            defaultOpenKeys={['admin']}
            items={navItems}
            onClick={(e) => navigate(e.key)}
            className="sider-menu"
            inlineCollapsed={collapsed}
          />
        )}

        {/* Bottom user strip */}
        <div className="sider-footer">
          <Dropdown menu={{ items: userMenuItems }} placement="topLeft" trigger={['click']}>
            <div className="sider-user">
              <Avatar
                src={user?.avatar}
                icon={!user?.avatar && <UserOutlined />}
                className="sider-user-avatar"
                size={32}
              />
              {!collapsed && (
                <div className="sider-user-info">
                  <span className="sider-user-name">{user?.firstName} {user?.lastName}</span>
                  <span className="sider-user-role">{user?.role || 'Member'}</span>
                </div>
              )}
            </div>
          </Dropdown>
        </div>
      </Sider>

      {/* ===== Right side: Header + Content ===== */}
      <Layout
        className="main-right"
        style={
          language === 'ar'
            ? { marginRight: collapsed ? 64 : 230, marginLeft: 0, transition: 'margin 0.2s ease' }
            : { marginLeft: collapsed ? 64 : 230, transition: 'margin-left 0.2s ease' }
        }
      >
        <Header className="top-header">
          {/* Sidebar toggle */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="sidebar-toggle-btn"
          />

          {/* Right actions */}
          <div className="header-right">
            <Tooltip title={language === 'en' ? 'عربي' : 'English'}>
              <Button
                type="text"
                icon={<GlobalOutlined />}
                onClick={toggleLanguage}
                className="header-action-btn"
              >
                {language === 'en' ? 'عربي' : 'EN'}
              </Button>
            </Tooltip>

            <div className="header-divider" />

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <div className="user-menu-trigger">
                <Avatar
                  src={user?.avatar}
                  icon={!user?.avatar && <UserOutlined />}
                  style={{ backgroundColor: '#667eea', flexShrink: 0 }}
                  size={34}
                />
                <div className="user-menu-info">
                  <span className="user-menu-name">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="user-menu-role">
                    {user?.role || 'Member'}
                  </span>
                </div>
                <DownOutlined style={{ fontSize: 10, color: '#8c8c8c', marginLeft: 4 }} />
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="main-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

