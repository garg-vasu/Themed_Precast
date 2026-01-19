import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, List } from "lucide-react";
import { useState } from "react";
import { Skillstable } from "../Skills/Skillstable";
import { Categorytable } from "./Categorytable";
import { Departmenttable } from "./Departmenttable";

interface TabLink {
  id: string;
  label: string;
  number?: number;
  icon: React.ElementType;
  content: React.ReactNode;
}

export default function MixDepartemnt() {
  const [activeTab, setActiveTab] = useState<string>("1");
  let tabsLinks: TabLink[] = [
    {
      id: "1",
      label: "Department",
      number: 1,
      icon: List,
      content: <Departmenttable refresh={() => {}} />,
    },
    {
      id: "2",
      label: "Category",
      number: 0,
      icon: Clock,
      content: <Categorytable refresh={() => {}} />,
    },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex item-center justify-between">
        <PageHeader title="Department" />
      </div>
      {/* pills section  */}
      <div className="flex flex-col gap-2">
        {/* FOR DESKTOP and TABLET  */}

        <div className=" hidden md:flex flex-wrap gap-2">
          {tabsLinks.map((tab) => (
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
              {tabsLinks.map((tab) => (
                <SelectItem key={tab.id} value={tab.id}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/*content area   */}

      {tabsLinks.find((tab) => tab.id === activeTab)?.content}
    </div>
  );
}
