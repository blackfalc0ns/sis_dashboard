import pathlib
path = pathlib.Path(r'E:/sis-dashboard/src/features/settings/users/pages/SettingsUsersPage.tsx')
text = path.read_text(encoding='utf-8')
text = text.replace('import { MailPlus, RefreshCcw, UserPlus } from "lucide-react";','import { KeyRound, Mail, MailPlus, Pencil, RefreshCcw, UserCheck, UserPlus, UserX } from "lucide-react";')
old = '''        return (
          <div className="flex flex-wrap gap-2">
            {hasPermission("settings.users.manage") ? (
              <>
                <Button
                  variant="secondary"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedUser(user);
                    setModalMode("edit");
                  }}
                >
                  {tCommon("edit")}
                </Button>
                {user.status === "invited" ? (
                  <Button
                    variant="secondary"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleResendInvite(user.id);
                    }}
                  >
                    {t("resend_invite")}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handlePasswordReset(user.id);
                    }}
                  >
                    {t("reset_password")}
                  </Button>
                )}
                <Button
                  variant={user.status === "inactive" ? "primary" : "secondary"}
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleToggleStatus(user);
                  }}
                >
                  {user.status === "inactive" ? t("activate") : t("deactivate")}
                </Button>
              </>
            ) : null}
          </div>
        );
'''
new = '''        return (
          <div className="flex flex-wrap gap-2">
            {hasPermission("settings.users.manage") ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 rounded-lg border border-gray-200 p-0"
                  title={tCommon("edit")}
                  aria-label={tCommon("edit")}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedUser(user);
                    setModalMode("edit");
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                {user.status === "invited" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 rounded-lg border border-gray-200 p-0"
                    title={t("resend_invite")}
                    aria-label={t("resend_invite")}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleResendInvite(user.id);
                    }}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 rounded-lg border border-gray-200 p-0"
                    title={t("reset_password")}
                    aria-label={t("reset_password")}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handlePasswordReset(user.id);
                    }}
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant={user.status === "inactive" ? "primary" : "ghost"}
                  size="sm"
                  className={`h-9 w-9 rounded-lg p-0 ${user.status === "inactive" ? "" : "border border-gray-200"}`}
                  title={user.status === "inactive" ? t("activate") : t("deactivate")}
                  aria-label={user.status === "inactive" ? t("activate") : t("deactivate")}
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleToggleStatus(user);
                  }}
                >
                  {user.status === "inactive" ? (
                    <UserCheck className="h-4 w-4" />
                  ) : (
                    <UserX className="h-4 w-4" />
                  )}
                </Button>
              </>
            ) : null}
          </div>
        );
'''
if old not in text:
    raise SystemExit('action block not found')
text = text.replace(old, new)
path.write_text(text, encoding='utf-8')
