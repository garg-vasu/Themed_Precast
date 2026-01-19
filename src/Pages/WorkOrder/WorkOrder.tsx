import PageHeader from "@/components/ui/PageHeader";
import { WorkOrderTable } from "./WorkOrderTable";

export default function WorkOrder() {
  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex item-center justify-between">
        <PageHeader title="Work Order" />
      </div>
      <WorkOrderTable />
    </div>
  );
}
