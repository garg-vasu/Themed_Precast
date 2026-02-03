import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Users,
  ShieldCheck,
  AlertTriangle,
  Scale,
  RefreshCw,
} from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title="Terms of Service" />

      <p className="text-muted-foreground text-sm">
        Last updated: February 2026
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Agreement to Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground">
            By accessing and using the PreCast Management System, you agree to
            be bound by these Terms of Service. This platform is an internal
            tool designed for authorized personnel to manage precast element
            production, stockyard operations, dispatch logistics, and erection
            site coordination.
          </p>
          <p className="text-muted-foreground">
            If you do not agree to these terms, please refrain from using the
            system and contact your supervisor.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            User Responsibilities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Account Security</h4>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
              <li>Keep your login credentials confidential and secure</li>
              <li>Do not share your account with unauthorized individuals</li>
              <li>Log out after each session, especially on shared devices</li>
              <li>Report any suspected unauthorized access immediately</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Proper Use</h4>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
              <li>Use the system only for authorized work-related purposes</li>
              <li>Enter accurate and truthful data in all records</li>
              <li>Follow quality control and inspection protocols</li>
              <li>Comply with all safety and operational guidelines</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Acceptable Use Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground text-sm">
          <p>When using the PreCast Management System, you agree NOT to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Attempt to access data or features beyond your permissions</li>
            <li>
              Tamper with, modify, or delete records without authorization
            </li>
            <li>
              Share confidential project information with external parties
            </li>
            <li>Use the system for any illegal or unauthorized purpose</li>
            <li>Interfere with or disrupt the system's functionality</li>
            <li>Upload malicious software or harmful content</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Data Accuracy & Integrity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground text-sm">
          <p>
            As this system manages critical construction and manufacturing data:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>You are responsible for the accuracy of data you enter</li>
            <li>
              QC inspection records must reflect actual inspection results
            </li>
            <li>Dispatch and delivery logs must be updated in real-time</li>
            <li>
              Any errors should be corrected promptly through proper channels
            </li>
            <li>Falsification of records may result in disciplinary action</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5 text-primary" />
            Intellectual Property
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground text-sm">
          <p>
            All content, features, and functionality of the PreCast Management
            System are owned by the organization and protected by applicable
            laws:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Software code, design, and user interface elements</li>
            <li>Project data, drawings, and technical documentation</li>
            <li>Reports, analytics, and generated content</li>
          </ul>
          <p className="mt-2">
            Unauthorized reproduction, distribution, or use of any system
            content is prohibited.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <RefreshCw className="h-5 w-5 text-primary" />
            Changes to Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          <p>
            We reserve the right to modify these Terms of Service at any time.
            Users will be notified of significant changes through system
            announcements. Continued use of the platform after changes
            constitutes acceptance of the updated terms.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
