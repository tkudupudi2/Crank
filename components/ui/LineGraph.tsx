'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Settings } from 'lucide-react'

interface DataPoint {
  date: string
  value: number
}

interface LineGraphProps {
  data: DataPoint[]
  height?: number
  showGrid?: boolean
  showDots?: boolean
  className?: string
  darkMode?: boolean
  showTimeframeSelector?: boolean
}

export function LineGraph({
  data,
  height = 200,
  showGrid = false,
  showDots = true,
  className,
  darkMode = true,
  showTimeframeSelector = true
}: LineGraphProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M')
  const { pathData, viewBox, minValue, maxValue, xScale, yScale } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        pathData: '',
        viewBox: '0 0 400 200',
        minValue: 0,
        maxValue: 100,
        xScale: 0,
        yScale: 0
      }
    }

    const width = 400
    const padding = 20
    const chartWidth = width - (padding * 2)
    const chartHeight = height - 80 // Leave space for timeframe selector

    // Find min and max values
    const values = data.map(d => d.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const valueRange = maxValue - minValue || 1

    // Scale factors
    const xScale = chartWidth / Math.max(data.length - 1, 1)
    const yScale = chartHeight / valueRange

    // Generate path data
    const points = data.map((point, index) => {
      const x = padding + (index * xScale)
      const y = padding + ((maxValue - point.value) * yScale)
      return `${x},${y}`
    })

    const pathData = `M ${points.join(' L ')}`

    return {
      pathData,
      viewBox: `0 0 ${width} ${height}`,
      minValue,
      maxValue,
      xScale,
      yScale
    }
  }, [data, height])

  const timeframes = ['LIVE', '1D', '1W', '1M', '3M', 'YTD', '1Y']

  if (!data || data.length === 0) {
    return (
      <div className={cn(
        'flex items-center justify-center',
        darkMode ? 'text-gray-400' : 'text-gray-500',
        className
      )} style={{ height }}>
        <p>No data available</p>
      </div>
    )
  }

  if (data.length === 1) {
    return (
      <div className={cn(
        'flex items-center justify-center',
        darkMode ? 'text-gray-400' : 'text-gray-500',
        className
      )} style={{ height }}>
        <p>Need at least 2 data points to show trend</p>
      </div>
    )
  }

  return (
    <div className={cn(
      'w-full',
      darkMode ? 'bg-black' : 'bg-white',
      className
    )} style={{ height }}>
      {/* Main Graph Area */}
      <div className="relative" style={{ height: height - 60 }}>
        <svg
          viewBox={viewBox}
          className="w-full h-full"
          style={{ height: height - 60 }}
        >
          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke={darkMode ? "#10B981" : "#059669"} // Emerald-500 for dark, emerald-600 for light
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {showDots && data.map((point, index) => {
            const x = 20 + (index * xScale)
            const y = 20 + ((maxValue - point.value) * yScale)
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={index === data.length - 1 ? "4" : "0"} // Only show dot on last point
                fill={darkMode ? "#10B981" : "#059669"}
                stroke={darkMode ? "#000000" : "#ffffff"}
                strokeWidth="2"
              />
            )
          })}
        </svg>
      </div>

      {/* Timeframe Selector */}
      {showTimeframeSelector && (
        <div className="absolute bottom-0 left-0 right-0">
          {/* Separator line */}
          <div className={cn(
            "w-full h-px mb-4",
            darkMode ? "bg-gray-700" : "bg-gray-200"
          )} />
          
          {/* Timeframe buttons */}
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center space-x-6">
              {timeframes.map((timeframe) => (
                <button
                  key={timeframe}
                  onClick={() => setSelectedTimeframe(timeframe)}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    selectedTimeframe === timeframe
                      ? darkMode
                        ? "bg-emerald-500 text-black px-3 py-1 rounded-full"
                        : "bg-emerald-600 text-white px-3 py-1 rounded-full"
                      : darkMode
                        ? "text-emerald-400 hover:text-emerald-300"
                        : "text-emerald-600 hover:text-emerald-700"
                  )}
                >
                  {timeframe}
                </button>
              ))}
            </div>
            
            {/* Settings icon */}
            <button className={cn(
              "p-1 rounded hover:bg-opacity-20 transition-colors",
              darkMode 
                ? "text-emerald-400 hover:bg-emerald-400" 
                : "text-emerald-600 hover:bg-emerald-600"
            )}>
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
