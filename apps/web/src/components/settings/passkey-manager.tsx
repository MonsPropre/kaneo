import { Fingerprint, Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/lib/toast";

type Passkey = {
  id: string;
  name?: string | null;
  createdAt?: string | Date | null;
  lastUsedAt?: string | Date | null;
  aaguid?: string | null;
};

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "-";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function PasskeyManager() {
  const { t } = useTranslation();
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [name, setName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Passkey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSupported =
    typeof window !== "undefined" &&
    window.isSecureContext &&
    "PublicKeyCredential" in window &&
    "credentials" in navigator;

  const loadPasskeys = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await authClient.passkey.listUserPasskeys();

      if (result.error) {
        throw new Error(result.error.message);
      }

      setPasskeys((result.data ?? []) as Passkey[]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings:securityPage.passkeys.loadError"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadPasskeys();
  }, [loadPasskeys]);

  const handleRegister = async () => {
    if (!isSupported) {
      toast.error(t("settings:securityPage.passkeys.notSupported"));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authClient.passkey.addPasskey({
        name: name.trim() || undefined,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      setName("");
      await loadPasskeys();
      toast.success(t("settings:securityPage.passkeys.created"));
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        toast.error(t("settings:securityPage.passkeys.cancelled"));
      } else {
        toast.error(
          error instanceof Error
            ? error.message
            : t("settings:securityPage.passkeys.createError"),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;

    setIsSubmitting(true);

    try {
      const result = await authClient.passkey.deletePasskey({
        id: pendingDelete.id,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      setPasskeys((current) =>
        current.filter((passkey) => passkey.id !== pendingDelete.id),
      );
      setPendingDelete(null);
      toast.success(t("settings:securityPage.passkeys.deleted"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings:securityPage.passkeys.deleteError"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("settings:securityPage.passkeys.namePlaceholder")}
          aria-label={t("settings:securityPage.passkeys.nameLabel")}
          disabled={!isSupported || isSubmitting}
          maxLength={100}
        />

        <Button
          type="button"
          onClick={() => void handleRegister()}
          disabled={!isSupported || isSubmitting}
          className="gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          {t("settings:securityPage.passkeys.add")}
        </Button>
      </div>

      {!isSupported && (
        <p className="text-sm text-destructive">
          {t("settings:securityPage.passkeys.notSupported")}
        </p>
      )}

      {isLoading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("settings:securityPage.passkeys.loading")}
        </p>
      ) : passkeys.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("settings:securityPage.passkeys.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t("settings:securityPage.passkeys.columnName")}
                </TableHead>
                <TableHead>
                  {t("settings:securityPage.passkeys.columnCreated")}
                </TableHead>
                <TableHead className="text-right">
                  {t("settings:securityPage.passkeys.columnActions")}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {passkeys.map((passkey) => (
                <TableRow key={passkey.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Fingerprint className="size-4" />
                      <span>
                        {passkey.name ||
                          t("settings:securityPage.passkeys.unnamedKey")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(passkey.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setPendingDelete(passkey)}
                      disabled={isSubmitting}
                      aria-label={t(
                        "settings:securityPage.passkeys.deleteAria",
                        {
                          name:
                            passkey.name ||
                            t("settings:securityPage.passkeys.unnamedKey"),
                        },
                      )}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("settings:securityPage.passkeys.deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings:securityPage.passkeys.deleteDescription", {
                name:
                  pendingDelete?.name ||
                  t("settings:securityPage.passkeys.unnamedKey"),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingDelete(null)}
              disabled={isSubmitting}
            >
              {t("common:actions.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t("settings:securityPage.passkeys.deleteLoading")
                : t("settings:securityPage.passkeys.delete")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
