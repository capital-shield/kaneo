import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import useCreateServiceAccount from "@/hooks/mutations/admin/use-create-service-account";

type FormValues = { name: string };

type CreateServiceAccountDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateServiceAccountDialog({
  open,
  onClose,
}: CreateServiceAccountDialogProps) {
  const { t } = useTranslation();
  const { mutateAsync: createServiceAccount, isPending } =
    useCreateServiceAccount();

  const schema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, t("settings:adminServiceAccounts.create.nameRequired"))
          .max(100, t("settings:adminServiceAccounts.create.nameTooLong")),
      }),
    [t],
  );

  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { name: "" },
  });

  const onSubmit = async ({ name }: FormValues) => {
    try {
      await createServiceAccount(name);
      form.reset();
      onClose();
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
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
    >
      <DialogPopup className="sm:max-w-md">
        <Form {...form}>
          <form className="contents" onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>
                {t("settings:adminServiceAccounts.create.title")}
              </DialogTitle>
              <DialogDescription>
                {t("settings:adminServiceAccounts.create.description")}
              </DialogDescription>
            </DialogHeader>
            <DialogPanel>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("settings:adminServiceAccounts.create.nameLabel")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          "settings:adminServiceAccounts.create.namePlaceholder",
                        )}
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {t(
                        "settings:adminServiceAccounts.create.nameDescription",
                      )}
                    </FormDescription>
                    <FormMessage className="font-normal text-destructive-foreground text-xs" />
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
                  ? t("settings:adminServiceAccounts.create.creating")
                  : t("settings:adminServiceAccounts.create.submit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogPopup>
    </Dialog>
  );
}
