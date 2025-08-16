import { GoalAddContainer } from "@/components/ui/goals/add/goal-add-container"

export default async function GoalAddPage() {
  return (
    <div className="md:min-h-screen bg-gray-950 text-white pb-0">
      <main className="container mx-auto px-4 py-4 lg:py-8">
        <GoalAddContainer />
      </main>
    </div>
  )
} 