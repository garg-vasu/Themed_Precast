import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Eye,
  List,
  ListChecks,
  ListTodo,
  MoreHorizontal,
  NotebookPen,
} from "lucide-react";
import { useContext, useMemo } from "react";

import { ProjectContext, useProject } from "@/Provider/ProjectProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate, useParams } from "react-router-dom";
import { CompletedTaskTable } from "./CompletedTask";
import PendingTask from "./PendingTask";
import BirdEyeView from "./BirdEyeView";
import { ProjectSetupGuide } from "@/components/ProjectSetupGuide";

interface TabLink {
  id: string;
  label: string;
  number?: number;
  icon: React.ElementType;
}

export default function MixPlan() {
  const navigate = useNavigate();
  const projectCtx = useContext(ProjectContext);
  const { permissions } = useProject();
  const { projectId } = useParams<{ projectId: string }>();

  // check if the project is setup complete
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

    tabs.push({
      id: "1",
      label: "Completed Tasks",
      number: 1,
      icon: ListChecks,
    });

    tabs.push({
      id: "2",
      label: "Pending Tasks",
      number: 24,
      // task icon
      icon: ListTodo,
    });

    tabs.push({
      id: "3",
      label: "Bird Eye View",
      number: 3,
      icon: Eye,
    });

    return tabs;
  }, [permissions]);

  // If no tabs are available, show a message
  if (tabLinks.length === 0) {
    return (
      <div className="flex flex-col gap-2 py-4 px-4">
        <div className="flex items-center justify-between">
          <PageHeader title="Plan" />
        </div>
        <div className="text-center py-8 text-muted-foreground">
          You do not have permission to view any plan sections.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex items-center justify-between">
        <PageHeader title="Plan" />
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/project/${projectId}/add-task`)}>
            Add Task
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Settings
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              {/* <DropdownMenuItem
                onClick={() => navigate(`/project/${projectId}/tags`)}>
                Tags
              </DropdownMenuItem> */}
              <DropdownMenuItem
                onClick={() => navigate(`/project/${projectId}/stages`)}>
                Stages
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate(`/project/${projectId}/papers`)}>
                Papers
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* conditional render for project setup guide */}
      {!isProjectSetupComplete ? (
        <div className="w-full">
          <ProjectSetupGuide currentStep="is_stage_member" />
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
              {tab.id === "1" && <CompletedTaskTable refresh={() => {}} />}
              {tab.id === "2" && <PendingTask />}
              {tab.id === "3" && <BirdEyeView />}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
