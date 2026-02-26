import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, List, MoreHorizontal, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { DrawingTable } from "./DrawingTable";
import { DrawingTypeTable, type DrawingType } from "./DrawingTypeTable";
import { useProject } from "@/Provider/ProjectProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddDrawingtype from "./AddDrawingtype";

interface TabLink {
  id: string;
  label: string;
  number?: number;
  icon: React.ElementType;
}

export default function MixDrawing() {
  const { projectDetails, permissions, refreshProject, markSetupStepDone } =
    useProject();
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDrawingType, setEditingDrawingType] =
    useState<DrawingType | null>(null);

  const isDrawingType = projectDetails?.is_drawingtype;

  const refreshData = () => {
    setRefreshKey((prev) => prev + 1);
    markSetupStepDone("is_drawingtype");
    refreshProject();
  };

  const openCreateDialog = () => {
    setEditingDrawingType(null);
    setIsDialogOpen(true);
  };

  const tabLinks = useMemo<TabLink[]>(() => {
    const tabs: TabLink[] = [];
    if (permissions?.includes("ViewDrawingType")) {
      tabs.push({
        id: "2",
        label: "Drawing Type",
        number: 24,
        icon: MoreHorizontal,
      });
    }

    if (permissions?.includes("ViewDrawing")) {
      tabs.push({
        id: "1",
        label: "Drawing",
        number: 1,
        icon: List,
      });
    }

    return tabs;
  }, [permissions]);

  const renderContent = () => {
    if (tabLinks.length === 0) {
      return (
        <div className="flex flex-col gap-2 py-4 px-4">
          <div className="flex items-center justify-between">
            <PageHeader title="Mix Drawing" />
          </div>
          <div className="text-center py-8 text-muted-foreground">
            You do not have permission to view any drawing sections.
          </div>
        </div>
      );
    }

    if (!isDrawingType) {
      return (
        <div className="flex flex-col gap-2 py-4 px-4">
          <PageHeader title="  Drawing" />
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-full max-w-md space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">
                  No Drawing Type Yet
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Drawing types are the types of drawings that are used in the
                  project.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-4 text-left space-y-2">
                <h3 className="text-sm font-medium">Getting started</h3>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Create a drawing type with a descriptive name</li>
                </ul>
              </div>
              {permissions?.includes("CreateDrawingType") && (
                <Button onClick={openCreateDialog} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Your Drawing Type
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2 py-4 px-4">
        <div className="flex items-center justify-between">
          <PageHeader title="  Drawing" />
          {permissions?.includes("CreateDrawingType") && (
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={openCreateDialog}
            >
              Add Drawing Type
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
              {tab.id === "2" && permissions?.includes("ViewDrawingType") && (
                <DrawingTypeTable key={refreshKey} refresh={refreshData} />
              )}
              {tab.id === "1" && permissions?.includes("ViewDrawing") && (
                <DrawingTable key={refreshKey} refresh={refreshData} />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      {permissions?.includes("CreateDrawingType") && (
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingDrawingType(null);
            }
          }}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {editingDrawingType ? "Edit Drawing Type" : "Add Drawing Type"}
              </DialogTitle>
            </DialogHeader>
            <AddDrawingtype
              refresh={refreshData}
              initialData={editingDrawingType || undefined}
              onClose={() => {
                setIsDialogOpen(false);
                setEditingDrawingType(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
