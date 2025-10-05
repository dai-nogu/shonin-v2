import { getTranslations } from "next-intl/server";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import PlanPageClient from "@/components/pages/plan-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "plan" });

  return {
    title: `${t("title")} - Shonin`,
  };
}

export default function PlanPage() {
  return (
    <>
      <AppSidebar currentPage="plan" />
      <SidebarInset>
        <PlanPageClient />
      </SidebarInset>
      <BottomNavigation currentPage="plan" />
    </>
  );
}

