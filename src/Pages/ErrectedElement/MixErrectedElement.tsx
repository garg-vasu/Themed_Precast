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
import { useEffect, useMemo, useState } from "react";
import { useProject } from "@/Provider/ProjectProvider";
import { AlreadyErrectedElementTable } from "./AlreadyErrectedElement";
import { NotErrectedElementTable } from "./NotErrectedElement";

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
    if (permissions?.includes("ViewElementInErrectionSite")) {
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
