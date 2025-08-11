"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GoalForm } from "@/components/goal-form"
import { useGoalsDb, type GoalFormData } from "@/hooks/use-goals-db"

interface GoalEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default function GoalEditPage({ params }: GoalEditPageProps) {
  const router = useRouter()
  const { goals, updateGoal, loading } = useGoalsDb()
  const [currentGoal, setCurrentGoal] = useState<any>(null)
  
  // paramsをunwrap
  const { id } = use(params)

  // 該当の目標を取得
  useEffect(() => {
    if (goals && id) {
      const goal = goals.find(g => g.id === id)
      setCurrentGoal(goal)
    }
  }, [goals, id])

  const handleUpdateGoal = async (formData: any) => {
    const goalData: GoalFormData = {
      title: formData.title,
      motivation: formData.motivation,
      deadline: formData.deadline,
      weekdayHours: parseInt(formData.weekdayHours),
      weekendHours: parseInt(formData.weekendHours),
      calculatedHours: formData.calculatedHours
    }

    const success = await updateGoal(id, goalData)
    
    if (success) {
      router.push("/goals")
    } else {
      alert('目標の更新に失敗しました')
    }
  }

  const handleCancel = () => {
    router.push("/goals")
  }

  // ローディング中またはデータがない場合
  if (loading || !currentGoal) {
    return (
      <>
        <AppSidebar currentPage="goals" />
        <SidebarInset>
          <div className="md:min-h-screen bg-gray-950 text-white pb-0">
            <main className="container mx-auto px-4 py-4 lg:py-8">
              <div className="container mx-auto max-w-4xl">
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="text-center">
                      {loading ? "読み込み中..." : "目標が見つかりません"}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        </SidebarInset>
      </>
    )
  }

  return (
    <>
      <AppSidebar currentPage="goals" />
      <SidebarInset>
        <div className="md:min-h-screen bg-gray-950 text-white pb-0">
          <main className="container mx-auto px-4 py-4 lg:py-8">
            <div className="container mx-auto max-w-4xl">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">目標を編集</CardTitle>
                </CardHeader>
                <CardContent>
                  <GoalForm
                    mode="edit"
                    initialData={{
                      title: currentGoal.title,
                      motivation: currentGoal.description || '',
                      deadline: currentGoal.deadline || '',
                      weekdayHours: (currentGoal.weekday_hours || 0).toString(),
                      weekendHours: (currentGoal.weekend_hours || 0).toString()
                    }}
                    onSubmit={handleUpdateGoal}
                    onCancel={handleCancel}
                  />
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarInset>
    </>
  )
} 