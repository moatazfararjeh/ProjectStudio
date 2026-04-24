import { Card, Typography, Form, Input, Select, Switch, Button, Space, Divider, App, Tabs } from 'antd';
import { SaveOutlined, UserOutlined, BellOutlined, GlobalOutlined, SettingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { useMutation } from '@tanstack/react-query';
import api from '../../lib/api';

const { Title, Text } = Typography;

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { message } = App.useApp();
  const user = useAuthStore((state) => state.user);
  const [profileForm] = Form.useForm();
  const [notificationForm] = Form.useForm();

  // Profile Update Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => api.updateUser(user?.id || '', data),
    onSuccess: () => {
      message.success(t('settings.profileUpdateSuccess'));
    },
    onError: () => {
      message.error(t('common.error'));
    },
  });

  // Handle Profile Update
  const handleProfileUpdate = async () => {
    try {
      const values = await profileForm.validateFields();
      updateProfileMutation.mutate(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Handle Language Change
  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    message.success(t('settings.languageChanged'));
  };

  // Profile Settings Tab
  const ProfileSettings = () => (
    <Card>
      <Title level={4}>
        <UserOutlined /> {t('settings.profileSettings')}
      </Title>
      <Form
        form={profileForm}
        layout="vertical"
        initialValues={{
          firstName: user?.firstName,
          lastName: user?.lastName,
          email: user?.email,
        }}
      >
        <Form.Item
          name="firstName"
          label={t('auth.firstName')}
          rules={[{ required: true, message: t('common.required') }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="lastName"
          label={t('auth.lastName')}
          rules={[{ required: true, message: t('common.required') }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="email"
          label={t('auth.email')}
          rules={[
            { required: true, message: t('common.required') },
            { type: 'email', message: t('auth.emailInvalid') },
          ]}
        >
          <Input disabled />
        </Form.Item>

        <Divider />

        <Title level={5}>{t('settings.changePassword')}</Title>
        
        <Form.Item
          name="currentPassword"
          label={t('settings.currentPassword')}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label={t('settings.newPassword')}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || !getFieldValue('currentPassword')) {
                  return Promise.resolve();
                }
                if (value.length >= 6) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t('auth.passwordMin')));
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label={t('settings.confirmPassword')}
          dependencies={['newPassword']}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || !getFieldValue('newPassword')) {
                  return Promise.resolve();
                }
                if (value === getFieldValue('newPassword')) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t('settings.passwordMismatch')));
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Button 
          type="primary" 
          icon={<SaveOutlined />} 
          onClick={handleProfileUpdate}
          loading={updateProfileMutation.isPending}
        >
          {t('common.save')}
        </Button>
      </Form>
    </Card>
  );

  // Notification Settings Tab
  const NotificationSettings = () => (
    <Card>
      <Title level={4}>
        <BellOutlined /> {t('settings.notificationSettings')}
      </Title>
      <Form
        form={notificationForm}
        layout="vertical"
        initialValues={{
          emailNotifications: true,
          taskReminders: true,
          projectUpdates: true,
          deadlineAlerts: true,
          weeklyDigest: false,
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Form.Item name="emailNotifications" valuePropName="checked">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>{t('settings.emailNotifications')}</Text>
                <br />
                <Text type="secondary">{t('settings.emailNotificationsDesc')}</Text>
              </div>
              <Switch />
            </div>
          </Form.Item>

          <Form.Item name="taskReminders" valuePropName="checked">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>{t('settings.taskReminders')}</Text>
                <br />
                <Text type="secondary">{t('settings.taskRemindersDesc')}</Text>
              </div>
              <Switch />
            </div>
          </Form.Item>

          <Form.Item name="projectUpdates" valuePropName="checked">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>{t('settings.projectUpdates')}</Text>
                <br />
                <Text type="secondary">{t('settings.projectUpdatesDesc')}</Text>
              </div>
              <Switch />
            </div>
          </Form.Item>

          <Form.Item name="deadlineAlerts" valuePropName="checked">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>{t('settings.deadlineAlerts')}</Text>
                <br />
                <Text type="secondary">{t('settings.deadlineAlertsDesc')}</Text>
              </div>
              <Switch />
            </div>
          </Form.Item>

          <Form.Item name="weeklyDigest" valuePropName="checked">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>{t('settings.weeklyDigest')}</Text>
                <br />
                <Text type="secondary">{t('settings.weeklyDigestDesc')}</Text>
              </div>
              <Switch />
            </div>
          </Form.Item>
        </Space>

        <Divider />

        <Button type="primary" icon={<SaveOutlined />}>
          {t('common.save')}
        </Button>
      </Form>
    </Card>
  );

  // Language & Appearance Settings Tab
  const AppearanceSettings = () => (
    <Card>
      <Title level={4}>
        <GlobalOutlined /> {t('settings.appearanceSettings')}
      </Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Text strong>{t('settings.language')}</Text>
          <br />
          <Text type="secondary">{t('settings.languageDesc')}</Text>
          <br /><br />
          <Select
            value={i18n.language}
            onChange={handleLanguageChange}
            style={{ width: 200 }}
            options={[
              { label: 'English', value: 'en' },
              { label: 'العربية', value: 'ar' },
            ]}
          />
        </div>

        <Divider />

        <div>
          <Text strong>{t('settings.theme')}</Text>
          <br />
          <Text type="secondary">{t('settings.themeDesc')}</Text>
          <br /><br />
          <Select
            defaultValue="light"
            style={{ width: 200 }}
            options={[
              { label: t('settings.lightMode'), value: 'light' },
              { label: t('settings.darkMode'), value: 'dark' },
              { label: t('settings.systemMode'), value: 'system' },
            ]}
            disabled
          />
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            ({t('settings.comingSoon')})
          </Text>
        </div>

        <Divider />

        <div>
          <Text strong>{t('settings.dateFormat')}</Text>
          <br />
          <Text type="secondary">{t('settings.dateFormatDesc')}</Text>
          <br /><br />
          <Select
            defaultValue="YYYY-MM-DD"
            style={{ width: 200 }}
            options={[
              { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
              { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
              { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
            ]}
          />
        </div>
      </Space>
    </Card>
  );

  // System Settings Tab
  const SystemSettings = () => (
    <Card>
      <Title level={4}>
        <SettingOutlined /> {t('settings.systemSettings')}
      </Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Text strong>{t('settings.timezone')}</Text>
          <br />
          <Text type="secondary">{t('settings.timezoneDesc')}</Text>
          <br /><br />
          <Select
            defaultValue="Asia/Riyadh"
            style={{ width: 300 }}
            showSearch
            options={[
              { label: '(GMT+3) Asia/Riyadh', value: 'Asia/Riyadh' },
              { label: '(GMT+2) Africa/Cairo', value: 'Africa/Cairo' },
              { label: '(GMT+0) UTC', value: 'UTC' },
              { label: '(GMT-5) America/New_York', value: 'America/New_York' },
            ]}
          />
        </div>

        <Divider />

        <div>
          <Text strong>{t('settings.workingDays')}</Text>
          <br />
          <Text type="secondary">{t('settings.workingDaysDesc')}</Text>
          <br /><br />
          <Select
            mode="multiple"
            defaultValue={['0', '1', '2', '3', '4']}
            style={{ width: '100%' }}
            options={[
              { label: t('settings.sunday'), value: '0' },
              { label: t('settings.monday'), value: '1' },
              { label: t('settings.tuesday'), value: '2' },
              { label: t('settings.wednesday'), value: '3' },
              { label: t('settings.thursday'), value: '4' },
              { label: t('settings.friday'), value: '5' },
              { label: t('settings.saturday'), value: '6' },
            ]}
          />
        </div>

        <Divider />

        <div>
          <Text strong>{t('settings.hoursPerDay')}</Text>
          <br />
          <Text type="secondary">{t('settings.hoursPerDayDesc')}</Text>
          <br /><br />
          <Select
            defaultValue={8}
            style={{ width: 150 }}
            options={[
              { label: '6 hours', value: 6 },
              { label: '7 hours', value: 7 },
              { label: '8 hours', value: 8 },
              { label: '9 hours', value: 9 },
              { label: '10 hours', value: 10 },
            ]}
          />
        </div>

        <Divider />

        <Button type="primary" icon={<SaveOutlined />}>
          {t('common.save')}
        </Button>
      </Space>
    </Card>
  );

  return (
    <div>
      <Title level={2}>{t('settings.title')}</Title>
      
      <Tabs
        defaultActiveKey="profile"
        items={[
          {
            key: 'profile',
            label: (
              <span>
                <UserOutlined /> {t('settings.profile')}
              </span>
            ),
            children: <ProfileSettings />,
          },
          {
            key: 'notifications',
            label: (
              <span>
                <BellOutlined /> {t('settings.notifications')}
              </span>
            ),
            children: <NotificationSettings />,
          },
          {
            key: 'appearance',
            label: (
              <span>
                <GlobalOutlined /> {t('settings.appearance')}
              </span>
            ),
            children: <AppearanceSettings />,
          },
          {
            key: 'system',
            label: (
              <span>
                <SettingOutlined /> {t('settings.system')}
              </span>
            ),
            children: <SystemSettings />,
          },
        ]}
      />
    </div>
  );
}
