import PageHeader from "@/components/ui/PageHeader";
import { ProjectTable } from "./ProjectTable";

export default function Warehouse() {
  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex item-center justify-between">
        <PageHeader title="All Projects" />
      </div>
      <ProjectTable />
    </div>
  );
}
