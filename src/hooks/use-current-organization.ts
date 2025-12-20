'use client';

import { useEffect, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useOrganizations } from '@/lib/api/organizations';
import { useOrganizationStore } from '@/stores/organization-store';
import type { OrganizationWithRoleType } from '@/lib/schema/organization';

interface UseCurrentOrganizationReturn {
  currentOrg: OrganizationWithRoleType | null;
  organizations: OrganizationWithRoleType[];
  currentOrgId: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  switchOrganization: (orgId: string, updateUrl?: boolean) => void;
  switchByIndex: (index: number) => void;
}

export function useCurrentOrganization(): UseCurrentOrganizationReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlOrgSlug = searchParams.get('org');

  const { data, isLoading } = useOrganizations();
  const organizations = data?.organizations ?? [];

  const { currentOrgId, setCurrentOrg, isInitialized } = useOrganizationStore();

  // Find org by slug (for URL override) or by ID
  const currentOrg = useMemo(() => {
    if (!organizations.length) return null;

    // URL slug takes priority
    if (urlOrgSlug) {
      const orgBySlug = organizations.find((o) => o.slug === urlOrgSlug);
      if (orgBySlug) return orgBySlug;
    }

    // Then check stored ID
    if (currentOrgId) {
      const orgById = organizations.find((o) => o.id === currentOrgId);
      if (orgById) return orgById;
    }

    // Fallback to first org
    return organizations[0] ?? null;
  }, [organizations, urlOrgSlug, currentOrgId]);

  // Sync URL org to store and auto-select first org
  useEffect(() => {
    if (!organizations.length || isLoading) return;

    // If URL has org slug, sync it to the store
    if (urlOrgSlug) {
      const orgBySlug = organizations.find((o) => o.slug === urlOrgSlug);
      if (orgBySlug && orgBySlug.id !== currentOrgId) {
        setCurrentOrg(orgBySlug.id);
      }
      return;
    }

    // Auto-select first org if none selected
    if (!currentOrgId && organizations.length > 0) {
      setCurrentOrg(organizations[0].id);
    }

    // Validate that stored org still exists
    if (currentOrgId && !organizations.find((o) => o.id === currentOrgId)) {
      setCurrentOrg(organizations[0].id);
    }
  }, [organizations, urlOrgSlug, currentOrgId, setCurrentOrg, isLoading]);

  const switchOrganization = (orgId: string, updateUrl = false) => {
    const org = organizations.find((o) => o.id === orgId);
    if (!org) return;

    setCurrentOrg(orgId);

    if (updateUrl) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('org', org.slug);
      router.push(`${pathname}?${params.toString()}`);
    } else if (urlOrgSlug) {
      // Remove org param if switching away from URL-specified org
      const params = new URLSearchParams(searchParams.toString());
      params.delete('org');
      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.replace(newUrl);
    }
  };

  const switchByIndex = (index: number) => {
    if (index >= 0 && index < organizations.length) {
      switchOrganization(organizations[index].id);
    }
  };

  return {
    currentOrg,
    organizations,
    currentOrgId: currentOrg?.id ?? null,
    isLoading,
    isInitialized,
    switchOrganization,
    switchByIndex,
  };
}
