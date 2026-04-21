export const dynamic = "force-dynamic";

import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pb-[calc(56px+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomTabBar projectId={projectId} />
    </div>
  );
}
