import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';

const PortfolioChart = () => {
  const { theme } = useTheme();
  
  const data = [
    { time: '9:00', value: 120000 },
    { time: '10:00', value: 121500 },
    { time: '11:00', value: 119800 },
    { time: '12:00', value: 123200 },
    { time: '13:00', value: 122400 },
    { time: '14:00', value: 124800 },
    { time: '15:00', value: 125847 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke={theme === 'dark' ? '#3f3f46' : '#e5e7eb'} 
        />
        <XAxis 
          dataKey="time" 
          stroke={theme === 'dark' ? '#71717a' : '#6b7280'} 
        />
        <YAxis 
          stroke={theme === 'dark' ? '#71717a' : '#6b7280'} 
        />
        <Tooltip
          contentStyle={{
            backgroundColor: theme === 'dark' ? '#18181b' : '#fff',
            border: theme === 'dark' ? '1px solid #3f3f46' : '1px solid #e5e7eb',
            borderRadius: '8px',
            color: theme === 'dark' ? '#fff' : '#000',
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={theme === 'dark' ? '#f97316' : '#2563eb'}
          strokeWidth={3}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PortfolioChart;