import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import PageTitle from "@/components/page-title";
import { PasskeyManager } from "@/components/settings/passkey-manager";
import {
  Card,
  CardDescription,
  CardFrame,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/settings/account/security",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();

  return (
    <>
      <PageTitle title={t("settings:securityPage.pageTitle")} />

      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            {t("settings:securityPage.title")}
          </h1>

          <p className="text-muted-foreground">
            {t("settings:securityPage.subtitle")}
          </p>
        </div>

        <CardFrame>
          <Card className="!rounded-none !border-t-0">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 text-base">
                <ShieldCheck className="size-4" />
                {t("settings:securityPage.passkeys.title")}
              </CardTitle>

              <CardDescription>
                {t("settings:securityPage.passkeys.description")}
              </CardDescription>
            </CardHeader>

            <CardPanel className="p-4">
              <PasskeyManager />
            </CardPanel>
          </Card>
        </CardFrame>
      </div>
    </>
  );
}
