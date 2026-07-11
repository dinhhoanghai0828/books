'use client';
import { Line } from '@ant-design/charts';

// ============================================================
// CHART COMPONENT
// Bieu do duong hien thi gia vang theo thoi gian
// Ve 3 duong: World Price, Domestic Purchase Price, Domestic Sale Price
// ============================================================

// Du lieu mau tinh (dung de demo bieu do, khong goi API)
const RAW_DATA = [
  { id: 32, worldPrice: '2062.000', domesticPurchasePrice: '76000000.000', domesticSalePrice: '74000000.000', createdAt: '2024-01-01 08:06:30' },
  { id: 9,  worldPrice: '2310.225', domesticPurchasePrice: '85100000.000', domesticSalePrice: '82900000.000', createdAt: '2024-05-02 15:51:31' },
  { id: 8,  worldPrice: '2310.225', domesticPurchasePrice: '85800000.000', domesticSalePrice: '83500000.000', createdAt: '2024-05-03 15:51:31' },
];

// Chuyen du lieu sang dinh dang phang de bieu do ve nhieu duong tren cung 1 truc
const formattedData = RAW_DATA.flatMap((item) => [
  { type: 'World Price',              value: parseFloat(item.worldPrice),              createdAt: item.createdAt },
  { type: 'Domestic Purchase Price', value: parseFloat(item.domesticPurchasePrice),  createdAt: item.createdAt },
  { type: 'Domestic Sale Price',     value: parseFloat(item.domesticSalePrice),       createdAt: item.createdAt },
]);

const config = {
  data: formattedData,
  xField: 'createdAt',
  yField: 'value',
  seriesField: 'type',
  xAxis: {
    label: {
      formatter: (v: string) => new Date(v).toLocaleDateString('vi-VN'),
    },
  },
  tooltip: {
    formatter: (datum: { type: string; value: number }) => ({
      name: datum.type,
      value: new Intl.NumberFormat('vi-VN').format(datum.value),
    }),
  },
  smooth: true,
  animation: {
    appear: { animation: 'path-in', duration: 3000 },
  },
};

const Chart: React.FC = () => <Line {...config} />;

export default Chart;
