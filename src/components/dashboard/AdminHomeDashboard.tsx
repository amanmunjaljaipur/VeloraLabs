import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ROLE_LABELS } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import { Shield, Users, Video } from "lucide-react";
import Link from "next/link";

interface AdminHomeDashboardProps {
  userName: string | null | undefined;
  role: UserRole;
}

export function AdminHomeDashboard({ userName, role }: AdminHomeDashboardProps) {
  const firstName = userName?.split(" ")[0] ?? "Admin";

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <p className="text-sm font-medium uppercase tracking-wider text-teal">
          {ROLE_LABELS[role]} dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-4xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-3 max-w-2xl text-text-secondary">
          Manage learner roles, upload session recordings, and keep programs running smoothly.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card hover>
            <Users className="h-8 w-8 text-teal" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Role assignment</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Assign Student, Engineer, or Professional roles by email.
            </p>
            <Link href="/admin/role-assignment" className="mt-6 inline-block">
              <Button>Open admin panel</Button>
            </Link>
          </Card>

          <Card hover>
            <Video className="h-8 w-8 text-teal" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Session videos</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Add or update YouTube recordings for each course day.
            </p>
            <Link href="/admin/sessions" className="mt-6 inline-block">
              <Button variant="secondary">Manage sessions</Button>
            </Link>
          </Card>

          <Card hover>
            <Shield className="h-8 w-8 text-teal" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Learner experience</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Assigned learners see a personalized home page with course progress.
            </p>
            <Link href="/for/students" className="mt-6 inline-block">
              <Button variant="secondary">View courses</Button>
            </Link>
          </Card>
        </div>
      </div>
    </section>
  );
}