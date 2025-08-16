import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { GoalEditContainer } from "@/components/ui/goals/edit/goal-edit-container"

interface GoalEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function GoalEditPage({ params }: GoalEditPageProps) {
  return (
    <>
      <AppSidebar currentPage="goals" />
      <SidebarInset>
        <div className="md:min-h-screen bg-gray-950 text-white pb-0">
          <main className="container mx-auto px-4 py-4 lg:py-8">
            <GoalEditContainer params={params} />
          </main>
        </div>
      </SidebarInset>
    </>
  )
} 