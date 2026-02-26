import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { List, MoreHorizontal } from "lucide-react";
import { useContext, useMemo } from "react";
import { ProjectContext, useProject } from "@/Provider/ProjectProvider";
import { AcceptedDispatchTable } from "./AcceptedDispatchTable";

import { DispatchedElementTable } from "./DispatchedElement";
import { DispatchedReadyTable } from "./DispatchedReadyTable";
import { useNavigate, useParams } from "react-router";
import { ProjectSetupGuide } from "@/components/ProjectSetupGuide";

interface TabLink {
  id: string;
  label: string;
  number?: number;
  icon: React.ElementType;
  content: React.ReactNode;
}

export default function MixDispatch() {
  const { permissions } = useProject();
  const { projectId } = useParams<{ projectId: string }>();
  const projectCtx = useContext(ProjectContext);
  const navigate = useNavigate();

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

    if (permissions?.includes("ViewDispatchLog")) {
      tabs.push({
        id: "1",
        label: "Dispatch",
        number: 1,
        icon: List,
        content: <AcceptedDispatchTable />,
      });
    }
    if (permissions?.includes("ViewRequestedDispatchLog")) {
      tabs.push({
        id: "2",
        label: "Received",
        number: 24,
        icon: MoreHorizontal,
        content: <DispatchedElementTable />,
      });
    }

    if (permissions?.includes("ViewDispatchLog")) {
      tabs.push({
        id: "3",
        label: "Element for Dispatch",
        number: 25,
        icon: MoreHorizontal,
        content: <DispatchedReadyTable />,
      });
    }

    return tabs;
  }, [permissions]);

  // If no tabs are available, show a message
  if (tabLinks.length === 0) {
    return (
      <div className="flex flex-col gap-2 py-4 px-4">
        <div className="flex items-center justify-between">
          <PageHeader title="Mix Drawing" />
        </div>
        <div className="text-center py-8 text-muted-foreground">
          You do not have permission to view any dispatch sections.
        </div>
      </div>
    );
  }

  if (!isProjectSetupComplete) {
    return (
      <div className="w-full p-4">
        <PageHeader title="Dispatch Log" />
        <ProjectSetupGuide currentStep="is_stage_member" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex items-center justify-between">
        <PageHeader title=" Dispatch Log" />
        {permissions?.includes("AddDispatchLog") && (
          <Button
            variant="outline"
            onClick={() => navigate(`/project/${projectId}/vehicle-dispatch`)}
          >
            Add Dispatch
          </Button>
        )}
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
