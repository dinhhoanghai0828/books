'use client';
import { getChart } from '@/utils/apiService';
import { Button, DatePicker, message, Space, Table } from 'antd';
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
    title: 'Ngay',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (text: string) => dayjs(text).format('YYYY-MM-DD'),
    sorter: (a: ChartRowData, b: ChartRowData) =>
      dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    defaultSortOrder: 'descend' as SortOrder,
  },
  {
    title: 'Gia The Gioi',
    dataIndex: 'worldPrice',
    key: 'worldPrice',
    render: (value: number) => value?.toLocaleString() || '-',
  },
  {
    title: 'Ty gia',
    dataIndex: 'dollarPrice',
    key: 'dollarPrice',
    render: (value: number) => value?.toLocaleString() || '-',
  },
  {
    title: 'Quy doi VND',
    dataIndex: 'worldPriceVND',
    key: 'worldPriceVND',
    render: (value: number) => value?.toLocaleString() || '-',
  },
  {
    title: 'Gia M shop ban',
    dataIndex: 'domesticPurchasePrice',
    key: 'domesticPurchasePrice',
    render: (value: number) => value?.toLocaleString() || '-',
  },
  {
    title: 'Gia M shop mua',
    dataIndex: 'domesticSalePrice',
    key: 'domesticSalePrice',
    render: (value: number) => value?.toLocaleString() || '-',
  },
  {
    title: 'Gia N shop ban',
    dataIndex: 'domesticRingPurchasePrice',
    key: 'domesticRingPurchasePrice',
    render: (value: number) => value?.toLocaleString() || '-',
  },
  {
    title: 'Gia N shop mua',
    dataIndex: 'domesticRingSalePrice',
    key: 'domesticRingSalePrice',
    render: (value: number) => value?.toLocaleString() || '-',
  },
  {
    title: 'Chenh Lech N - The Gioi',
    dataIndex: 'ringWorldDiff',
    key: 'ringWorldDiff',
    render: (value: number) => value?.toLocaleString() || '-',
  },
  {
    title: 'Chenh Lech M - The Gioi',
    dataIndex: 'domesticWorldDiff',
    key: 'domesticWorldDiff',
    render: (value: number) => value?.toLocaleString() || '-',
  },
  {
    title: 'Loi nhuan M',
    dataIndex: 'profitGoldBar',
    key: 'profitGoldBar',
    render: (value: number) => value?.toLocaleString() || '-',
  },
  {
    title: 'Loi nhuan N',
    dataIndex: 'profitGoldRing',
    key: 'profitGoldRing',
    render: (value: number) => value?.toLocaleString() || '-',
  },
  {
    title: 'Tong loi nhuan',
    dataIndex: 'totalProfit',
    key: 'totalProfit',
    render: (value: number) => value?.toLocaleString() || '-',
  },
  {
    title: 'Tien lai / Tien von',
    dataIndex: 'totalInvestment',
    key: 'totalInvestment',
    render: (value: number) => value?.toLocaleString() || '-',
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
        endDate.format('YYYY-MM-DD')
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
      <Space className="controls">
        <DatePicker
          value={startDate}
          onChange={(date) => date && setStartDate(date)}
          format="DD-MM-YYYY"
          size="small"
          placeholder="Chon ngay bat dau"
        />
        <DatePicker
          value={endDate}
          onChange={(date) => date && setEndDate(date)}
          format="DD-MM-YYYY"
          size="small"
          placeholder="Chon ngay ket thuc"
        />
        <Button type="primary" onClick={fetchChartData} loading={loading}>
          Tim kiem
        </Button>
      </Space>

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
            <YAxis tickFormatter={(value) => value?.toLocaleString() || '-'} />
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
