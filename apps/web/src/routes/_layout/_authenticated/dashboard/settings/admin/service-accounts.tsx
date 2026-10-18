import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import ServiceAccountsPanel from "@/components/admin/service-accounts/service-accounts-panel";
import PageTitle from "@/components/page-title";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/settings/admin/service-accounts",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();

  return (
    <>
      <PageTitle title={t("settings:adminServiceAccounts.title")} />
      <ServiceAccountsPanel />
    </>
  );
}
