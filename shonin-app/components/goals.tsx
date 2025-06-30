"use client"

import { useState } from "react"
import { Plus, Target, Calendar, Clock, TrendingUp, AlertCircle, CheckCircle2, Edit2, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface Goal {
  id: string
  title: string
  description: string
  motivation: string
  targetValue: number
  currentValue: number
  unit: string
  deadline: string
  priority: "high" | "medium" | "low"
  category: string
  steps: Step[]
  createdAt: string
  status: "active" | "completed" | "paused"
}

interface Step {
  id: string
  title: string
  completed: boolean
  targetValue: number
  currentValue: number
  unit: string
}

interface GoalsProps {
  onBack: () => void
}

export function Goals({ onBack }: GoalsProps) {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: "1",
      title: "プログラミングスキル向上",
      description: "Webアプリケーション開発スキルを身につける",
      motivation: "転職して年収を上げたい。自分でサービスを作れるようになりたい。",
      targetValue: 300,
      currentValue: 45,
      unit: "時間",
      deadline: "2024-12-31",
      priority: "high",
      category: "スキルアップ",
      steps: [
        { id: "1-1", title: "HTML/CSS基礎", completed: true, targetValue: 40, currentValue: 40, unit: "時間" },
        { id: "1-2", title: "JavaScript基礎", completed: false, targetValue: 60, currentValue: 25, unit: "時間" },
        { id: "1-3", title: "React学習", completed: false, targetValue: 80, currentValue: 0, unit: "時間" },
        { id: "1-4", title: "ポートフォリオ作成", completed: false, targetValue: 120, currentValue: 0, unit: "時間" }
      ],
      createdAt: "2024-01-15",
      status: "active"
    }
  ])

  const [isAddingGoal, setIsAddingGoal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    motivation: "",
    targetValue: 0,
    unit: "",
    deadline: "",
    priority: "medium" as const,
    category: ""
  })
  const [editGoal, setEditGoal] = useState<{
    title: string
    description: string
    motivation: string
    targetValue: number
    unit: string
    deadline: string
    priority: "high" | "medium" | "low"
    category: string
  }>({
    title: "",
    description: "",
    motivation: "",
    targetValue: 0,
    unit: "",
    deadline: "",
    priority: "medium",
    category: ""
  })

  const priorityColors = {
    high: "bg-red-100 text-red-800 border-red-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-green-100 text-green-800 border-green-200"
  }

  const priorityLabels = {
    high: "高",
    medium: "中",
    low: "低"
  }

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  const getRemainingDays = (deadline: string) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.targetValue || !newGoal.deadline) return

    const goal: Goal = {
      id: Date.now().toString(),
      ...newGoal,
      currentValue: 0,
      steps: [],
      createdAt: new Date().toISOString().split('T')[0],
      status: "active"
    }

    setGoals([...goals, goal])
    setNewGoal({
      title: "",
      description: "",
      motivation: "",
      targetValue: 0,
      unit: "",
      deadline: "",
      priority: "medium",
      category: ""
    })
    setIsAddingGoal(false)
  }

  const handleEditGoal = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId)
    if (goal) {
      setEditGoal({
        title: goal.title,
        description: goal.description,
        motivation: goal.motivation,
        targetValue: goal.targetValue,
        unit: goal.unit,
        deadline: goal.deadline,
        priority: goal.priority,
        category: goal.category
      })
      setEditingGoal(goalId)
    }
  }

  const handleUpdateGoal = () => {
    if (!editGoal.title || !editGoal.targetValue || !editGoal.deadline || !editingGoal) return

    setGoals(goals.map(goal => 
      goal.id === editingGoal 
        ? { ...goal, ...editGoal }
        : goal
    ))
    
    setEditGoal({
      title: "",
      description: "",
      motivation: "",
      targetValue: 0,
      unit: "",
      deadline: "",
      priority: "medium",
      category: ""
    })
    setEditingGoal(null)
  }

  const handleCancelEdit = () => {
    setEditingGoal(null)
    setEditGoal({
      title: "",
      description: "",
      motivation: "",
      targetValue: 0,
      unit: "",
      deadline: "",
      priority: "medium",
      category: ""
    })
  }

  const handleDeleteGoal = (goalId: string) => {
    const confirmed = confirm("この目標を削除しますか？")
    if (confirmed) {
      setGoals(goals.filter(goal => goal.id !== goalId))
    }
  }

  const handleUpdateProgress = (goalId: string, newValue: number) => {
    setGoals(goals.map(goal => 
      goal.id === goalId 
        ? { ...goal, currentValue: newValue }
        : goal
    ))
  }

  const handleToggleStep = (goalId: string, stepId: string) => {
    setGoals(goals.map(goal => 
      goal.id === goalId 
        ? {
            ...goal,
            steps: goal.steps.map(step => 
              step.id === stepId 
                ? { ...step, completed: !step.completed }
                : step
            )
          }
        : goal
    ))
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center">
            <Target className="w-6 h-6 mr-2" />
            目標管理
          </h1>
          <Button
            onClick={() => setIsAddingGoal(true)}
            className="bg-green-500 hover:bg-green-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            新しい目標
          </Button>
        </div>
      </div>

      <div className="p-6 container mx-auto max-w-6xl">
        {/* 目標編集フォーム */}
        {editingGoal && (
          <Card className="bg-gray-900 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white">目標を編集</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">目標タイトル *</Label>
                  <Input
                    value={editGoal.title}
                    onChange={(e) => setEditGoal({...editGoal, title: e.target.value})}
                    placeholder="具体的な目標を入力"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">カテゴリ</Label>
                  <Input
                    value={editGoal.category}
                    onChange={(e) => setEditGoal({...editGoal, category: e.target.value})}
                    placeholder="例：スキルアップ、健康、趣味"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">詳細説明</Label>
                <Textarea
                  value={editGoal.description}
                  onChange={(e) => setEditGoal({...editGoal, description: e.target.value})}
                  placeholder="目標の詳細を説明してください"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">なぜこの目標を達成したいのか？ *</Label>
                <Textarea
                  value={editGoal.motivation}
                  onChange={(e) => setEditGoal({...editGoal, motivation: e.target.value})}
                  placeholder="目標を達成したい理由や動機を具体的に書いてください"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">目標数値 *</Label>
                  <Input
                    type="number"
                    value={editGoal.targetValue || ""}
                    onChange={(e) => setEditGoal({...editGoal, targetValue: Number(e.target.value)})}
                    placeholder="100"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">単位 *</Label>
                  <Input
                    value={editGoal.unit}
                    onChange={(e) => setEditGoal({...editGoal, unit: e.target.value})}
                    placeholder="時間、回、冊など"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">期限 *</Label>
                  <Input
                    type="date"
                    value={editGoal.deadline}
                    onChange={(e) => setEditGoal({...editGoal, deadline: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">優先度</Label>
                  <Select value={editGoal.priority} onValueChange={(value: any) => setEditGoal({...editGoal, priority: value})}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="high">高</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="low">低</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button onClick={handleUpdateGoal} className="bg-green-500 hover:bg-green-600">
                  更新
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  キャンセル
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 目標追加フォーム */}
        {isAddingGoal && (
          <Card className="bg-gray-900 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white">新しい目標を追加</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">目標タイトル *</Label>
                  <Input
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                    placeholder="具体的な目標を入力"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">カテゴリ</Label>
                  <Input
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                    placeholder="例：スキルアップ、健康、趣味"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">詳細説明</Label>
                <Textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  placeholder="目標の詳細を説明してください"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">なぜこの目標を達成したいのか？ *</Label>
                <Textarea
                  value={newGoal.motivation}
                  onChange={(e) => setNewGoal({...newGoal, motivation: e.target.value})}
                  placeholder="目標を達成したい理由や動機を具体的に書いてください"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">目標数値 *</Label>
                  <Input
                    type="number"
                    value={newGoal.targetValue || ""}
                    onChange={(e) => setNewGoal({...newGoal, targetValue: Number(e.target.value)})}
                    placeholder="100"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">単位 *</Label>
                  <Input
                    value={newGoal.unit}
                    onChange={(e) => setNewGoal({...newGoal, unit: e.target.value})}
                    placeholder="時間、回、冊など"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">期限 *</Label>
                  <Input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">優先度</Label>
                  <Select value={newGoal.priority} onValueChange={(value: any) => setNewGoal({...newGoal, priority: value})}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="high">高</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="low">低</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button onClick={handleAddGoal} className="bg-green-500 hover:bg-green-600">
                  目標を追加
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddingGoal(false)}
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  キャンセル
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 目標一覧 */}
        <div className="space-y-6">
          {goals.map((goal) => {
            const progressPercentage = getProgressPercentage(goal.currentValue, goal.targetValue)
            const remainingDays = getRemainingDays(goal.deadline)
            const isOverdue = remainingDays < 0
            const isUrgent = remainingDays <= 7 && remainingDays >= 0

            return (
              <Card key={goal.id} className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CardTitle className="text-white text-xl">{goal.title}</CardTitle>
                        <Badge className={priorityColors[goal.priority]}>
                          {priorityLabels[goal.priority]}優先度
                        </Badge>
                        {goal.category && (
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {goal.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-400 mb-3">{goal.description}</p>
                      
                      {/* 動機 */}
                      <div className="bg-gray-800 p-3 rounded-lg mb-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-1">💡 なぜこの目標を？</h4>
                        <p className="text-sm text-gray-400">{goal.motivation}</p>
                      </div>
                    </div>
                                         <div className="flex space-x-2">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleEditGoal(goal.id)}
                         className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                       >
                         <Edit2 className="w-4 h-4" />
                       </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="bg-gray-800 border-gray-700 text-red-400 hover:bg-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 進捗表示 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">進捗状況</span>
                      <span className="text-sm font-medium text-white">
                        {goal.currentValue} / {goal.targetValue} {goal.unit} ({Math.round(progressPercentage)}%)
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  {/* 期限と残り日数 */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">期限: {goal.deadline}</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${
                      isOverdue ? 'text-red-400' : isUrgent ? 'text-yellow-400' : 'text-gray-400'
                    }`}>
                      {isOverdue ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      <span>
                        {isOverdue 
                          ? `${Math.abs(remainingDays)}日遅れ` 
                          : `残り${remainingDays}日`
                        }
                      </span>
                    </div>
                  </div>

                  {/* 小さなステップ */}
                  {goal.steps.length > 0 && (
                    <>
                      <Separator className="bg-gray-700" />
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-300 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          小さなステップ
                        </h4>
                        <div className="space-y-2">
                          {goal.steps.map((step) => (
                            <div key={step.id} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleStep(goal.id, step.id)}
                                  className={`p-1 h-6 w-6 ${
                                    step.completed 
                                      ? 'text-green-400 hover:text-green-300' 
                                      : 'text-gray-400 hover:text-gray-300'
                                  }`}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <span className={`text-sm ${
                                  step.completed ? 'line-through text-gray-500' : 'text-gray-300'
                                }`}>
                                  {step.title}
                                </span>
                              </div>
                              <span className="text-xs text-gray-400">
                                {step.currentValue} / {step.targetValue} {step.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* 進捗更新 */}
                  <div className="flex items-center space-x-2 pt-2">
                    <Label className="text-sm text-gray-300">進捗更新:</Label>
                    <Input
                      type="number"
                      placeholder={goal.currentValue.toString()}
                      className="bg-gray-800 border-gray-700 text-white w-20 h-8"
                      onBlur={(e) => {
                        const value = Number(e.target.value)
                        if (value >= 0) {
                          handleUpdateProgress(goal.id, value)
                        }
                      }}
                    />
                    <span className="text-sm text-gray-400">{goal.unit}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {goals.length === 0 && !isAddingGoal && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-400 mb-2">目標がまだありません</h3>
            <p className="text-gray-500 mb-4">最初の目標を設定して、成長の旅を始めましょう</p>
            <Button
              onClick={() => setIsAddingGoal(true)}
              className="bg-green-500 hover:bg-green-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              目標を追加
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 