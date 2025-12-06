"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/utils/apiService'; // Đường dẫn đến file chứa hàm login
import { Form, Input, Button, Typography, message } from 'antd';
import { useHasMounted } from '@/utils/customHook';

const { Title } = Typography;

const PageLogin = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
 const hasMounted = useHasMounted();
  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      // Gọi API login
      const token = await login(values.username, values.password);
      
      // Hiển thị thông báo thành công
      message.success('Login successful!');

      // Sau khi đăng nhập thành công, chuyển hướng đến trang chỉ định
      router.push('/');
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Xử lý lỗi sai mật khẩu
        message.error('Incorrect username or password. Please try again.');
      } else {
        // Hiển thị thông báo lỗi chung
        message.error(err.message || 'Login failed!');
      }
    } finally {
      setLoading(false);
    }
  };
  if (!hasMounted) return <></>; // Chỉ render khi đã mount
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem', backgroundColor: '#ffffff'}}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '2rem' }}>Login</Title>
      <Form
        layout="vertical"
        onFinish={handleLogin}
      >
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

export default PageLogin;
