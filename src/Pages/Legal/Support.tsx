import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HelpCircle,
  Mail,
  Phone,
  MessageSquare,
  BookOpen,
  AlertCircle,
  Clock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Support() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title="Support" />

      <p className="text-muted-foreground text-sm">
        Need help with the PreCast Management System? We're here to assist you.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-primary" />
              Email Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              For general inquiries and non-urgent issues
            </p>
            <a
              href="mailto:support@precast.com"
              className="text-primary hover:underline font-medium"
            >
              support@precast.com
            </a>
            <p className="text-muted-foreground text-xs">
              Response time: Within 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5 text-primary" />
              Phone Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              For urgent issues requiring immediate assistance
            </p>
            <p className="text-primary font-medium">+1 (555) 123-4567</p>
            <p className="text-muted-foreground text-xs">
              Available: Mon-Fri, 8:00 AM - 6:00 PM
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="h-5 w-5 text-primary" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-b border-border pb-3">
            <h4 className="font-medium mb-1">How do I reset my password?</h4>
            <p className="text-muted-foreground text-sm">
              Contact your system administrator or use the "Forgot Password"
              link on the login page. You'll receive a password reset email.
            </p>
          </div>
          <div className="border-b border-border pb-3">
            <h4 className="font-medium mb-1">
              Why can't I access certain features?
            </h4>
            <p className="text-muted-foreground text-sm">
              Access is controlled by role-based permissions. If you need
              additional access, contact your project manager or system
              administrator.
            </p>
          </div>
          <div className="border-b border-border pb-3">
            <h4 className="font-medium mb-1">
              How do I update element status in stockyard?
            </h4>
            <p className="text-muted-foreground text-sm">
              Navigate to the Stockyard section, select the element, and use the
              status update function. Ensure you have the required permissions.
            </p>
          </div>
          <div className="border-b border-border pb-3">
            <h4 className="font-medium mb-1">
              What should I do if I notice incorrect data?
            </h4>
            <p className="text-muted-foreground text-sm">
              Report data discrepancies to your supervisor immediately. If you
              have edit permissions, correct the data and document the change.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">
              How are QC approvals processed?
            </h4>
            <p className="text-muted-foreground text-sm">
              QC inspections go through a multi-stage approval process. Each
              stage requires authorized personnel to review and approve before
              elements can proceed to the next phase.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-primary" />
            Report an Issue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            When reporting an issue, please include:
          </p>
          <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
            <li>Your username and project name</li>
            <li>Description of the issue or error message</li>
            <li>Steps to reproduce the problem</li>
            <li>Screenshots if applicable</li>
            <li>Browser and device information</li>
          </ul>
          <Button variant="outline" className="mt-2">
            <MessageSquare className="h-4 w-4 mr-2" />
            Submit Issue Report
          </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              Documentation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground text-sm">
            <p>Access user guides and documentation:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>User Manual</li>
              <li>QC Inspection Guidelines</li>
              <li>Stockyard Management Guide</li>
              <li>Dispatch & Logistics Procedures</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Training
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground text-sm">
            <p>Need training on the system?</p>
            <p>
              Contact your supervisor to schedule a training session. We offer:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>New user onboarding</li>
              <li>Feature-specific training</li>
              <li>Refresher courses</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            Support Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Standard Support</p>
              <p className="text-muted-foreground">Monday - Friday</p>
              <p className="text-muted-foreground">8:00 AM - 6:00 PM</p>
            </div>
            <div>
              <p className="font-medium">Emergency Support</p>
              <p className="text-muted-foreground">24/7 for critical issues</p>
              <p className="text-muted-foreground">Call: +1 (555) 123-4567</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
