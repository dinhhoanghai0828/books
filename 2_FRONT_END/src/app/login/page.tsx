'use client';
import { login } from '@/utils/apiService';
import { useHasMounted } from '@/utils/customHook';
import { Button, Form, Input, Typography, message } from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const { Title } = Typography;

const LoginPage = () => {
  const router = useRouter();
  const hasMounted = useHasMounted();
  const [loading, setLoading] = useState(false);

  // Xu ly dang nhap: goi API, luu token, chuyen huong ve trang chu
  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('Login successful!');
      router.push('/');
    } catch (err: any) {
      if (err.response?.status === 401) {
        message.error('Incorrect username or password. Please try again.');
      } else {
        message.error(err.message || 'Login failed!');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!hasMounted) return null;

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '2rem', backgroundColor: '#fff' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '2rem' }}>
        Login
      </Title>
      <Form layout="vertical" onFinish={handleLogin}>
        <Form.Item
          label="Username"
          name="username"
          rules={[{ required: true, message: 'Please input your username!' }]}
        >
          <Input placeholder="Enter your username" />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password placeholder="Enter your password" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Login
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default LoginPage;
