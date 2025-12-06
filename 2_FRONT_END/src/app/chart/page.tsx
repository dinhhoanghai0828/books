'use client';
import { getChart } from '@/utils/apiService';
import { Button, DatePicker, message, Space, Table } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
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
import { SortOrder } from 'antd/es/table/interface';
const ChartPage = () => {
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<any>(dayjs().subtract(1, 'month'));
  const [endDate, setEndDate] = useState<any>(dayjs());
  const [extremeData, setExtremeData] = useState([]);

  const fetchChartData = async () => {
    if (!startDate || !endDate) {
      message.warning(
        'Vui lòng chọn ngày bắt đầu và ngày kết thúc trước khi tìm kiếm!'
      );
      return;
    }

    setLoading(true);
    try {
      const data = await getChart(
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD')
      );
      const processedData = data.map((item) => {
        const domesticRingPurchasePrice = Number(
          item.domesticRingPurchasePrice
        );
        const worldPrice = Number(item.worldPrice);
        const worldPriceVND = Number(item.worldPriceVND);
        const domesticPurchasePrice = Number(item.domesticPurchasePrice);

        // Check for NaN after conversion.  This is crucial for handling invalid data.
        if (
          isNaN(domesticRingPurchasePrice) ||
          isNaN(worldPrice) ||
          isNaN(worldPriceVND) ||
          isNaN(domesticPurchasePrice)
        ) {
          console.error('Invalid number found in data:', item);
          return { ...item, ringWorldDiff: NaN, domesticWorldDiff: NaN }; // Or handle it differently
        }

        return {
          ...item,
          ringWorldDiff: domesticRingPurchasePrice - worldPriceVND,
          domesticWorldDiff: domesticPurchasePrice - worldPriceVND,
        };
      });
      setFilteredData(processedData);
      console.log(processedData);
      if (processedData.length > 0) {
        const minDiff = processedData.reduce((prev, curr) =>
          parseFloat(curr.totalInvestmentDiff) < parseFloat(prev.totalInvestmentDiff) ? curr : prev
        );
        const maxDiff = processedData.reduce((prev, curr) =>
          parseFloat(curr.totalInvestmentDiff) > parseFloat(prev.totalInvestmentDiff) ? curr : prev
        );
        setExtremeData([minDiff, maxDiff]);
      }
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu biểu đồ!');
    }
    setLoading(false);
  };

  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD'),
      sorter: (a: any, b: any) =>
        dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      defaultSortOrder: 'descend' as SortOrder, // Fix lỗi kiểu dữ liệu
    },
    {
      title: 'Giá Thế Giới',
      dataIndex: 'worldPrice',
      key: 'worldPrice',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: 'Tỷ giá',
      dataIndex: 'dollarPrice',
      key: 'dollarPrice',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: 'Quy đổi VND',
      dataIndex: 'worldPriceVND',
      key: 'worldPriceVND',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: 'Giá M shop bán',
      dataIndex: 'domesticPurchasePrice',
      key: 'domesticPurchasePrice',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: 'Giá M shop mua',
      dataIndex: 'domesticSalePrice',
      key: 'domesticPurchasePrice',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: 'Giá N shop bán',
      dataIndex: 'domesticRingPurchasePrice',
      key: 'domesticRingPurchasePrice',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: 'Giá N shop mua',
      dataIndex: 'domesticRingSalePrice',
      key: 'domesticRingPurchasePrice',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: 'Chênh Lệch N - Thế Giới',
      dataIndex: 'ringWorldDiff',
      key: 'ringWorldDiff',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: 'Chênh Lệch M - Thế Giới',
      dataIndex: 'domesticWorldDiff',
      key: 'domesticWorldDiff',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: 'Lợi nhuận M',
      dataIndex: 'profitGoldBar',
      key: 'profitGoldBar',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: 'Lợi nhuận N',
      dataIndex: 'profitGoldRing',
      key: 'profitGoldRing',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: 'Tổng lợi nhuận',
      dataIndex: 'totalProfit',
      key: 'totalProfit',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: 'Tiền lãi/Tiền vốn',
      dataIndex: 'totalInvestment',
      key: 'totalInvestment',
      render: (value: number) => value?.toLocaleString() || '-',
    },
  ];

  const extremeColumns = [
    {
      title: 'Ngày',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => dayjs(text).format('YYYY-MM-DD'),
    },
    {
      title: 'Giá Thế Giới',
      dataIndex: 'worldPrice',
      key: 'worldPrice',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: 'Tỷ giá',
      dataIndex: 'dollarPrice',
      key: 'dollarPrice',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: 'Quy đổi VND',
      dataIndex: 'worldPriceVND',
      key: 'worldPriceVND',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: 'Giá M shop bán',
      dataIndex: 'domesticPurchasePrice',
      key: 'domesticPurchasePrice',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: 'Giá M shop mua',
      dataIndex: 'domesticSalePrice',
      key: 'domesticPurchasePrice',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: 'Giá N shop bán',
      dataIndex: 'domesticRingPurchasePrice',
      key: 'domesticRingPurchasePrice',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: 'Giá N shop mua',
      dataIndex: 'domesticRingSalePrice',
      key: 'domesticRingPurchasePrice',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: 'Chênh Lệch N - Thế Giới',
      dataIndex: 'ringWorldDiff',
      key: 'ringWorldDiff',
      render: (value) => value?.toLocaleString() || '-',
    },
    {
      title: 'Chênh Lệch M - Thế Giới',
      dataIndex: 'domesticWorldDiff',
      key: 'domesticWorldDiff',
      render: (value) => value?.toLocaleString() || '-',
    },
    {
      title: 'Lợi nhuận M',
      dataIndex: 'profitGoldBar',
      key: 'profitGoldBar',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: 'Lợi nhuận N',
      dataIndex: 'profitGoldRing',
      key: 'profitGoldRing',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: 'Tổng lợi nhuận',
      dataIndex: 'totalProfit',
      key: 'totalProfit',
      render: (value) => value?.toLocaleString() || '-',
    },
    {
      title: 'Tiền lãi/Tiền vốn',
      dataIndex: 'totalInvestment',
      key: 'totalInvestment',
      render: (value: number) => value?.toLocaleString() || '-',
    },
  ];

  return (
    <div className="container">
      <h2 className="title">Biểu Đồ</h2>
      <Space className="controls">
        <DatePicker
          value={startDate}
          onChange={(date) => setStartDate(date)}
          format="DD-MM-YYYY"
          size="small"
          placeholder="Chọn ngày bắt đầu"
        />
        <DatePicker
          value={endDate}
          onChange={(date) => setEndDate(date)}
          format="DD-MM-YYYY"
          size="small"
          placeholder="Chọn ngày kết thúc"
        />

        <Button type="primary" onClick={fetchChartData} loading={loading}>
          Tìm kiếm
        </Button>
      </Space>
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
            <Tooltip
              contentStyle={{ backgroundColor: 'white', borderRadius: 5 }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="worldPrice"
              stroke="#007bff"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="Thế giới"
            />
            <Line
              type="monotone"
              dataKey="worldPriceVND"
              stroke="#007bff"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="Thế giới VND"
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
              stroke="gold" // Or stroke="#FFFF00"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="N"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="table-wrapper">
        <h3 className="subtitle">Ngày có chênh lệch thấp nhất và cao nhất</h3>
        <Table
          dataSource={extremeData}
          columns={extremeColumns}
          rowKey="createdAt"
          pagination={false}
        />
      </div>
      <div className="table-wrapper">
        <h3 className="subtitle">Thống Kê Chi Tiết</h3>
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="createdAt"
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  );
};

export default ChartPage;
