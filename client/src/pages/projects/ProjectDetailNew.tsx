import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Typography,
  Spin,
  Badge,
  message as antdMessage,
} from 'antd';

import api from '../../lib/api';
import ProjectDashboard from './ProjectDashboard';
import ProjectTasks from './ProjectTasks';
import ProjectTeam from './ProjectTeam';
import ProjectReports from './ProjectReports';
import ProjectRAID from './ProjectRAID';
import ReportTemplateSettings from './ReportTemplateSettings';
import ProjectWorkLogs from '../../components/ProjectWorkLogs';
import ProjectSavedReports from '../../components/ProjectSavedReports';
import ProjectSummary from '../../components/ProjectSummary';
import ProjectThisWeek from '../../components/ProjectThisWeek';
import ProjectNextWeek from '../../components/ProjectNextWeek';
import ProjectSettingsTab from './ProjectSettingsTab';
import ProjectWeeklyHighlights from './ProjectWeeklyHighlights';
import type { Project } from '../../types';
import { ErrorBoundary } from '../../components/ErrorBoundary';

const { Title, Text } = Typography;

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Get active tab from URL
  const pathParts = location.pathname.split('/');
  const activeTab = pathParts[pathParts.length - 1] === id ? 'dashboard' : pathParts[pathParts.length - 1];

  // Fetch project details
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.getProject(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !project) {
    antdMessage.error(t('projects.notFound'));
    navigate('/projects');
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ProjectDashboard project={project} />;
      case 'tasks':
        return <ProjectTasks project={project} />;
      case 'team':
        return <ProjectTeam project={project} />;
      case 'reports':
        return <ProjectReports project={project} />;
      case 'saved-reports':
        return <ProjectSavedReports project={project} />;
      case 'this-week':
        return <ProjectThisWeek project={project} />;
      case 'next-week':
        return <ProjectNextWeek project={project} />;
      case 'raid':
        return <ProjectRAID project={project} />;
      case 'report-template':
        return (
          <ErrorBoundary>
            <ReportTemplateSettings project={project} />
          </ErrorBoundary>
        );
      case 'weekly-highlights':
        return <ProjectWeeklyHighlights project={project} />;
      case 'settings':
        return <ProjectSettingsTab project={project} />;
      default:
        return <ProjectDashboard project={project} />;
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Project Header */}
      <div className="project-header">
        <div className="project-header-left">
          <div className="project-header-info">
            <Title level={3} style={{ margin: 0, lineHeight: 1.2 }}>
              {project.name}
            </Title>
            {project.code && (
              <Text type="secondary" style={{ fontSize: 13 }}>{project.code}</Text>
            )}
          </div>
        </div>
        <div className="project-header-right">
          <Badge
            status={project.status === 'ACTIVE' ? 'success' : project.status === 'ON_HOLD' ? 'warning' : 'default'}
            text={<span style={{ fontSize: 13, fontWeight: 500 }}>{project.status}</span>}
          />
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
