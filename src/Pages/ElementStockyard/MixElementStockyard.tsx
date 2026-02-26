import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { List, MoreHorizontal } from "lucide-react";
import { useContext, useMemo } from "react";

import { ProjectContext, useProject } from "@/Provider/ProjectProvider";
import { StockyardTable } from "./StockyardTable";
import { DispatchedTable } from "./DispatchedTable";
import { ReceiveTable } from "./ReceiveTable";
import { ProjectSetupGuide } from "@/components/ProjectSetupGuide";

interface TabLink {
  id: string;
  label: string;
  number?: number;
  icon: React.ElementType;
  content: React.ReactNode;
}

export default function MixElementStockyard() {
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

    if (permissions?.includes("ViewStockyardElement")) {
      tabs.push({
        id: "1",
        label: "Stockyard",
        number: 1,
        icon: List,
        content: <StockyardTable />,
      });
    }

    if (permissions?.includes("ViewReceivableStockyard")) {
      tabs.push({
        id: "2",
        label: "Dispatched",
        number: 24,
        icon: MoreHorizontal,
        content: <DispatchedTable />,
      });
    }

    if (permissions?.includes("ViewReceivableStockyard")) {
      tabs.push({
        id: "3",
        label: "Received",
        number: 255,
        icon: MoreHorizontal,
        content: <ReceiveTable />,
      });
    }

    return tabs;
  }, [permissions]);

  // If no tabs are available, show a message
  if (tabLinks.length === 0) {
    return (
      <div className="flex flex-col gap-2 py-4 px-4">
        <div className="flex items-center justify-between">
          <PageHeader title="Stockyard" />
        </div>
        <div className="text-center py-8 text-muted-foreground">
          You do not have permission to view any element stockyard sections.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex items-center justify-between">
        <PageHeader title="Stockyard" />
      </div>
      {!isProjectSetupComplete ? (
        <div className="w-full">
          <ProjectSetupGuide currentStep="is_assign_stockyard" />
        </div>
      ) : (
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
      )}
    </div>
  );
}
