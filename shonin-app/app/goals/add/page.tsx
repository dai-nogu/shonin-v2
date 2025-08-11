"use client"

import { useRouter } from "next/navigation"
import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GoalForm } from "@/components/goal-form"
import { useGoalsDb, type GoalFormData } from "@/hooks/use-goals-db"

export default function GoalAddPage() {
  const router = useRouter()
  const { addGoal } = useGoalsDb()

  const handleAddGoal = async (formData: any) => {
    const goalData: GoalFormData = {
      title: formData.title,
      motivation: formData.motivation,
      deadline: formData.deadline,
      weekdayHours: parseInt(formData.weekdayHours),
      weekendHours: parseInt(formData.weekendHours),
      calculatedHours: formData.calculatedHours
    }

    const goalId = await addGoal(goalData)
    
    if (goalId) {
      router.push("/goals")
    } else {
      alert('目標の追加に失敗しました')
    }
  }

  const handleCancel = () => {
    router.push("/goals")
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
                  <CardTitle className="text-white">目標を追加</CardTitle>
                </CardHeader>
                <CardContent>
                  <GoalForm
                    mode="create"
                    onSubmit={handleAddGoal}
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