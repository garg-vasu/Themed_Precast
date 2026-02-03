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
import ProjectRoleRoute from "./Pages/Limitation/ProjectRoleRoute";
import RoleRoute from "./Pages/Limitation/RoleRoute";
import NotFound from "./Pages/NotFound/NotFound";
import RolePermission from "./Pages/Roles/rolePermission";

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
      {
        path: "add-projects",
        element: (
          <RoleRoute allowedRoles={["superadmin"]} redirectTo="/login">
            <AddProjects />
          </RoleRoute>
        ),
      },
      {
        path: "edit-projects/:project_id",
        element: (
          <RoleRoute allowedRoles={["superadmin"]} redirectTo="/login">
            <EditProject />
          </RoleRoute>
        ),
      },
      { path: "stockyard", element: <Warehouse /> },
      { path: "tenants", element: <Tenants /> },
      { path: "end-clients", element: <EndClient /> },
      {
        path: "users",
        element: (
          <RoleRoute allowedRoles={["superadmin"]} redirectTo="/login">
            <User />
          </RoleRoute>
        ),
      },
      {
        path: "invoices",
        element: (
          <RoleRoute allowedRoles={["admin", "superadmin"]} redirectTo="/login">
            <MixInvoice />
          </RoleRoute>
        ),
      },
      { path: "labour-summary", element: <LabourSummary /> },
      {
        path: "work-order",
        element: (
          <RoleRoute allowedRoles={["superadmin", "admin"]} redirectTo="/login">
            <WorkOrder />
          </RoleRoute>
        ),
      },
      {
        path: "attendance",
        element: (
          <RoleRoute allowedRoles={["superadmin", "admin"]} redirectTo="/login">
            <MixAttendance />
          </RoleRoute>
        ),
      },
      {
        path: "skills",
        element: (
          <RoleRoute allowedRoles={["superadmin", "admin"]} redirectTo="/login">
            <MixSkills />
          </RoleRoute>
        ),
      },
      {
        path: "departments",
        element: (
          <RoleRoute allowedRoles={["superadmin", "admin"]} redirectTo="/login">
            <MixDepartemnt />
          </RoleRoute>
        ),
      },
      {
        path: "people",
        element: (
          <RoleRoute allowedRoles={["superadmin", "admin"]} redirectTo="/login">
            <PeopleTable refresh={() => {}} />
          </RoleRoute>
        ),
      },
      {
        path: "attendance-report",
        element: (
          <RoleRoute allowedRoles={["superadmin", "admin"]} redirectTo="/login">
            <AttendanceReport />
          </RoleRoute>
        ),
      },
      {
        path: "templates",
        element: (
          <RoleRoute allowedRoles={["superadmin", "admin"]} redirectTo="/login">
            <TemplateTable refresh={() => {}} />
          </RoleRoute>
        ),
      },
      {
        path: "work-order-detail/:workOrderId",
        element: (
          <RoleRoute allowedRoles={["admin", "superadmin"]} redirectTo="/login">
            <MixWorkorder />
          </RoleRoute>
        ),
      },
      {
        path: "add-tenant",
        element: (
          <RoleRoute allowedRoles={["superadmin"]} redirectTo="/login">
            <AddTenants />
          </RoleRoute>
        ),
      },
      {
        path: "edit-tenant/:tenant_id",
        element: (
          <RoleRoute allowedRoles={["superadmin"]} redirectTo="/login">
            <EditTenants />
          </RoleRoute>
        ),
      },
      {
        path: "tenant/:tenant_id",
        element: (
          <RoleRoute allowedRoles={["superadmin"]} redirectTo="/login">
            <TenantDetailPage />
          </RoleRoute>
        ),
      },
      {
        path: "tenant-detail/:tenant_id",
        element: (
          <RoleRoute allowedRoles={["superadmin"]} redirectTo="/login">
            <TenantDetailPage />
          </RoleRoute>
        ),
      },
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
        element: (
          <RoleRoute allowedRoles={["admin", "superadmin"]} redirectTo="/login">
            <InvoiceDetailPage />
          </RoleRoute>
        ),
      },
      {
        path: "logs",
        element: (
          <RoleRoute allowedRoles={["superadmin"]} redirectTo="/login">
            <LogTable />
          </RoleRoute>
        ),
      },
      {
        path: "tenant-via-end-client/:client_id",
        element: <TenantviaEndclientDashboard />,
      },
      {
        path: "add-work-order",
        element: (
          <RoleRoute allowedRoles={["admin", "superadmin"]} redirectTo="/login">
            <AddWorkOrder />
          </RoleRoute>
        ),
      },
      {
        path: "role",
        element: (
          <RoleRoute allowedRoles={["superadmin"]} redirectTo="/login">
            <RolePermission />
          </RoleRoute>
        ),
      },
      {
        path: "edit-work-order/:work_order_id",
        element: (
          <RoleRoute allowedRoles={["superadmin", "admin"]} redirectTo="/login">
            <EditWorkOrder />
          </RoleRoute>
        ),
      },
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
      // naviage "/" to dashboard
    
      {
        path: "dashboard",
        element: (
          <ProjectRoleRoute
            allowedPermissions={["ViewDashboard"]}
            redirectTo="/"
          >
            <NewProjectDashboard />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "member",
        element: (
          <ProjectRoleRoute allowedPermissions={["ViewMember"]} redirectTo="/">
            <Member />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "drawing",
        element: (
          <ProjectRoleRoute
            allowedPermissions={["ViewDrawing", "ViewDrawingType"]}
            redirectTo="/"
          >
            <MixDrawing />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "element-stockyard",
        element: (
          <ProjectRoleRoute
            allowedPermissions={[
              "ViewStockyardElement",
              "ViewReceivableStockyard",
            ]}
            redirectTo="/"
          >
            <MixElementStockyard />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "stockyard-assign",
        element: (
          <ProjectRoleRoute
            allowedPermissions={["StockyardAssign"]}
            redirectTo="/"
          >
            <StockyardAssigntable refresh={() => {}} />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "errection-receving",
        element: (
          <ProjectRoleRoute
            allowedPermissions={[
              "ViewInTransitElement",
              "ViewDeliveredElement",
            ]}
            redirectTo="/"
          >
            <MixErrection />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "element-type",
        element: (
          <ProjectRoleRoute
            allowedPermissions={["ViewElementType", "ViewElement"]}
            redirectTo="/"
          >
            <MixElement />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "bom",
        element: (
          <ProjectRoleRoute allowedPermissions={["ViewBom"]} redirectTo="/">
            <BomTable refresh={() => {}} />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "large-import",
        element: (
          <ProjectRoleRoute allowedPermissions={["AddBom"]} redirectTo="/">
            <LargeImport />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "planning-approval",
        element: (
          <ProjectRoleRoute
            allowedPermissions={["ViewDispatchApproval"]}
            redirectTo="/"
          >
            <MixPlanningApproval />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "retification",
        element: (
          <ProjectRoleRoute
            allowedPermissions={["RetificationRequest"]}
            redirectTo="/"
          >
            <RetificationTable />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "errection-request",
        element: (
          <ProjectRoleRoute
            allowedPermissions={["ViewErrectionRequest"]}
            redirectTo="/"
          >
            <ErrectionRequestTable />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "papers",
        element: (
          <ProjectRoleRoute
            allowedPermissions={["ViewPaper", "EditPaper", "AddPaper"]}
            redirectTo="/"
          >
            <PaperTable refresh={() => {}} />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "stages",
        element: (
          <ProjectRoleRoute
            allowedPermissions={["ViewStage", "EditStage", "AddStage"]}
            redirectTo="/"
          >
            <StagesTable refresh={() => {}} />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "tags",
        element: (
          <ProjectRoleRoute
            allowedPermissions={["ViewTag", "EditTag", "AddTag"]}
            redirectTo="/"
          >
            <TagsTable refresh={() => {}} />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "plan",
        element: (
          <ProjectRoleRoute allowedPermissions={["ViewPlan"]} redirectTo="/">
            <MixPlan />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "add-task",
        element: (
          <ProjectRoleRoute allowedPermissions={["AddTask"]} redirectTo="/">
            <AddTask />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "project-summary",
        element: (
          <ProjectRoleRoute
            allowedPermissions={["SummaryReport"]}
            redirectTo="/"
          >
            <ProjectSummary />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "stockyard-summary",
        element: (
          <ProjectRoleRoute
            allowedPermissions={["ViewStockyardSummary"]}
            redirectTo="/"
          >
            <StockyardSummary />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "add-element-type",
        element: (
          <ProjectRoleRoute
            allowedPermissions={["AddElementType"]}
            redirectTo="/"
          >
            <AddElementType />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "element-type-detail/:elementtypeId/:floorId",
        element: (
          <ProjectRoleRoute
            allowedPermissions={["ViewElementTypeDetail"]}
            redirectTo="/"
          >
            <Elementtypedetail />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "dispatch-log",
        element: (
          <ProjectRoleRoute
            allowedPermissions={["ViewDispatchLog", "ViewRequestedDispatchLog"]}
            redirectTo="/"
          >
            <MixDispatch />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "element-detail/:elementTypeId",
        element: (
          <ProjectRoleRoute
            allowedPermissions={["ViewElementDetail"]}
            redirectTo="/"
          >
            <ElementDetailPage />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "dispatch-request",
        element: (
          <ProjectRoleRoute
            allowedPermissions={["AddErrectionRequest"]}
            redirectTo="/"
          >
            <RequestHandler />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "erection-element",
        element: (
          <ProjectRoleRoute
            allowedPermissions={[
              "ViewElementInErrectionSite",
              "ViewNotErectedElement",
            ]}
            redirectTo="/"
          >
            <MixErrectedElement />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "edit-element-type/:elementTypeId/:floorId",
        element: (
          <ProjectRoleRoute allowedPermissions={["EditElementType"]}>
            <EditElementType />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "hierarchy",
        element: (
          <ProjectRoleRoute
            allowedPermissions={["ViewStructure"]}
            redirectTo="/"
          >
            <MixHierarchy />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "add-project-member",
        element: (
          <ProjectRoleRoute allowedPermissions={["AddMember"]}>
            <AddMember />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "vehicle-dispatch",
        element: (
          <ProjectRoleRoute
            allowedPermissions={["AddDispatchLog"]}
            redirectTo="/"
          >
            <VehicleDispatch />
          </ProjectRoleRoute>
        ),
      },
      {
        path: "edit-member/:user_id",
        element: (
          <ProjectRoleRoute allowedPermissions={["EditMember"]}>
            <EditMember />
          </ProjectRoleRoute>
        ),
      },
    ],
  },
  // Catch-all 404 route - must be last
  {
    path: "*",
    element: <NotFound />,
  },
];

export const router = createBrowserRouter(routes);
export default router;
