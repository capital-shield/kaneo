import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

type UserRoleBadgeProps = {
  isAdmin: boolean;
  isServiceAccount?: boolean;
};

export function UserRoleBadge({
  isAdmin,
  isServiceAccount = false,
}: UserRoleBadgeProps) {
  const { t } = useTranslation();

  if (isServiceAccount) {
    return (
      <Badge variant="outline" className="px-1.5 text-muted-foreground">
        {t("settings:adminUsers.serviceAccount")}
      </Badge>
    );
  }

  return isAdmin ? (
    <Badge variant="outline" className="px-1.5">
      {t("settings:adminUsers.roles.admin")}
    </Badge>
  ) : (
    <Badge variant="secondary" className="px-1.5 text-muted-foreground">
      {t("settings:adminUsers.roles.user")}
    </Badge>
  );
}
