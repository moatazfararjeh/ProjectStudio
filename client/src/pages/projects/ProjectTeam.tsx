import RightDrawer from '../../components/RightDrawer';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Form,
  Select,
  App,
  Alert,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  UserOutlined,
  EditOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import api from '../../lib/api';
import type { Project } from '../../types';

interface ProjectTeamProps {
  project: Project;
}

export default function ProjectTeam({ project }: ProjectTeamProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { message, modal: antdModal } = App.useApp();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // Fetch all users
  const { data: users = [], isLoading: isLoadingUsers, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
  });

  // Filter out users already in the project
  const availableUsers = users.filter((user: any) => 
    !project.members?.some((member: any) => member.user.id === user.id)
  );

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: (data: { userId: string; role: string }) =>
      api.addProjectMember(project.id, data),
    onSuccess: () => {
      message.success(t('projects.memberAdded'));
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || t('common.error'));
    },
  });

  // Update member mutation
  const updateMemberMutation = useMutation({
    mutationFn: (data: { memberId: string; role: string }) =>
      api.updateProjectMember(project.id, data.memberId, { role: data.role }),
    onSuccess: () => {
      message.success(t('projects.memberUpdated'));
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      setIsEditModalOpen(false);
      editForm.resetFields();
      setSelectedMember(null);
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || t('common.error'));
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => api.removeProjectMember(project.id, memberId),
    onSuccess: () => {
      message.success(t('projects.memberRemoved'));
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || t('common.error'));
    },
  });

  const handleAddMember = async () => {
    try {
      const values = await form.validateFields();
      addMemberMutation.mutate(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    editForm.setFieldsValue({ role: member.role });
    setIsEditModalOpen(true);
  };

  const handleUpdateMember = async () => {
    try {
      const values = await editForm.validateFields();
      updateMemberMutation.mutate({ 
        memberId: selectedMember.id, 
        role: values.role 
      });
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleRemoveMember = (memberId: string, userName: string) => {
    antdModal.confirm({
      title: t('projects.removeMemberConfirm'),
      content: `${t('projects.removeMemberMessage')}: ${userName}?`,
      onOk: () => removeMemberMutation.mutate(memberId),
    });
  };

  const columns = [
    {
      title: t('projects.memberName'),
      dataIndex: ['user', 'firstName'],
      key: 'name',
      render: (_: any, record: any) => (
        <Space>
          <UserOutlined />
          {record.user.firstName} {record.user.lastName}
        </Space>
      ),
    },
    {
      title: t('projects.memberEmail'),
      dataIndex: ['user', 'email'],
      key: 'email',
    },
    {
      title: t('projects.memberRole'),
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        // Handle role translation
        let roleKey = '';
        if (role === 'MANAGER') roleKey = 'manager';
        else if (role === 'TEAM_LEAD') roleKey = 'team_lead';
        else if (role === 'MEMBER') roleKey = 'member';
        else if (role === 'DEVELOPER') roleKey = 'developer';
        else if (role === 'DESIGNER') roleKey = 'designer';
        else if (role === 'QA') roleKey = 'qa';
        else roleKey = role.toLowerCase();
        
        return <Tag color="blue">{t(`projects.role_${roleKey}`)}</Tag>;
      },
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditMember(record)}
          >
            {t('common.edit')}
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveMember(record.id, `${record.user.firstName} ${record.user.lastName}`)}
          >
            {t('common.remove')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={`${t('projects.team')} (${project.members?.length || 0})`}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            {t('projects.addMember')}
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={project.members}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* Add Member Drawer */}
      <RightDrawer
        title={t('projects.addMember')}
        open={isModalOpen}
        onSubmit={handleAddMember}
        onClose={() => { setIsModalOpen(false); form.resetFields(); }}
        confirmLoading={addMemberMutation.isPending}
        submitText={t('projects.addMember')}
      >
        <Form form={form} layout="vertical">
          {isLoadingUsers && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Spin tip="Loading users..." />
            </div>
          )}
          
          {usersError && (
            <Alert
              message="Error Loading Users"
              description={`Failed to load users. Please try again. ${(usersError as any)?.message || ''}`}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          {!isLoadingUsers && !usersError && users.length === 0 && (
            <Alert
              message="No Users Found"
              description="There are no users in the system. Please create users first using the Register page or contact your administrator."
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              style={{ marginBottom: 16 }}
            />
          )}
          
          {!isLoadingUsers && !usersError && users.length > 0 && availableUsers.length === 0 && (
            <Alert
              message="All Users Already Added"
              description="All available users are already members of this project."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          <Form.Item
            name="userId"
            label={t('projects.selectUser')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Select
              showSearch
              placeholder={t('projects.selectUser')}
              disabled={isLoadingUsers || availableUsers.length === 0}
              loading={isLoadingUsers}
              notFoundContent={isLoadingUsers ? <Spin size="small" /> : 'No users available'}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={availableUsers.map((user: any) => ({
                label: `${user.firstName} ${user.lastName} (${user.email})`,
                value: user.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="role"
            label={t('projects.memberRole')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Select>
              <Select.Option value="MANAGER">{t('projects.role_manager')}</Select.Option>
              <Select.Option value="TEAM_LEAD">{t('projects.role_team_lead')}</Select.Option>
              <Select.Option value="MEMBER">{t('projects.role_member')}</Select.Option>
              <Select.Option value="DEVELOPER">{t('projects.role_developer')}</Select.Option>
              <Select.Option value="DESIGNER">{t('projects.role_designer')}</Select.Option>
              <Select.Option value="QA">{t('projects.role_qa')}</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </RightDrawer>

      {/* Edit Member Drawer */}
      <RightDrawer
        title={t('projects.editMember')}
        open={isEditModalOpen}
        onSubmit={handleUpdateMember}
        onClose={() => { setIsEditModalOpen(false); editForm.resetFields(); setSelectedMember(null); }}
        confirmLoading={updateMemberMutation.isPending}
        submitText={t('common.save')}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="role"
            label={t('projects.memberRole')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Select>
              <Select.Option value="MANAGER">{t('projects.role_manager')}</Select.Option>
              <Select.Option value="TEAM_LEAD">{t('projects.role_team_lead')}</Select.Option>
              <Select.Option value="MEMBER">{t('projects.role_member')}</Select.Option>
              <Select.Option value="DEVELOPER">{t('projects.role_developer')}</Select.Option>
              <Select.Option value="DESIGNER">{t('projects.role_designer')}</Select.Option>
              <Select.Option value="QA">{t('projects.role_qa')}</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </RightDrawer>
    </div>
  );
}
