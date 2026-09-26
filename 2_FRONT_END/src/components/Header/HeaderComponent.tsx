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
import React, { useState, useEffect } from 'react';
import { getCategories } from '@/utils/apiService';

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

interface CategoryDTO {
  uuid: string;
  slug: string;
  eng: string;
  vi: string;
  parentSlug: string | null;
  number: number;
  children?: CategoryDTO[];
}

// ============================================================
// MENU CONFIG
// ============================================================

// Cau hinh cac muc menu chinh va menu con cua header
const STATIC_MENU_ITEMS: MenuItem[] = [
  {
    label: 'Trang Chu',
    key: 'home',
    icon: <HomeOutlined />,
    href: '/',
  },
  {
    label: 'Từ mới',
    key: 'words',
    icon: <BookOutlined />,
    href: '/words',
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

// Ham chuyen doi CategoryDTO sang MenuItem
const buildCategoryMenuItems = (categories: CategoryDTO[]): MenuItem[] => {
  return categories.map(category => {
    const menuItem: MenuItem = {
      label: category.vi,
      key: category.slug,
      icon: <ReadOutlined />,
      href: `/${category.slug}`,
    };

    if (category.children && category.children.length > 0) {
      menuItem.children = buildCategoryMenuItems(category.children);
      // Xóa href nếu có children để hiển thị dropdown
      delete menuItem.href;
    }

    return menuItem;
  });
};

// ============================================================
// COMPONENT
// ============================================================

const HeaderComponent = () => {
  const router = useRouter();
  const hasMounted = useHasMounted();
  const [current, setCurrent] = useState('home');
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Loi khi lay danh sach categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

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

  // Combine static menu items with dynamic category menu items
  const menuItems = loading 
    ? STATIC_MENU_ITEMS 
    : [...STATIC_MENU_ITEMS, ...buildCategoryMenuItems(categories)];

  if (!hasMounted) return null;

  return (
    <div className="headerClass">
      <Menu
        onClick={(e) => setCurrent(e.key)}
        selectedKeys={[current]}
        mode="horizontal"
        items={buildMenuItems(menuItems)}
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