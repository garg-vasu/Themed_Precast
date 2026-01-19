import PageHeader from "@/components/ui/PageHeader";
import { WareHouseTable } from "./WareHouseTable";

export default function Warehouse() {
  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex item-center justify-between">
        <PageHeader title="Stockyard" />
      </div>
      <WareHouseTable />
    </div>
  );
}
