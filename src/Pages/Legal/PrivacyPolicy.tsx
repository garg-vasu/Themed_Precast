import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Lock, Database, UserCheck, Mail } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="flex flex-col gap-2 p-4 ">
      <PageHeader title="Privacy Policy" />

      <p className="text-muted-foreground text-sm">
        Last updated: February 2026
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Introduction
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground">
            PreCast Management System ("we," "our," or "us") is committed to
            protecting the privacy and security of your personal information.
            This Privacy Policy describes how we collect, use, and safeguard
            information within our internal construction and precast management
            platform.
          </p>
          <p className="text-muted-foreground">
            This platform is designed for authorized personnel involved in
            precast element manufacturing, stockyard management, dispatch
            operations, and erection site coordination.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5 text-primary" />
            Information We Collect
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">User Account Information</h4>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
              <li>Name and employee identification</li>
              <li>Email address and contact information</li>
              <li>Role and department assignments</li>
              <li>Project access permissions</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Operational Data</h4>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
              <li>Project and task assignments</li>
              <li>Attendance and manpower records</li>
              <li>Quality control inspection data</li>
              <li>Dispatch and delivery logs</li>
              <li>Element tracking and stockyard records</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">System Usage Data</h4>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
              <li>Login timestamps and session information</li>
              <li>Activity logs for audit purposes</li>
              <li>Device and browser information</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5 text-primary" />
            How We Use Your Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground text-sm">
          <p>We use the collected information to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Manage user authentication and access control</li>
            <li>Track precast element production and quality assurance</li>
            <li>Coordinate stockyard operations and dispatch logistics</li>
            <li>Generate reports for project management and planning</li>
            <li>Maintain audit trails for compliance and accountability</li>
            <li>Improve system functionality and user experience</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5 text-primary" />
            Data Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground text-sm">
          <p>
            We implement industry-standard security measures to protect your
            data:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Encrypted data transmission (HTTPS/TLS)</li>
            <li>Role-based access control (RBAC)</li>
            <li>Regular security audits and monitoring</li>
            <li>Secure database storage with backup procedures</li>
            <li>Session management and automatic timeout</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCheck className="h-5 w-5 text-primary" />
            Your Rights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground text-sm">
          <p>As an authorized user, you have the right to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Access your personal information stored in the system</li>
            <li>Request correction of inaccurate data</li>
            <li>Understand how your data is being used</li>
            <li>Report any security concerns to system administrators</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-primary" />
            Contact Us
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          <p>
            For any privacy-related questions or concerns, please contact your
            system administrator or reach out to our support team.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
