"use client"

interface GoalCalculationDisplayProps {
  weeklyHours: number
  monthlyHours: number
  totalHours: number
}

export function GoalCalculationDisplay({ 
  weeklyHours, 
  monthlyHours, 
  totalHours 
}: GoalCalculationDisplayProps) {
  if (totalHours <= 0) return null

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex justify-start md:grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-400">週間: </span>
          <span className="text-white">{weeklyHours}時間</span>
        </div>
        <div>
          <span className="text-gray-400">月間: </span>
          <span className="text-white">{monthlyHours}時間</span>
        </div>
        <div>
          <span className="text-gray-400">総目標: </span>
          <span className="text-white font-medium">{totalHours}時間</span>
        </div>
      </div>
    </div>
  )
} 