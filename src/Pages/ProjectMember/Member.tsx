import PageHeader from "@/components/ui/PageHeader";
import { MemberTable } from "./MemberTable";

export default function Member() {
  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex item-center justify-between">
        <PageHeader title="Members" />
      </div>
      <MemberTable />
    </div>
  );
}
