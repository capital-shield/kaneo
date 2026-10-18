import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useId, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
  type ApiKeyExpiration,
  getExpirationSeconds,
  isApiKeyExpiration,
} from "@/components/settings/api-keys/api-key-expirations";
import { ApiKeyExpiryToggle } from "@/components/settings/api-keys/api-key-expiry-toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useCreateServiceAccountKey from "@/hooks/mutations/admin/use-create-service-account-key";
import type { ServiceAccount } from "@/hooks/queries/admin/use-service-accounts";

type FormValues = {
  name: string;
  expiresIn: ApiKeyExpiration;
};

// Integrations break when a key lapses unnoticed, so start from a long-lived
// key and let the administrator shorten it.
const DEFAULT_EXPIRATION: ApiKeyExpiration = "90d";

type CreateServiceAccountKeyDialogProps = {
  account: ServiceAccount | null;
  onClose: () => void;
  onCreated: (key: string) => void;
};

export function CreateServiceAccountKeyDialog({
  account,
  onClose,
  onCreated,
}: CreateServiceAccountKeyDialogProps) {
  const { t } = useTranslation();
  const { mutateAsync: createKey, isPending } = useCreateServiceAccountKey();
  const expiresLabelId = useId();

  const schema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, t("settings:apiKey.createDialog.validation.nameRequired"))
          .max(32, t("settings:adminServiceAccounts.key.nameTooLong")),
        expiresIn: z.custom<ApiKeyExpiration>(isApiKeyExpiration),
      }),
    [t],
  );

  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { name: "", expiresIn: DEFAULT_EXPIRATION },
  });

  const onSubmit = async (data: FormValues) => {
    if (!account) return;
    try {
      const result = await createKey({
        userId: account.id,
        name: data.name,
        expiresIn: getExpirationSeconds(data.expiresIn),
      });
      form.reset();
      onClose();
      onCreated(result.key);
    } catch {
      // The mutation's onError already reported it; keep the form open.
    }
  };

  const handleClose = () => {
    if (isPending) return;
    form.reset();
    onClose();
  };

  return (
    <Dialog
      open={account !== null}
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
    >
      <DialogPopup className="sm:max-w-md">
        <Form {...form}>
          <form className="contents" onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>
                {t("settings:adminServiceAccounts.key.title", {
                  name: account?.name ?? "",
                })}
              </DialogTitle>
              <DialogDescription>
                {t("settings:adminServiceAccounts.key.description")}
              </DialogDescription>
            </DialogHeader>
            <DialogPanel className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("settings:apiKey.createDialog.nameLabel")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          "settings:adminServiceAccounts.key.namePlaceholder",
                        )}
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage className="font-normal text-destructive-foreground text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiresIn"
                render={({ field }) => (
                  <FormItem>
                    <Label id={expiresLabelId} render={<span />}>
                      {t("settings:apiKey.createDialog.expirationLabel")}
                    </Label>
                    <ApiKeyExpiryToggle
                      labelledBy={expiresLabelId}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormItem>
                )}
              />
            </DialogPanel>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                {t("common:actions.cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? t("settings:apiKey.createDialog.creating")
                  : t("settings:apiKey.createDialog.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogPopup>
    </Dialog>
  );
}
