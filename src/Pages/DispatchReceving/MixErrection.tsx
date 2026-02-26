import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { List, MoreHorizontal } from "lucide-react";
import { useContext, useMemo } from "react";

import { ProjectContext, useProject } from "@/Provider/ProjectProvider";
import { DeliveredTable } from "./DeliveredTable";
import { InTransitTable } from "./InTransitTable";
import { ProjectSetupGuide } from "@/components/ProjectSetupGuide";

interface TabLink {
  id: string;
  label: string;
  number?: number;
  icon: React.ElementType;
  content: React.ReactNode;
}

export default function MixErrection() {
  const { permissions } = useProject();
  const projectCtx = useContext(ProjectContext);

  const isProjectSetupComplete =
    projectCtx?.projectDetails?.is_stage_member &&
    projectCtx?.projectDetails?.is_member &&
    projectCtx?.projectDetails?.is_assign_stockyard &&
    projectCtx?.projectDetails?.is_paper &&
    projectCtx?.projectDetails?.is_hierachy &&
    projectCtx?.projectDetails?.is_bom &&
    projectCtx?.projectDetails?.is_drawingtype &&
    projectCtx?.projectDetails?.is_elementtype;

  const tabLinks = useMemo<TabLink[]>(() => {
    const tabs: TabLink[] = [];

    if (permissions?.includes("ViewDeliveredElement")) {
      tabs.push({
        id: "1",
        label: "Delivered",
        number: 1,
        icon: List,
        content: <DeliveredTable refresh={() => {}} />,
      });
    }

    if (permissions?.includes("ViewInTransitElement")) {
      tabs.push({
        id: "2",
        label: "In Transit",
        number: 24,
        icon: MoreHorizontal,
        content: <InTransitTable refresh={() => {}} />,
      });
    }

    return tabs;
  }, [permissions]);

  // If no tabs are available, show a message
  if (tabLinks.length === 0) {
    return (
      <div className="flex flex-col gap-2 py-4 px-4">
        <div className="flex items-center justify-between">
          <PageHeader title="Errection Receving Log " />
        </div>
        <div className="text-center py-8 text-muted-foreground">
          You do not have permission to view any errection receving log
          sections.
        </div>
      </div>
    );
  }

  if (!isProjectSetupComplete) {
    return (
      <div className="w-full p-4">
        <PageHeader title="Errection Receving Log" />
        <ProjectSetupGuide currentStep="is_stage_member" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex items-center justify-between">
        <PageHeader title="Erection Receving Log" />
      </div>
      <Tabs defaultValue={tabLinks[0]?.id}>
        {tabLinks.length > 1 && (
          <TabsList>
            {tabLinks.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                <tab.icon className="mr-1.5 h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        {tabLinks.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
