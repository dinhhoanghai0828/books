'use client';
import { useHasMounted } from '@/utils/customHook';
import {
  BookOutlined,
  CheckCircleOutlined,
  CommentOutlined,
  HomeOutlined,
  LineChartOutlined,
  LogoutOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import { Button, Menu, message } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

// ============================================================
// TYPES
// ============================================================

interface MenuItem {
  label: string;
  key: string;
  icon?: React.ReactNode;
  href?: string;
  children?: MenuItem[];
}

// ============================================================
// MENU CONFIG
// ============================================================

// Cau hinh cac muc menu chinh va menu con cua header
const MENU_ITEMS: MenuItem[] = [
  {
    label: 'Trang Chu',
    key: 'home',
    icon: <HomeOutlined />,
    href: '/',
  },
  {
    label: 'Tieng anh co ban',
    key: 'tieng-anh-co-ban',
    icon: <ReadOutlined />,
    children: [
      { label: 'Tieng anh co ban cap do 1', key: 'tienganhcoban1', href: '/tieng-anh-co-ban/tieng-anh-co-ban-cap-do-1' },
      { label: 'Tieng anh co ban cap do 2', key: 'tienganhcoban2', href: '/tieng-anh-co-ban/tieng-anh-co-ban-cap-do-2' },
    ],
  },
  {
    label: 'Eslfast',
    key: 'tieng-anh-theo-cap-do',
    icon: <ReadOutlined />,
    children: [
      { label: 'Beginner (A1)',            key: 'so-cap-1',      href: '/esl-fast/so-cap-1' },
      { label: 'Elementary (A2)',          key: 'so-cap-2',      href: '/esl-fast/so-cap-2' },
      { label: 'Intermediate (B1)',        key: 'trung-cap',     href: '/esl-fast/trung-cap' },
      { label: 'Upper Intermediate (B2)', key: 'trung-cao-cap', href: '/tesl-fast/trung-cao-cap' },
      { label: 'Advanced (C1)',            key: 'nang-cao',      href: '/esl-fast/nang-cao' },
      { label: 'Proficient (C2)',          key: 'ban-xu',        href: '/esl-fast/ban-xu' },
    ],
  },
  {
    label: 'Truyen',
    key: 'truyen',
    icon: <ReadOutlined />,
    children: [
      { label: 'Truyen truyen cam hung', key: 'truyenTruyenCamHung', href: '/truyen/truyen-truyen-cam-hung' },
      { label: 'Truyen kinh di',         key: 'truyenKinhDi',        href: '/truyen/truyen-kinh-di' },
      { label: 'Truyen co tich',         key: 'truyenCoTich',        href: '/truyen/truyen-co-tich' },
      { label: 'Truyen tuoi teen',       key: 'truyenTuoiTeen',      href: '/truyen/truyen-tuoi-teen' },
      { label: 'Truyen nguoi lon',       key: 'truyenNguoiLon',      href: '/truyen/truyen-nguoi-lon' },
    ],
  },
  {
    label: 'Sach',
    key: 'sach',
    icon: <BookOutlined />,
    children: [
      { label: 'Sach Ielts',    key: 'sachIelts',   href: '/sach/sach-ielts' },
      { label: 'Sach triet ly', key: 'sachTrietLy', href: '/sach/sach-triet-ly' },
    ],
  },
  {
    label: 'Bao',
    key: 'bao',
    icon: <ReadOutlined />,
    children: [
      { label: 'Economist',       key: 'economist', href: '/bao/tin-tuc-hang-ngay' },
      { label: 'Tin tuc hang ngay', key: 'voa',     href: '/bao/tin-tuc-hang-ngay' },
    ],
  },
  {
    label: 'Tro chuyen',
    key: 'troChuyen',
    icon: <CommentOutlined />,
    children: [
      { label: 'Doi thoai hoc thuat',   key: 'doiThoaiHocThuat',    href: '/tro-chuyen/doi-thoai-hoc-thuat' },
      { label: 'Tro chuyen hang ngay',  key: 'troChuyenHangNgay',   href: '/tro-chuyen/tro-chuyen-hang-ngay' },
    ],
  },
  {
    label: 'Test',
    key: 'test',
    icon: <CheckCircleOutlined />,
    href: '/test',
  },
  {
    label: 'Bieu do',
    key: 'bieudo',
    icon: <LineChartOutlined />,
    href: '/chart',
  },
];

// ============================================================
// COMPONENT
// ============================================================

const HeaderComponent = () => {
  const router = useRouter();
  const hasMounted = useHasMounted();
  const [current, setCurrent] = useState('home');

  // Xoa JWT va chuyen nguoi dung ve trang dang nhap
  const handleLogout = () => {
    localStorage.removeItem('jwt');
    message.success('Ban da dang xuat thanh cong.');
    router.push('/login');
  };

  // Chuyen doi cau hinh menu thanh format cua Ant Design Menu,
  // cac muc co href duoc boc trong Link, cac muc co children xu ly de quy
  const buildMenuItems = (items: MenuItem[]): any[] =>
    items.map((item) => {
      if (item.children) {
        return {
          ...item,
          label: item.label,
          children: buildMenuItems(item.children),
        };
      }
      return {
        ...item,
        label: item.href ? <Link href={item.href}>{item.label}</Link> : item.label,
      };
    });

  if (!hasMounted) return null;

  return (
    <div className="headerClass">
      <Menu
        onClick={(e) => setCurrent(e.key)}
        selectedKeys={[current]}
        mode="horizontal"
        items={buildMenuItems(MENU_ITEMS)}
        style={{ display: 'inline-block', width: 'calc(100% - 120px)' }}
      />
      <Button
        type="primary"
        icon={<LogoutOutlined />}
        onClick={handleLogout}
        style={{ position: 'absolute', top: 0, right: 0, margin: 10 }}
      >
        Dang xuat
      </Button>
    </div>
  );
};

export default HeaderComponent;
