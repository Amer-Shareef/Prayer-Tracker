import React from 'react';

const SimpleChart = ({ data, title, type = 'ring' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  // Calculate percentages for ring chart
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (type === 'ring') {
    // Simple ring chart using CSS
    const mainValue = data[0]?.value || 0;
    const maxValue = data[0]?.total || 100;
    const percentage = maxValue > 0 ? (mainValue / maxValue) * 100 : 0;
    
    return (
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        
        {/* Ring Chart */}
        <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              className="stroke-gray-200"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              className={`${data[0]?.color || 'stroke-blue-500'}`}
              strokeWidth="3"
              strokeDasharray={`${percentage * 1.005}, 100.5`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{mainValue}</span>
            <span className="text-xs text-gray-500">{maxValue}</span>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          <p className="font-medium">{data[0]?.label}</p>
          <p>{Math.round(percentage)}% completion</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{item.label}</span>
            <span className="font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleChart;
