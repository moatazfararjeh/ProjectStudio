import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((state) => state.register);

  const onFinish = async (values: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    setLoading(true);
    try {
      await register(values);
      message.success(t('auth.registerSuccess'));
      navigate('/');
    } catch (error: any) {
      message.error(error?.response?.data?.message || t('auth.registerError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ textAlign: 'center', marginBottom: 32, fontSize: 24 }}>
        {t('auth.signUp')}
      </h2>
      
      <Form
        name="register"
        onFinish={onFinish}
        layout="vertical"
        size="large"
        className="auth-form"
      >
        <Form.Item
          name="firstName"
          rules={[
            { required: true, message: t('auth.firstNameRequired') },
            { min: 2, message: t('auth.nameMin') },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder={t('auth.firstName')}
          />
        </Form.Item>

        <Form.Item
          name="lastName"
          rules={[
            { required: true, message: t('auth.lastNameRequired') },
            { min: 2, message: t('auth.nameMin') },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder={t('auth.lastName')}
          />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: t('auth.emailRequired') },
            { type: 'email', message: t('auth.emailInvalid') },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder={t('auth.email')}
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: t('auth.passwordRequired') },
            { min: 6, message: t('auth.passwordMin') },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder={t('auth.password')}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            style={{ height: 45 }}
          >
            {t('auth.signUp')}
          </Button>
        </Form.Item>

        <div className="auth-footer">
          {t('auth.haveAccount')}{' '}
          <Link to="/login">{t('auth.signIn')}</Link>
        </div>
      </Form>
    </div>
  );
}
