'use client';
import { useHasMounted } from '@/utils/customHook';
import {
  BookOutlined,
  CheckCircleOutlined,
  CommentOutlined,
  HomeOutlined,
  LineChartOutlined,
  LogoutOutlined,
  ReadOutlined
} from '@ant-design/icons';
import { Button, Menu, message } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

interface CustomMenuItem {
  label: string;
  key: string;
  icon?: React.ReactNode;
  href?: string;
  children?: CustomMenuItem[];
}

const items: CustomMenuItem[] = [
  {
    label: 'Trang Chủ',
    key: 'home',
    icon: <HomeOutlined />,
    href: '/',
  },
  {
    label: 'Tiếng anh cơ bản',
    key: 'tieng-anh-co-ban',
    icon: <ReadOutlined />,
    href: '/tieng-anh-co-ban',
    children: [
      {
        label: 'Tiếng anh cơ bản cấp độ 1',
        key: 'tienganhcoban1',
        href: '/tieng-anh-co-ban/tieng-anh-co-ban-cap-do-1',
      },
      {
        label: 'Tiếng anh cơ bản cấp độ 2',
        key: 'tienganhcoban2',
        href: '/tieng-anh-co-ban/tieng-anh-co-ban-cap-do-2',
      }
    ],
  },
  {
    label: 'Eslfast',
    key: 'tieng-anh-theo-cap-do',
    icon: <ReadOutlined />,
    href: '/tieng-anh-theo-cap-do',
    children: [
      {
        label: 'Tiếng anh cơ bản cấp độ 1',
        key: 'so-cap-1',
        href: '/esl-fast/so-cap-1',
      },
      {
        label: 'Tiếng anh cơ bản cấp độ 2',
        key: 'so-cap-2',
        href: '/esl-fast/so-cap-2',
      },
      {
        label: 'Tiếng anh trung cấp',
        key: 'trung-cap',
        href: '/esl-fast/trung-cap',
      },
      {
        label: 'Tiếng anh trung cao cấp',
        key: 'trung-cao-cap',
        href: '/tesl-fast/trung-cao-cap',
      },
      {
        label: 'Tiếng anh nâng cao',
        key: 'nang-cao',
        href: '/esl-fast/nang-cao',
      }
    ],
  },
  {
    label: 'Truyện',
    key: 'truyen',
    icon: <ReadOutlined />,
    href: '/truyen',
    children: [
      {
        label: 'Truyện truyền cảm hứng',
        key: 'truyenTruyenCamHung',
        href: '/truyen/truyen-truyen-cam-hung',
      },
      {
        label: 'Truyện kinh dị',
        key: 'truyenKinhDi',
        href: '/truyen/truyen-kinh-di',
      },
      {
        label: 'Truyện cổ tích',
        key: 'truyenCoTich',
        href: '/truyen/truyen-co-tich',
      },
      {
        label: 'Truyện tuổi teen',
        key: 'truyenTuoiTeen',
        href: '/truyen/truyen-tuoi-teen',
      },
      {
        label: 'Truyện người lớn',
        key: 'truyenNguoiLon',
        href: '/truyen/truyen-nguoi-lon',
      },
    ],
  },
  {
    label: 'Sách',
    key: 'sach',
    icon: <BookOutlined />,
    href: '/sach',
    children: [
      {
        label: 'Sách Ielts',
        key: 'sachIelts',
        href: '/sach/sach-ielts',
      },
      {
        label: 'Sách triết lý',
        key: 'sachTrietLy',
        href: '/sach/sach-triet-ly',
      },
    ],
  },
  {
    label: 'Báo',
    key: 'bao',
    icon: <ReadOutlined />,
    href: '/bao',
    children: [
      {
        label: 'Economist',
        key: 'economist',
        href: '/bao/tin-tuc-hang-ngay',
      },
      {
        label: 'Tin tức hàng ngày',
        key: 'voa',
        href: '/bao/tin-tuc-hang-ngay',
      },
    ],
  },
  {
    label: 'Trò chuyện',
    key: 'troChuyen',
    icon: <CommentOutlined />,
    href: '/tro-chuyen',
    children: [
      {
        label: 'Đối thoại học thuật',
        key: 'doiTHoaiHocThuat',
        href: '/tro-chuyen/doi-thoai-hoc-thuat',
      },
      {
        label: 'Trò chuyện hàng ngày',
        key: 'troChuyenThuongNgay',
        href: '/tro-chuyen/tro-chuyen-hang-ngay',
      },
    ],
  },
  {
    label: 'Test',
    key: 'test',
    icon: <CheckCircleOutlined />,
    href: '/test',
  },
  {
    label: 'Biểu đồ',
    key: 'bieudo',
    icon: <LineChartOutlined />,
    href: '/chart',
  },
];

const HeaderComponent = () => {
  const router = useRouter();
  const [current, setCurrent] = useState('home');
  const hasMounted = useHasMounted();

  const selectMenu = (e: { key: string }) => {
    setCurrent(e.key);
  };

  const handleLogout = () => {
    // Xóa JWT khỏi localStorage
    localStorage.removeItem('jwt');
    message.success('Bạn đã đăng xuất thành công.');

    // Chuyển hướng đến trang login
    router.push('/login');
  };

  const renderMenuItems: any = (items: CustomMenuItem[]) =>
    items.map((item) => {
      if (item.children) {
        return {
          ...item,
          label: item.label,
          children: renderMenuItems(item.children),
        };
      }
      return {
        ...item,
        label: item.href ? (
          <Link href={item.href}>{item.label}</Link>
        ) : (
          item.label
        ),
      };
    });

  if (!hasMounted) return <></>;

  return (
    <div className="headerClass">
      <Menu
        onClick={selectMenu}
        selectedKeys={[current]}
        mode="horizontal"
        items={renderMenuItems(items)}
        style={{ display: 'inline-block', width: 'calc(100% - 120px)' }}
      />
      <Button
        type="primary"
        icon={<LogoutOutlined />}
        style={{
          position: 'absolute',
          top: '0',
          right: '0',
          margin: '10px',
        }}
        onClick={handleLogout}
      >
        Đăng xuất
      </Button>
    </div>
  );
};

export default HeaderComponent;
