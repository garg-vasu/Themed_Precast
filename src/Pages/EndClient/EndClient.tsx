import PageHeader from "@/components/ui/PageHeader";
import { EndClientTable } from "./EndClientTable";

export default function EndClient() {
  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex item-center justify-between">
        <PageHeader title="End Clients" />
      </div>
      <EndClientTable />
    </div>
  );
}
