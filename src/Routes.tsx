import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter } from "react-router";
import type { RouteObject } from "react-router";
import MainLayout from "./Layout/MainLayout";
import PrivateRoute from "./Pages/PrivateRoutes";
import { UserProvider } from "./Provider/UserProvider";
import ProjectMainLayout from "./ProjectLayout/ProjectMainLayout";
import { ProjectProvider } from "./Provider/ProjectProvider";
import ProjectRoleRoute from "./Pages/Limitation/ProjectRoleRoute";
import RoleRoute from "./Pages/Limitation/RoleRoute";
import NotFound from "./Pages/NotFound/NotFound";

const Login = lazy(() => import("./Pages/Login"));
const Home = lazy(() => import("./Pages/Home"));
const ProjectCardView = lazy(() => import("./Pages/Projects/ProjectCardView"));
const Project = lazy(() => import("./Pages/Projects/Project"));
const StoreWarehouse = lazy(
  () => import("./Pages/StoreWarehouse/StoreWarehouse")
);
const Warehouse = lazy(() => import("./Pages/Warehouse/Warehouse"));
const Tenants = lazy(() => import("./Pages/Tenants/Tenants"));
const EndClient = lazy(() => import("./Pages/EndClient/EndClient"));
const User = lazy(() => import("./Pages/Users/User"));
const MixInvoice = lazy(() => import("./Pages/Invoice/MixInvoice"));
const LabourSummary = lazy(() => import("./Pages/LabourReports/LabourSummary"));
const AddProjects = lazy(() => import("./Pages/Projects/AddProjects"));
const EditProject = lazy(() => import("./Pages/Projects/EditProject"));
const WorkOrder = lazy(() => import("./Pages/WorkOrder/WorkOrder"));
const MixAttendance = lazy(() => import("./Pages/Attendance/MixAttendance"));
const MixSkills = lazy(() => import("./Pages/Skills/MixSkills"));
const MixDepartemnt = lazy(() => import("./Pages/Department/MixDepartemnt"));
const PeopleTable = lazy(() =>
  import("./Pages/People/PeopleTable").then((module) => ({
    default: module.PeopleTable,
  }))
);
const AttendanceReport = lazy(
  () => import("./Pages/LabourReports/AttendanceReport")
);
const TemplateTable = lazy(() =>
  import("./Pages/Template/TemplateTable").then((module) => ({
    default: module.TemplateTable,
  }))
);
const Member = lazy(() => import("./Pages/ProjectMember/Member"));
const MixDrawing = lazy(() => import("./Pages/Drawing/MixDrawing"));
const MixElementStockyard = lazy(
  () => import("./Pages/ElementStockyard/MixElementStockyard")
);
const StockyardAssigntable = lazy(() =>
  import("./Pages/ElementStockyard/StockyardAssigntable").then((module) => ({
    default: module.StockyardAssigntable,
  }))
);
const MixErrection = lazy(
  () => import("./Pages/DispatchReceving/MixErrection")
);
const MixElement = lazy(() => import("./Pages/Elementtype/MixElement"));
const BomTable = lazy(() =>
  import("./Pages/Bom/BomTable").then((module) => ({
    default: module.BomTable,
  }))
);
const MixPlanningApproval = lazy(
  () => import("./Pages/PlanningApproval/MixPlanningApproval")
);
const RetificationTable = lazy(() =>
  import("./Pages/Retification/RetificationTable").then((module) => ({
    default: module.RetificationTable,
  }))
);
const ErrectionRequestTable = lazy(() =>
  import("./Pages/Errection/ErrectionRequestTable").then((module) => ({
    default: module.ErrectionRequestTable,
  }))
);
const PaperTable = lazy(() =>
  import("./Pages/Plan/Paper.tsx/PaperTable").then((module) => ({
    default: module.PaperTable,
  }))
);
const StagesTable = lazy(() =>
  import("./Pages/Plan/Stages/StagesTable").then((module) => ({
    default: module.StagesTable,
  }))
);
const TagsTable = lazy(() =>
  import("./Pages/Plan/Tags/TagsTable").then((module) => ({
    default: module.TagsTable,
  }))
);
const MixPlan = lazy(() => import("./Pages/Plan/MixPlan"));
const AddTask = lazy(() => import("./Pages/Plan/AddTask/AddTask"));
const ProjectSummary = lazy(
  () => import("./Pages/ProjectReport/ProjectSummary")
);
const StockyardSummary = lazy(
  () => import("./Pages/ProjectReport/StockyardSummary")
);
const AddElementType = lazy(() => import("./Pages/Elementtype/AddElementtype"));
const Elementtypedetail = lazy(
  () => import("./Pages/Elementtype/ElementtypeDetailPage")
);
const ElementDetailPage = lazy(
  () => import("./Pages/Element/ElementDetailPage")
);
const RequestHandler = lazy(
  () => import("./Pages/Errection/RequestHandle/RequestHandler")
);
const MixDispatch = lazy(() => import("./Pages/DispatchStockyard/MixDispatch"));
const MixErrectedElement = lazy(
  () => import("./Pages/ErrectedElement/MixErrectedElement")
);
const MixWorkorder = lazy(
  () => import("./Pages/WorkOrder/Detail/MixWorkorder")
);
const NewProjectDashboard = lazy(
  () => import("./Pages/Projects/NewProjectDashboard")
);
const AddTenants = lazy(() => import("./Pages/Tenants/AddTenants"));
const EditTenants = lazy(() => import("./Pages/Tenants/EditTenants"));
const TenantDetailPage = lazy(() => import("./Pages/Tenants/TenantDetailPage"));
const AddEndClient = lazy(() =>
  import("./Pages/EndClient/AddEndClient").then((module) => ({
    default: module.AddEndClient,
  }))
);
const EditEndClient = lazy(() => import("./Pages/EndClient/EditEndClient"));
const EndClientDetailPage = lazy(() =>
  import("./Pages/EndClient/EndClientDetailPage").then((module) => ({
    default: module.EndClientDetailPage,
  }))
);
const UserDetailPage = lazy(() => import("./Pages/Users/UserDetailPage"));
const InvoiceDetailPage = lazy(() =>
  import("./Pages/Invoice/InvoiceDetailPage").then((module) => ({
    default: module.InvoiceDetailPage,
  }))
);
const LogTable = lazy(() =>
  import("./Pages/log/LogTable").then((module) => ({
    default: module.LogTable,
  }))
);
const TenantviaEndclientDashboard = lazy(() =>
  import("./Pages/Projects/TenantviaEndclientDashboard").then((module) => ({
    default: module.TenantviaEndclientDashboard,
  }))
);
const AddWorkOrder = lazy(() => import("./Pages/WorkOrder/AddWorkOrder"));
const EditWorkOrder = lazy(() => import("./Pages/WorkOrder/EditWorkOrder"));
const EditElementType = lazy(
  () => import("./Pages/Elementtype/EditElementtype")
);
const MixHierarchy = lazy(() => import("./Pages/Hierarchy/MixHierarchy"));
const AddAttendance = lazy(() => import("./Pages/Attendance/AddAttendance"));
const AddMember = lazy(() => import("./Pages/ProjectMember/AddMember"));
const VehicleDispatch = lazy(() => import("./Pages/Vehicle/VehicleDispatch"));
const EditMember = lazy(() => import("./Pages/ProjectMember/EditMemeber"));
const RolePermission = lazy(() => import("./Pages/Roles/rolePermission"));
const LargeImport = lazy(() => import("./Pages/Bom/LargeImport"));
const PrivacyPolicy = lazy(() => import("./Pages/Legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./Pages/Legal/TermsOfService"));
const Support = lazy(() => import("./Pages/Legal/Support"));
const CuttingStockCalculator = lazy(
  () => import("./Pages/calculator/CuttingStockCalculator")
);

const routeLoadingFallback = (
  <div className="route-loading" role="status" aria-live="polite">
    Loading...
  </div>
);

const withSuspense = (element: ReactNode) => (
  <Suspense fallback={routeLoadingFallback}>{element}</Suspense>
);

const roleGuard = (
  allowedRoles: string[],
  element: ReactNode,
  redirectTo?: string
) => (
  <RoleRoute allowedRoles={allowedRoles} redirectTo={redirectTo}>
    {element}
  </RoleRoute>
);

const projectRoleGuard = (
  allowedPermissions: string[],
  element: ReactNode,
  redirectTo?: string
) => (
  <ProjectRoleRoute
    allowedPermissions={allowedPermissions}
    redirectTo={redirectTo}
  >
    {element}
  </ProjectRoleRoute>
);

const mainChildren: RouteObject[] = [
  { index: true, element: withSuspense(<Home />) },
  { path: "projectOverview", element: withSuspense(<ProjectCardView />) },
  { path: "store-warehouse", element: withSuspense(<StoreWarehouse />) },
  { path: "projects", element: withSuspense(<Project />) },
  {
    path: "add-projects",
    element: roleGuard(["superadmin"], withSuspense(<AddProjects />), "/login"),
  },
  {
    path: "edit-projects/:project_id",
    element: roleGuard(["superadmin"], withSuspense(<EditProject />), "/login"),
  },
  { path: "stockyard", element: withSuspense(<Warehouse />) },
  { path: "tenants", element: withSuspense(<Tenants />) },
  { path: "end-clients", element: withSuspense(<EndClient />) },
  {
    path: "users",
    element: roleGuard(["superadmin"], withSuspense(<User />), "/login"),
  },
  {
    path: "invoices",
    element: roleGuard(
      ["admin", "superadmin"],
      withSuspense(<MixInvoice />),
      "/login"
    ),
  },
  { path: "labour-summary", element: withSuspense(<LabourSummary />) },
  {
    path: "work-order",
    element: roleGuard(
      ["superadmin", "admin"],
      withSuspense(<WorkOrder />),
      "/login"
    ),
  },
  {
    path: "attendance",
    element: roleGuard(
      ["superadmin", "admin"],
      withSuspense(<MixAttendance />),
      "/login"
    ),
  },
  {
    path: "skills",
    element: roleGuard(
      ["superadmin", "admin"],
      withSuspense(<MixSkills />),
      "/login"
    ),
  },
  {
    path: "departments",
    element: roleGuard(
      ["superadmin", "admin"],
      withSuspense(<MixDepartemnt />),
      "/login"
    ),
  },
  {
    path: "people",
    element: roleGuard(
      ["superadmin", "admin"],
      withSuspense(<PeopleTable refresh={() => {}} />),
      "/login"
    ),
  },
  {
    path: "attendance-report",
    element: roleGuard(
      ["superadmin", "admin"],
      withSuspense(<AttendanceReport />),
      "/login"
    ),
  },
  {
    path: "templates",
    element: roleGuard(
      ["superadmin", "admin"],
      withSuspense(<TemplateTable refresh={() => {}} />),
      "/login"
    ),
  },
  {
    path: "work-order-detail/:workOrderId",
    element: roleGuard(
      ["admin", "superadmin"],
      withSuspense(<MixWorkorder />),
      "/login"
    ),
  },
  {
    path: "add-tenant",
    element: roleGuard(["superadmin"], withSuspense(<AddTenants />), "/login"),
  },
  {
    path: "edit-tenant/:tenant_id",
    element: roleGuard(["superadmin"], withSuspense(<EditTenants />), "/login"),
  },
  {
    path: "tenant/:tenant_id",
    element: roleGuard(
      ["superadmin"],
      withSuspense(<TenantDetailPage />),
      "/login"
    ),
  },
  {
    path: "tenant-detail/:tenant_id",
    element: roleGuard(
      ["superadmin"],
      withSuspense(<TenantDetailPage />),
      "/login"
    ),
  },
  { path: "add-attendance", element: withSuspense(<AddAttendance />) },
  {
    path: "add-end-client",
    element: withSuspense(
      <AddEndClient refresh={() => {}} initialData={null} onClose={() => {}} />
    ),
  },
  {
    path: "edit-end-client/:end_client_id",
    element: withSuspense(<EditEndClient />),
  },
  {
    path: "end-client/:end_client_id",
    element: withSuspense(<EndClientDetailPage />),
  },
  { path: "user-detail/:user_id", element: withSuspense(<UserDetailPage />) },
  {
    path: "invoice-detail/:invoice_id/:wo_number",
    element: roleGuard(
      ["admin", "superadmin"],
      withSuspense(<InvoiceDetailPage />),
      "/login"
    ),
  },
  {
    path: "logs",
    element: roleGuard(["superadmin"], withSuspense(<LogTable />), "/login"),
  },
  {
    path: "tenant-via-end-client/:client_id",
    element: withSuspense(<TenantviaEndclientDashboard />),
  },
  {
    path: "add-work-order",
    element: roleGuard(
      ["admin", "superadmin"],
      withSuspense(<AddWorkOrder />),
      "/login"
    ),
  },
  {
    path: "role",
    element: roleGuard(
      ["superadmin"],
      withSuspense(<RolePermission />),
      "/login"
    ),
  },
  {
    path: "edit-work-order/:work_order_id",
    element: roleGuard(
      ["superadmin", "admin"],
      withSuspense(<EditWorkOrder />),
      "/login"
    ),
  },
  { path: "privacy-policy", element: withSuspense(<PrivacyPolicy />) },
  { path: "terms-of-service", element: withSuspense(<TermsOfService />) },
  { path: "support", element: withSuspense(<Support />) },
  { path: "calculator", element: withSuspense(<CuttingStockCalculator />) },
];

const projectChildren: RouteObject[] = [
  {
    path: "dashboard",
    element: projectRoleGuard(
      ["ViewDashboard"],
      withSuspense(<NewProjectDashboard />),
      "/"
    ),
  },
  {
    path: "member",
    element: projectRoleGuard(["ViewMember"], withSuspense(<Member />), "/"),
  },
  {
    path: "drawing",
    element: projectRoleGuard(
      ["ViewDrawing", "ViewDrawingType"],
      withSuspense(<MixDrawing />),
      "/"
    ),
  },
  {
    path: "element-stockyard",
    element: projectRoleGuard(
      ["ViewStockyardElement", "ViewReceivableStockyard"],
      withSuspense(<MixElementStockyard />),
      "/"
    ),
  },
  {
    path: "stockyard-assign",
    element: projectRoleGuard(
      ["StockyardAssign"],
      withSuspense(<StockyardAssigntable refresh={() => {}} />),
      "/"
    ),
  },
  {
    path: "errection-receving",
    element: projectRoleGuard(
      ["ViewInTransitElement", "ViewDeliveredElement"],
      withSuspense(<MixErrection />),
      "/"
    ),
  },
  {
    path: "element-type",
    element: projectRoleGuard(
      ["ViewElementType", "ViewElement"],
      withSuspense(<MixElement />),
      "/"
    ),
  },
  {
    path: "bom",
    element: projectRoleGuard(
      ["ViewBom"],
      withSuspense(<BomTable refresh={() => {}} />),
      "/"
    ),
  },
  {
    path: "large-import",
    element: projectRoleGuard(["AddBom"], withSuspense(<LargeImport />), "/"),
  },
  {
    path: "planning-approval",
    element: projectRoleGuard(
      ["ViewDispatchApproval"],
      withSuspense(<MixPlanningApproval />),
      "/"
    ),
  },
  {
    path: "retification",
    element: projectRoleGuard(
      ["RetificationRequest"],
      withSuspense(<RetificationTable />),
      "/"
    ),
  },
  {
    path: "errection-request",
    element: projectRoleGuard(
      ["ViewErrectionRequest"],
      withSuspense(<ErrectionRequestTable />),
      "/"
    ),
  },
  {
    path: "papers",
    element: projectRoleGuard(
      ["ViewPaper", "EditPaper", "AddPaper"],
      withSuspense(<PaperTable refresh={() => {}} />),
      "/"
    ),
  },
  {
    path: "stages",
    element: projectRoleGuard(
      ["ViewStage", "EditStage", "AddStage"],
      withSuspense(<StagesTable refresh={() => {}} />),
      "/"
    ),
  },
  {
    path: "tags",
    element: projectRoleGuard(
      ["ViewTag", "EditTag", "AddTag"],
      withSuspense(<TagsTable refresh={() => {}} />),
      "/"
    ),
  },
  {
    path: "plan",
    element: projectRoleGuard(["ViewPlan"], withSuspense(<MixPlan />), "/"),
  },
  {
    path: "add-task",
    element: projectRoleGuard(["AddTask"], withSuspense(<AddTask />), "/"),
  },
  {
    path: "project-summary",
    element: projectRoleGuard(
      ["SummaryReport"],
      withSuspense(<ProjectSummary />),
      "/"
    ),
  },
  {
    path: "stockyard-summary",
    element: projectRoleGuard(
      ["StockyardReport"],
      withSuspense(<StockyardSummary />),
      "/"
    ),
  },
  {
    path: "add-element-type",
    element: projectRoleGuard(
      ["AddElementType"],
      withSuspense(<AddElementType />),
      "/"
    ),
  },
  {
    path: "element-type-detail/:elementtypeId/:floorId",
    element: projectRoleGuard(
      ["ViewElementTypeDetail"],
      withSuspense(<Elementtypedetail />),
      "/"
    ),
  },
  {
    path: "dispatch-log",
    element: projectRoleGuard(
      ["ViewDispatchLog", "ViewRequestedDispatchLog"],
      withSuspense(<MixDispatch />),
      "/"
    ),
  },
  {
    path: "element-detail/:elementTypeId",
    element: projectRoleGuard(
      ["ViewElementDetail"],
      withSuspense(<ElementDetailPage />),
      "/"
    ),
  },
  {
    path: "dispatch-request",
    element: projectRoleGuard(
      ["AddErrectionRequest"],
      withSuspense(<RequestHandler />),
      "/"
    ),
  },
  {
    path: "erection-element",
    element: projectRoleGuard(
      ["ViewElementInErrectionSite", "ViewNotErectedElement"],
      withSuspense(<MixErrectedElement />),
      "/"
    ),
  },
  {
    path: "edit-element-type/:elementTypeId/:floorId",
    element: projectRoleGuard(
      ["EditElementType"],
      withSuspense(<EditElementType />)
    ),
  },
  {
    path: "hierarchy",
    element: projectRoleGuard(
      ["ViewStructure"],
      withSuspense(<MixHierarchy />),
      "/"
    ),
  },
  {
    path: "add-project-member",
    element: projectRoleGuard(["AddMember"], withSuspense(<AddMember />)),
  },
  {
    path: "vehicle-dispatch",
    element: projectRoleGuard(
      ["AddDispatchLog"],
      withSuspense(<VehicleDispatch />),
      "/"
    ),
  },
  {
    path: "edit-member/:user_id",
    element: projectRoleGuard(["EditMember"], withSuspense(<EditMember />)),
  },
];

const routes: RouteObject[] = [
  { path: "/login", element: withSuspense(<Login />) },
  {
    path: "/",
    element: (
      <PrivateRoute>
        <UserProvider>
          <MainLayout />
        </UserProvider>
      </PrivateRoute>
    ),
    children: mainChildren,
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
    children: projectChildren,
  },
  // Catch-all 404 route - must be last
  {
    path: "*",
    element: <NotFound />,
  },
];

export const router = createBrowserRouter(routes);
export default router;
