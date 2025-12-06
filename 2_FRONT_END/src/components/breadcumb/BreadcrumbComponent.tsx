import { Breadcrumb } from 'antd';
import Link from 'next/link';

interface BreadCrumbComponentProps {
  items: { name: string; path?: string }[]; // Made path optional for current item
}

const BreadCrumbComponent = ({ items }: BreadCrumbComponentProps) => {
  const breadcrumbItems = items.map((item) => ({
    title: item.path ? (
      <Link href={item.path} className="breadcrumb-link">
        {item.name}
      </Link>
    ) : (
      <span className="breadcrumb-current">{item.name}</span>
    ),
  }));

  return <Breadcrumb className="breadCrumbClass" items={breadcrumbItems} />;
};

export default BreadCrumbComponent;
