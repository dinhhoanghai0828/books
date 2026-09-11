'use client';
import { getChart } from '@/utils/apiService';
import { Button, DatePicker, Input, message, Space, Table } from 'antd';
import { SortOrder } from 'antd/es/table/interface';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import '../../styles/chart.css';

// ============================================================
// TYPES
// ============================================================

// Du lieu da xu ly them 2 truong chenh lech tinh toan
interface ChartRowData {
  createdAt: string;
  worldPrice: number;
  worldPriceVND: number;
  domesticPurchasePrice: number;
  domesticSalePrice: number;
  domesticRingPurchasePrice: number;
  domesticRingSalePrice: number;
  dollarPrice: number;
  profitGoldBar: number;
  profitGoldRing: number;
  totalProfit: number;
  totalInvestment: number;
  totalInvestmentDiff: number;
  ringWorldDiff: number;
  domesticWorldDiff: number;
}

// ============================================================
// CONSTANTS
// ============================================================

// Dinh nghia cau hinh cac cot dung chung cho ca 2 bang (bang chinh va bang extreme)
const SHARED_COLUMNS = [
  {
    title: 'Ngày',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (text: string) => dayjs(text).format('YYYY-MM-DD'),
    sorter: (a: ChartRowData, b: ChartRowData) =>
      dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    defaultSortOrder: 'descend' as SortOrder,
  },
  {
    title: 'Giá Thế Giới',
    dataIndex: 'worldPrice',
    key: 'worldPrice',
    render: (value: number | string) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num) ? num.toLocaleString('vi-VN') : '-';
    },
  },
  {
    title: 'Tỷ giá',
    dataIndex: 'dollarPrice',
    key: 'dollarPrice',
    render: (value: number | string) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num) ? num.toLocaleString('vi-VN') : '-';
    },
  },
  {
    title: 'Quy đổi VND',
    dataIndex: 'worldPriceVND',
    key: 'worldPriceVND',
    render: (value: number | string) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num) ? num.toLocaleString('vi-VN') : '-';
    },
  },
  {
    title: 'Giá SJC bán ra',
    dataIndex: 'domesticPurchasePrice',
    key: 'domesticPurchasePrice',
    render: (value: number | string) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num) ? num.toLocaleString('vi-VN') : '-';
    },
  },
  {
    title: 'Giá SJC mua vào',
    dataIndex: 'domesticSalePrice',
    key: 'domesticSalePrice',
    render: (value: number | string) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num) ? num.toLocaleString('vi-VN') : '-';
    },
  },
  {
    title: 'Giá Nhẫn bán ra',
    dataIndex: 'domesticRingPurchasePrice',
    key: 'domesticRingPurchasePrice',
    render: (value: number | string) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num) ? num.toLocaleString('vi-VN') : '-';
    },
  },
  {
    title: 'Giá Nhẫn mua vào',
    dataIndex: 'domesticRingSalePrice',
    key: 'domesticRingSalePrice',
    render: (value: number | string) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num) ? num.toLocaleString('vi-VN') : '-';
    },
  },
  {
    title: 'Chênh lệch Nhẫn - Thế Giới',
    dataIndex: 'ringWorldDiff',
    key: 'ringWorldDiff',
    render: (value: number | string) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num) ? num.toLocaleString('vi-VN') : '-';
    },
  },
  {
    title: 'Chênh lệch SJC - Thế Giới',
    dataIndex: 'domesticWorldDiff',
    key: 'domesticWorldDiff',
    render: (value: number | string) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num) ? num.toLocaleString('vi-VN') : '-';
    },
  },
  {
    title: 'Tiền lãi SJC',
    dataIndex: 'profitGoldBar',
    key: 'profitGoldBar',
    render: (value: number | string) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num) ? num.toLocaleString('vi-VN') : '-';
    },
  },
  {
    title: 'Tiền lãi Nhẫn',
    dataIndex: 'profitGoldRing',
    key: 'profitGoldRing',
    render: (value: number | string) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num) ? num.toLocaleString('vi-VN') : '-';
    },
  },
  {
    title: 'Tiền lãi',
    dataIndex: 'totalProfit',
    key: 'totalProfit',
    render: (value: number | string) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num) ? num.toLocaleString('vi-VN') : '-';
    },
  },
  {
    title: 'Tiền lãi / Tiền vốn',
    dataIndex: 'totalInvestment',
    key: 'totalInvestment',
    render: (value: number | string) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num) ? num.toLocaleString('vi-VN') : '-';
    },
  },
];

// ============================================================
// COMPONENT
// ============================================================

const ChartPage = () => {
  const [filteredData, setFilteredData] = useState<ChartRowData[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Dayjs>(dayjs().subtract(1, 'month'));
  const [endDate, setEndDate] = useState<Dayjs>(dayjs());
  
  // Search filters for prices (range min-max)
  const [worldPriceMin, setWorldPriceMin] = useState<string>('');
  const [worldPriceMax, setWorldPriceMax] = useState<string>('');
  const [shopNPurchasePriceMin, setShopNPurchasePriceMin] = useState<string>('');
  const [shopNPurchasePriceMax, setShopNPurchasePriceMax] = useState<string>('');
  const [shopMPurchasePriceMin, setShopMPurchasePriceMin] = useState<string>('');
  const [shopMPurchasePriceMax, setShopMPurchasePriceMax] = useState<string>('');

  // Format number to VND style (dot separator)
  const formatNumber = (value: string): string => {
    if (!value) return '';
    const cleanValue = value.replace(/\./g, '');
    const num = parseFloat(cleanValue);
    if (isNaN(num)) return value;
    return num.toLocaleString('vi-VN');
  };

  // Clean formatted number back to plain number for API
  const cleanNumber = (value: string): string => {
    return value.replace(/\./g, '');
  };

  // Gia tri min/max theo tong chenh lech dau tu va theo gia the gioi
  const [extremeData, setExtremeData] = useState<ChartRowData[]>([]);
  const [extremeWorldPriceData, setExtremeWorldPriceData] = useState<ChartRowData[]>([]);

  // Lay du lieu bieu do tu API, xu ly them 2 truong chenh lech va tim min/max
  const fetchChartData = async () => {
    if (!startDate || !endDate) {
      message.warning('Vui long chon ngay bat dau va ngay ket thuc truoc khi tim kiem!');
      return;
    }

    setLoading(true);
    try {
      const data = await getChart(
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD'),
        cleanNumber(worldPriceMin),
        cleanNumber(worldPriceMax),
        cleanNumber(shopNPurchasePriceMin),
        cleanNumber(shopNPurchasePriceMax),
        cleanNumber(shopMPurchasePriceMin),
        cleanNumber(shopMPurchasePriceMax)
      );

      // Tinh toan 2 truong chenh lech bo sung cho moi dong du lieu
      const processedData: ChartRowData[] = data.map((item) => {
        const ringPrice = Number(item.domesticRingPurchasePrice);
        const worldVND = Number(item.worldPriceVND);
        const domesticPrice = Number(item.domesticPurchasePrice);

        return {
          ...(item as any),
          ringWorldDiff: ringPrice - worldVND,
          domesticWorldDiff: domesticPrice - worldVND,
        };
      });

      setFilteredData(processedData);

      if (processedData.length > 0) {
        // Tim dong co tong chenh lech dau tu thap nhat va cao nhat
        const minDiff = processedData.reduce((prev, curr) =>
          Number(curr.totalInvestmentDiff) < Number(prev.totalInvestmentDiff) ? curr : prev
        );
        const maxDiff = processedData.reduce((prev, curr) =>
          Number(curr.totalInvestmentDiff) > Number(prev.totalInvestmentDiff) ? curr : prev
        );
        setExtremeData([minDiff, maxDiff]);

        // Tim dong co gia the gioi thap nhat va cao nhat
        const minWorldPrice = processedData.reduce((prev, curr) =>
          curr.worldPrice < prev.worldPrice ? curr : prev
        );
        const maxWorldPrice = processedData.reduce((prev, curr) =>
          curr.worldPrice > prev.worldPrice ? curr : prev
        );
        setExtremeWorldPriceData([minWorldPrice, maxWorldPrice]);
      }
    } catch {
      message.error('Loi khi tai du lieu bieu do!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2 className="title">Bieu Do</h2>

      {/* Bo loc ngay */}
      <div className="controls" style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 12 }} align="center">
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Giá Thế Giới (Min - Max)</label>
            <Space>
              <Input
                placeholder="Min"
                value={worldPriceMin}
                onChange={(e) => setWorldPriceMin(formatNumber(e.target.value))}
                size="middle"
                style={{ width: 100 }}
              />
              <Input
                placeholder="Max"
                value={worldPriceMax}
                onChange={(e) => setWorldPriceMax(formatNumber(e.target.value))}
                size="middle"
                style={{ width: 100 }}
              />
            </Space>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Giá Nhẫn bán ra (Min - Max)</label>
            <Space>
              <Input
                placeholder="Min"
                value={shopNPurchasePriceMin}
                onChange={(e) => setShopNPurchasePriceMin(formatNumber(e.target.value))}
                size="middle"
                style={{ width: 100 }}
              />
              <Input
                placeholder="Max"
                value={shopNPurchasePriceMax}
                onChange={(e) => setShopNPurchasePriceMax(formatNumber(e.target.value))}
                size="middle"
                style={{ width: 100 }}
              />
            </Space>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Giá SJC bán ra (Min - Max)</label>
            <Space>
              <Input
                placeholder="Min"
                value={shopMPurchasePriceMin}
                onChange={(e) => setShopMPurchasePriceMin(formatNumber(e.target.value))}
                size="middle"
                style={{ width: 100 }}
              />
              <Input
                placeholder="Max"
                value={shopMPurchasePriceMax}
                onChange={(e) => setShopMPurchasePriceMax(formatNumber(e.target.value))}
                size="middle"
                style={{ width: 100 }}
              />
            </Space>
          </div>
        </Space>
        
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
          <Space align="center">
            <DatePicker
              value={startDate}
              onChange={(date) => date && setStartDate(date)}
              format="DD-MM-YYYY"
              size="middle"
              placeholder="Chon ngay bat dau"
            />
            <DatePicker
              value={endDate}
              onChange={(date) => date && setEndDate(date)}
              format="DD-MM-YYYY"
              size="middle"
              placeholder="Chon ngay ket thuc"
            />
            <Button type="primary" onClick={fetchChartData} loading={loading} size="middle">
              Tim kiem
            </Button>
          </Space>
        </div>
      </div>

      {/* Bieu do duong */}
      <div className="chartWrapper">
        <ResponsiveContainer width="100%" height={450}>
          <LineChart
            data={filteredData}
            margin={{ top: 100, right: 20, left: 50, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
            <XAxis
              dataKey="createdAt"
              tickFormatter={(tick) => dayjs(tick).format('YYYY-MM-DD')}
            />
            <YAxis tickFormatter={(value) => {
              const num = typeof value === 'string' ? parseFloat(value) : value;
              return !isNaN(num) ? num.toLocaleString('vi-VN') : '-';
            }} />
            <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: 5 }} />
            <Legend />
            <Line
              type="monotone"
              dataKey="worldPrice"
              stroke="#007bff"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="The gioi"
            />
            <Line
              type="monotone"
              dataKey="worldPriceVND"
              stroke="#007bff"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="The gioi VND"
            />
            <Line
              type="monotone"
              dataKey="domesticPurchasePrice"
              stroke="#dc3545"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="M"
            />
            <Line
              type="monotone"
              dataKey="domesticRingPurchasePrice"
              stroke="gold"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="N"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bang gia the gioi min/max */}
      <div className="table-wrapper">
        <h3 className="subtitle">Ngay co Gia The Gioi thap nhat va cao nhat</h3>
        <Table
          dataSource={extremeWorldPriceData}
          columns={SHARED_COLUMNS}
          rowKey="createdAt"
          pagination={false}
        />
      </div>

      {/* Bang chenh lech dau tu min/max */}
      <div className="table-wrapper">
        <h3 className="subtitle">Ngay co chenh lech thap nhat va cao nhat</h3>
        <Table
          dataSource={extremeData}
          columns={SHARED_COLUMNS}
          rowKey="createdAt"
          pagination={false}
        />
      </div>

      {/* Bang thong ke toan bo du lieu */}
      <div className="table-wrapper">
        <h3 className="subtitle">Thong Ke Chi Tiet</h3>
        <Table
          dataSource={filteredData}
          columns={SHARED_COLUMNS}
          rowKey="createdAt"
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  );
};

export default ChartPage;
