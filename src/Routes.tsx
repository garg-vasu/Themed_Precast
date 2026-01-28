import { createBrowserRouter } from "react-router";
import type { RouteObject } from "react-router";
import MainLayout from "./Layout/MainLayout";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import PrivateRoute from "./Pages/PrivateRoutes";
import { UserProvider } from "./Provider/UserProvider";
import ProjectCardView from "./Pages/Projects/ProjectCardView";

import Project from "./Pages/Projects/Project";
import StoreWarehouse from "./Pages/StoreWarehouse/StoreWarehouse";
import Warehouse from "./Pages/Warehouse/Warehouse";
import Tenants from "./Pages/Tenants/Tenants";
import EndClient from "./Pages/EndClient/EndClient";
import User from "./Pages/Users/User";
import MixInvoice from "./Pages/Invoice/MixInvoice";
import LabourSummary from "./Pages/LabourReports/LabourSummary";
import AddProjects from "./Pages/Projects/AddProjects";
import EditProject from "./Pages/Projects/EditProject";
import WorkOrder from "./Pages/WorkOrder/WorkOrder";
import MixAttendance from "./Pages/Attendance/MixAttendance";
import MixSkills from "./Pages/Skills/MixSkills";
import MixDepartemnt from "./Pages/Department/MixDepartemnt";
import { PeopleTable } from "./Pages/People/PeopleTable";
import AttendanceReport from "./Pages/LabourReports/AttendanceReport";
import { TemplateTable } from "./Pages/Template/TemplateTable";
import ProjectMainLayout from "./ProjectLayout/ProjectMainLayout";
import Member from "./Pages/ProjectMember/Member";
import MixDrawing from "./Pages/Drawing/MixDrawing";
import { ProjectProvider } from "./Provider/ProjectProvider";
import MixElementStockyard from "./Pages/ElementStockyard/MixElementStockyard";
import { StockyardAssigntable } from "./Pages/ElementStockyard/StockyardAssigntable";
import MixErrection from "./Pages/DispatchReceving/MixErrection";
import MixElement from "./Pages/Elementtype/MixElement";
import { BomTable } from "./Pages/Bom/BomTable";
import MixPlanningApproval from "./Pages/PlanningApproval/MixPlanningApproval";
import { RetificationTable } from "./Pages/Retification/RetificationTable";
import { ErrectionRequestTable } from "./Pages/Errection/ErrectionRequestTable";
import { PaperTable } from "./Pages/Plan/Paper.tsx/PaperTable";
import { StagesTable } from "./Pages/Plan/Stages/StagesTable";
import { TagsTable } from "./Pages/Plan/Tags/TagsTable";
import MixPlan from "./Pages/Plan/MixPlan";
import AddTask from "./Pages/Plan/AddTask/AddTask";
import ProjectSummary from "./Pages/ProjectReport/ProjectSummary";
import LargeImport from "./Pages/Bom/LargeImport";
import StockyardSummary from "./Pages/ProjectReport/StockyardSummary";
import AddElementType from "./Pages/Elementtype/AddElementtype";
import Elementtypedetail from "./Pages/Elementtype/ElementtypeDetailPage";
import ElementDetailPage from "./Pages/Element/ElementDetailPage";
import RequestHandler from "./Pages/Errection/RequestHandle/RequestHandler";
import MixDispatch from "./Pages/DispatchStockyard/MixDispatch";
import MixErrectedElement from "./Pages/ErrectedElement/MixErrectedElement";
import MixWorkorder from "./Pages/WorkOrder/Detail/MixWorkorder";
import NewProjectDashboard from "./Pages/Projects/NewProjectDashboard";
import AddTenants from "./Pages/Tenants/AddTenants";
import EditTenants from "./Pages/Tenants/EditTenants";
import TenantDetailPage from "./Pages/Tenants/TenantDetailPage";
import { AddEndClient } from "./Pages/EndClient/AddEndClient";
import EditEndClient from "./Pages/EndClient/EditEndClient";
import { EndClientDetailPage } from "./Pages/EndClient/EndClientDetailPage";
import UserDetailPage from "./Pages/Users/UserDetailPage";
import { InvoiceDetailPage } from "./Pages/Invoice/InvoiceDetailPage";
import { LogTable } from "./Pages/log/LogTable";
import { TenantviaEndclientDashboard } from "./Pages/Projects/TenantviaEndclientDashboard";
import AddWorkOrder from "./Pages/WorkOrder/AddWorkOrder";
import EditWorkOrder from "./Pages/WorkOrder/EditWorkOrder";
import EditElementType from "./Pages/Elementtype/EditElementtype";

import MixHierarchy from "./Pages/Hierarchy/MixHierarchy";
import AddAttendance from "./Pages/Attendance/AddAttendance";
import AddMember from "./Pages/ProjectMember/AddMember";
import VehicleDispatch from "./Pages/Vehicle/VehicleDispatch";
import EditMember from "./Pages/ProjectMember/EditMemeber";

const routes: RouteObject[] = [
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: (
      <PrivateRoute>
        <UserProvider>
          <MainLayout />
        </UserProvider>
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: "projectOverview", element: <ProjectCardView /> },
      { path: "store-warehouse", element: <StoreWarehouse /> },
      { path: "projects", element: <Project /> },
      { path: "add-projects", element: <AddProjects /> },
      { path: "edit-projects/:project_id", element: <EditProject /> },
      { path: "stockyard", element: <Warehouse /> },
      { path: "tenants", element: <Tenants /> },
      { path: "end-clients", element: <EndClient /> },
      { path: "users", element: <User /> },
      { path: "invoices", element: <MixInvoice /> },
      { path: "labour-summary", element: <LabourSummary /> },
      { path: "work-order", element: <WorkOrder /> },
      { path: "attendance", element: <MixAttendance /> },
      { path: "skills", element: <MixSkills /> },
      { path: "departments", element: <MixDepartemnt /> },
      { path: "people", element: <PeopleTable refresh={() => {}} /> },
      { path: "attendance-report", element: <AttendanceReport /> },
      { path: "templates", element: <TemplateTable refresh={() => {}} /> },
      { path: "work-order-detail/:workOrderId", element: <MixWorkorder /> },
      { path: "add-tenant", element: <AddTenants /> },
      { path: "edit-tenant/:tenant_id", element: <EditTenants /> },
      { path: "tenant/:tenant_id", element: <TenantDetailPage /> },
      { path: "tenant-detail/:tenant_id", element: <TenantDetailPage /> },
      { path: "add-attendance", element: <AddAttendance /> },
      {
        path: "add-end-client",
        element: (
          <AddEndClient
            refresh={() => {}}
            initialData={null}
            onClose={() => {}}
          />
        ),
      },
      { path: "edit-end-client/:end_client_id", element: <EditEndClient /> },
      { path: "end-client/:end_client_id", element: <EndClientDetailPage /> },
      { path: "user-detail/:user_id", element: <UserDetailPage /> },
      {
        path: "invoice-detail/:invoice_id/:wo_number",
        element: <InvoiceDetailPage />,
      },
      { path: "logs", element: <LogTable /> },
      {
        path: "tenant-via-end-client/:client_id",
        element: <TenantviaEndclientDashboard />,
      },
      { path: "add-work-order", element: <AddWorkOrder /> },
      { path: "edit-work-order/:work_order_id", element: <EditWorkOrder /> },
    ],
  },
  {
    path: "/project/:projectId",
    element: (
      <PrivateRoute>
        <UserProvider>
          <ProjectProvider>
            <ProjectMainLayout />
          </ProjectProvider>
        </UserProvider>
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <NewProjectDashboard /> },
      { path: "dashboard", element: <NewProjectDashboard /> },
      { path: "member", element: <Member /> },
      { path: "drawing", element: <MixDrawing /> },
      { path: "element-stockyard", element: <MixElementStockyard /> },
      {
        path: "stockyard-assign",
        element: <StockyardAssigntable refresh={() => {}} />,
      },
      { path: "errection-receving", element: <MixErrection /> },
      { path: "element-type", element: <MixElement /> },
      { path: "bom", element: <BomTable refresh={() => {}} /> },
      { path: "large-import", element: <LargeImport /> },
      { path: "planning-approval", element: <MixPlanningApproval /> },
      { path: "retification", element: <RetificationTable /> },
      { path: "errection-request", element: <ErrectionRequestTable /> },
      { path: "papers", element: <PaperTable refresh={() => {}} /> },
      { path: "stages", element: <StagesTable refresh={() => {}} /> },
      { path: "tags", element: <TagsTable refresh={() => {}} /> },
      { path: "plan", element: <MixPlan /> },
      { path: "add-task", element: <AddTask /> },
      { path: "project-summary", element: <ProjectSummary /> },
      { path: "stockyard-summary", element: <StockyardSummary /> },
      { path: "add-element-type", element: <AddElementType /> },
      {
        path: "element-type-detail/:elementtypeId/:floorId",
        element: <Elementtypedetail />,
      },
      { path: "dispatch-log", element: <MixDispatch /> },
      {
        path: "element-detail/:elementTypeId",
        element: <ElementDetailPage />,
      },
      { path: "dispatch-request", element: <RequestHandler /> },
      { path: "erection-element", element: <MixErrectedElement /> },
      {
        path: "edit-element-type/:elementTypeId/:floorId",
        element: <EditElementType />,
      },
      { path: "hierarchy", element: <MixHierarchy /> },
      { path: "add-project-member", element: <AddMember /> },
      { path: "vehicle-dispatch", element: <VehicleDispatch /> },
      { path: "edit-member/:user_id", element: <EditMember /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
export default router;
