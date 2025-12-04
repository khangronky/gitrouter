'use client';

import { useEffect, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { AccountSettings } from '@/components/settings/account-settings';
import { TeamSettings } from '@/components/settings/team-settings';
import { IntegrationsSettings } from '@/components/settings/integrations-settings';
import { RepositorySettings } from '@/components/settings/repository-settings';
import { NotificationSettings } from '@/components/settings/notification-settings';
import { useOrganizations } from '@/lib/api/organizations';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const { data, isLoading, error } = useOrganizations();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  // Auto-select first org (user's own org)
  useEffect(() => {
    if (
      data?.organizations &&
      data.organizations.length > 0 &&
      !selectedOrgId
    ) {
      setSelectedOrgId(data.organizations[0].id);
    }
  }, [data?.organizations, selectedOrgId]);

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data?.organizations?.length) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">No Organization Found</h2>
          <p className="text-muted-foreground">
            Please create or join an organization first.
          </p>
        </div>
      </div>
    );
  }

  const currentOrg = data.organizations.find((o) => o.id === selectedOrgId);

  if (!currentOrg || !selectedOrgId) {
    return null;
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        {/* Account Setting */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Account Settings</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Your personal account information and linked integrations.
          </p>
          <AccountSettings />
        </section>

        <Separator className="my-8" />

        {/* Team Setting */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Team Setting</h2>
          <TeamSettings orgId={selectedOrgId} orgName={currentOrg.name} />
        </section>

        <Separator className="my-8" />

        {/* Integrations Setting */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Integrations Setting</h2>
          <IntegrationsSettings orgId={selectedOrgId} />
        </section>

        {/* Repository */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Repository</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            GitHub Repositories (enable/disable which ones track)
          </p>
          <RepositorySettings orgId={selectedOrgId} />
        </section>

        <Separator className="my-8" />

        {/* Notifications Setting */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Notifications Setting</h2>
          <NotificationSettings orgId={selectedOrgId} />
        </section>
      </div>
    </div>
  );
}
