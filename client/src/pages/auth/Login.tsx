import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success(t('auth.login') + ' ' + t('common.success'));
      navigate('/');
    } catch (error: any) {
      message.error(error?.response?.data?.message || t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ textAlign: 'center', marginBottom: 32, fontSize: 24 }}>
        {t('auth.signIn')}
      </h2>
      
      <Form
        name="login"
        onFinish={onFinish}
        layout="vertical"
        size="large"
        className="auth-form"
      >
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
            {t('auth.signIn')}
          </Button>
        </Form.Item>

        <div className="auth-footer">
          {t('auth.noAccount')}{' '}
          <Link to="/register">{t('auth.signUp')}</Link>
        </div>
      </Form>
    </div>
  );
}
