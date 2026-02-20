import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Users,
  Warehouse,
  FileText,
  Layers,
  GitBranch,
  ClipboardList,
  PenTool,
  Boxes,
  MapPin,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { useProject } from "@/Provider/ProjectProvider";
import type { ProjectDetails } from "@/Provider/ProjectProvider";

interface SetupStep {
  key: keyof Pick<
    ProjectDetails,
    | "is_member"
    | "is_assign_stockyard"
    | "is_paper"
    | "is_stage_member"
    | "is_hierachy"
    | "is_bom"
    | "is_drawingtype"
    | "is_elementtype"
  >;
  label: string;
  description: string;
  icon: React.ElementType;
  route: (projectId: string) => string;
}

const SETUP_STEPS: SetupStep[] = [
  {
    key: "is_member",
    label: "Add Members",
    description: "Invite team members to collaborate on this project",
    icon: Users,
    route: (id) => `/project/${id}/add-project-member`,
  },
  {
    key: "is_assign_stockyard",
    label: "Assign Stockyard",
    description: "Assign a stockyard for storing project elements",
    icon: Warehouse,
    route: (id) => `/project/${id}/stockyard-assign`,
  },
  {
    key: "is_paper",
    label: "Add Papers",
    description: "Upload planning papers and drawings for the project",
    icon: FileText,
    route: (id) => `/project/${id}/papers`,
  },
  {
    key: "is_stage_member",
    label: "Configure Stages",
    description: "Set up production stages and assign members to them",
    icon: Layers,
    route: (id) => `/project/${id}/stages`,
  },
  {
    key: "is_hierachy",
    label: "Define Hierarchy",
    description: "Create the tower/floor/unit structure for the project",
    icon: GitBranch,
    route: (id) => `/project/${id}/hierarchy`,
  },
  {
    key: "is_bom",
    label: "Add BOM Materials",
    description: "Add bill of materials for the project",
    icon: ClipboardList,
    route: (id) => `/project/${id}/large-import`,
  },
  {
    key: "is_drawingtype",
    label: "Add Drawings",
    description: "Upload drawing types and drawings for the project",
    icon: PenTool,
    route: (id) => `/project/${id}/drawing`,
  },
  {
    key: "is_elementtype",
    label: "Add Element Types",
    description: "Define element types and elements for production",
    icon: Boxes,
    route: (id) => `/project/${id}/add-element-type`,
  },
];

export interface ProjectSetupGuideProps {
  currentStep?: SetupStep["key"];
  onCurrentStepAction?: () => void;
}

export function ProjectSetupGuide({
  currentStep,
  onCurrentStepAction,
}: ProjectSetupGuideProps) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { projectDetails } = useProject();

  const steps = SETUP_STEPS.map((step) => ({
    ...step,
    done: projectDetails?.[step.key] ?? false,
  }));

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;
  const firstPendingIndex = steps.findIndex((s) => !s.done);

  const handleStepClick = (step: (typeof steps)[0]) => {
    if (step.done) return;
    if (step.key === currentStep && onCurrentStepAction) {
      onCurrentStepAction();
      return;
    }
    navigate(step.route(projectId || ""));
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <ClipboardList className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-1">
            {allDone ? "Project Setup Complete" : "Complete Project Setup"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {allDone
              ? "All setup steps are complete. Your project is ready to go!"
              : `Complete these steps to get your project running (${completedCount}/${steps.length} done)`}
          </p>
        </div>

        <div className="w-full bg-muted rounded-full h-2 mb-8">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{
              width: `${(completedCount / steps.length) * 100}%`,
            }}
          />
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const isNextStep = index === firstPendingIndex;
            const isCurrent = step.key === currentStep;
            const StepIcon = step.icon;

            return (
              <button
                key={step.key}
                onClick={() => handleStepClick(step)}
                disabled={step.done && !isCurrent}
                className={`w-full flex items-center gap-4 rounded-lg border p-4 text-left transition-all ${
                  step.done
                    ? "bg-muted/40 border-muted opacity-75 cursor-default"
                    : isCurrent
                      ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-sm cursor-default"
                      : isNextStep
                        ? "border-primary bg-primary/5 shadow-sm hover:shadow-md cursor-pointer"
                        : "border-border hover:border-muted-foreground/30 cursor-pointer"
                }`}
              >
                {step.done ? (
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                ) : (
                  <Circle
                    className={`w-5 h-5 flex-shrink-0 ${
                      isCurrent || isNextStep
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                )}

                <div
                  className={`flex items-center justify-center w-9 h-9 rounded-md flex-shrink-0 ${
                    step.done
                      ? "bg-primary/10"
                      : isCurrent || isNextStep
                        ? "bg-primary/15"
                        : "bg-muted"
                  }`}
                >
                  <StepIcon
                    className={`w-4 h-4 ${
                      step.done || isCurrent || isNextStep
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${step.done ? "line-through text-muted-foreground" : ""}`}
                    >
                      {step.label}
                    </span>
                    {isCurrent && !step.done && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                        <MapPin className="w-2.5 h-2.5" />
                        You are here
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </div>
                </div>

                {!step.done && !isCurrent && (
                  <ArrowRight
                    className={`w-4 h-4 flex-shrink-0 ${
                      isNextStep ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {allDone && (
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              All steps are complete. You can use the sidebar to navigate.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function SetupProgressCard() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { projectDetails } = useProject();

  const steps = SETUP_STEPS.map((step) => ({
    ...step,
    done: projectDetails?.[step.key] ?? false,
  }));

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;
  const firstPending = steps.find((s) => !s.done);

  if (allDone || !projectDetails) return null;

  return (
    <div className="rounded-lg border bg-card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium">Project Setup</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{steps.length} complete
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5 mb-3">
        <div
          className="bg-primary h-1.5 rounded-full transition-all duration-500"
          style={{
            width: `${(completedCount / steps.length) * 100}%`,
          }}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Next: {firstPending?.label}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => navigate(firstPending!.route(projectId || ""))}
        >
          Continue Setup
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}
