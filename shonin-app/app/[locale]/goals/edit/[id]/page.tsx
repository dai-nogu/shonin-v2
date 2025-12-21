import { GoalEditContainer } from "@/components/ui/goals/edit/goal-edit-container"

interface GoalEditPageProps {
  params: Promise<{
    locale: string
    id: string
  }>
}

export default async function GoalEditPage({ params }: GoalEditPageProps) {
  return (
    <div className="md:min-h-screen bg-transparent text-white pb-0">
      <main className="container mx-auto px-4 py-4 lg:py-8">
        <GoalEditContainer params={params} />
      </main>
    </div>
  )
} 