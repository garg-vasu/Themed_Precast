import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { List, MoreHorizontal } from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { ProjectContext, useProject } from "@/Provider/ProjectProvider";
import { AlreadyErrectedElementTable } from "./AlreadyErrectedElement";
import { NotErrectedElementTable } from "./NotErrectedElement";
import { ProjectSetupGuide } from "@/components/ProjectSetupGuide";

interface TabLink {
  id: string;
  label: string;
  number?: number;
  icon: React.ElementType;
  content: React.ReactNode;
}

export default function MixErrectedElement() {
  const { permissions } = useProject();
  const [activeTab, setActiveTab] = useState<string>("");
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

    if (permissions?.includes("ViewElementInErrectionSite")) {
      tabs.push({
        id: "1",
        label: "Already Erected",
        number: 1,
        icon: List,
        content: <AlreadyErrectedElementTable />,
      });
    }
    if (permissions?.includes("ViewNotErectedElement")) {
      tabs.push({
        id: "2",
        label: "Not Erected",
        number: 24,
        icon: MoreHorizontal,
        content: <NotErrectedElementTable />,
      });
    }

    return tabs;
  }, [permissions]);

  // Set initial active tab to first available tab when tabs are loaded
  useEffect(() => {
    if (tabLinks.length > 0 && !activeTab) {
      setActiveTab(tabLinks[0].id);
    }
  }, [tabLinks, activeTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // If no tabs are available, show a message
  if (tabLinks.length === 0) {
    return (
      <div className="flex flex-col gap-2 py-4 px-4">
        <div className="flex items-center justify-between">
          <PageHeader title="Mix Drawing" />
        </div>
        <div className="text-center py-8 text-muted-foreground">
          You do not have permission to view any errected element sections.
        </div>
      </div>
    );
  }

  if (!isProjectSetupComplete) {
    return (
      <div className="w-full p-4">
        <PageHeader title="Erection Element" />
        <ProjectSetupGuide currentStep="is_elementtype" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex items-center justify-between">
        <PageHeader title=" Erection Element" />
      </div>
      {/* pills section  */}
      <div className="flex flex-col gap-2">
        {/* FOR DESKTOP and TABLET  */}

        <div className=" hidden md:flex flex-wrap gap-2">
          {tabLinks.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              className={activeTab === tab.id ? "text-white" : ""}
              onClick={() => handleTabChange(tab.id)}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Button>
          ))}
        </div>
        {/* for mobile  */}
        <div className="md:hidden w-full">
          <Select value={activeTab} onValueChange={handleTabChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a tab" />
            </SelectTrigger>
            <SelectContent>
              {tabLinks.map((tab) => (
                <SelectItem key={tab.id} value={tab.id}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/*content area   */}

      {tabLinks.find((tab) => tab.id === activeTab)?.content}
    </div>
  );
}
