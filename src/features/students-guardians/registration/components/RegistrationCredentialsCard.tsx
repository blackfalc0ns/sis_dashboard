"use client";

import { useState } from "react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RegistrationAccountResult } from "@/features/students-guardians/registration/types/registrationResult";

export default function RegistrationCredentialsCard({ account, guardianName }: { account: RegistrationAccountResult; guardianName?: string }) {
  const t = useTranslations("students_guardians.registration.credentials");
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const label = account.target === "student" 
    ? t("student_account") 
    : guardianName 
      ? t("guardian_account", { name: guardianName }) 
      : t("parent_account");

  const copy = async (name: string, value?: string | null) => { 
    if (!value) return; 
    await navigator.clipboard.writeText(value); 
    setCopied(name); 
  };

  const copyAll = async () => copy("all", [
    account.user?.username && `${t("username")}: ${account.user.username}`, 
    account.user?.loginEmail && `${t("login_email")}: ${account.user.loginEmail}`, 
    account.temporaryPassword && `${t("temporary_password")}: ${account.temporaryPassword}`
  ].filter(Boolean).join("\n"));

  const tone = account.status === "failed" 
    ? "border-red-200 bg-red-50" 
    : account.status === "skipped" 
      ? "border-amber-200 bg-amber-50" 
      : "border-green-200 bg-green-50";

  return (
    <section className={`rounded-xl border p-4 ${tone}`}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-900">{label}</h4>
          <p className="text-sm capitalize text-gray-600">{account.status}</p>
        </div>
        {account.status === "created" || account.status === "linked" ? (
          <Check className="h-5 w-5 text-green-700" />
        ) : null}
      </div>

      {account.user && (
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Credential 
            label={t("username")} 
            value={account.user.username} 
            onCopy={() => copy("username", account.user?.username)} 
            copied={copied === "username"} 
            copyText={t("copied_status")}
          />
          <Credential 
            label={t("login_email")} 
            value={account.user.loginEmail} 
            onCopy={() => copy("email", account.user?.loginEmail)} 
            copied={copied === "email"} 
            copyText={t("copied_status")}
          />
        </dl>
      )}

      {account.temporaryPassword && (
        <div className="mt-3 rounded-lg border bg-white p-3">
          <span className="text-xs font-medium text-gray-500">{t("temporary_password")}</span>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 text-sm">{visible ? account.temporaryPassword : "••••••••••••"}</code>
            <button 
              type="button" 
              onClick={() => setVisible((current) => !current)} 
              aria-label={visible ? "Hide password" : "Show password"} 
              className="rounded p-1 hover:bg-gray-100"
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button 
              type="button" 
              onClick={() => copy("password", account.temporaryPassword)} 
              aria-label="Copy password" 
              className="rounded p-1 hover:bg-gray-100"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {(account.user || account.temporaryPassword) && (
        <button 
          type="button" 
          onClick={copyAll} 
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary cursor-pointer"
        >
          <Copy className="h-4 w-4" />
          {copied === "all" ? t("copied") : t("copy_all")}
        </button>
      )}

      {account.status === "failed" && (
        <p className="mt-3 text-sm text-red-700">{t("failed_note")}</p>
      )}
    </section>
  );
}

function Credential({ label, value, onCopy, copied, copyText }: { label: string; value?: string | null; onCopy: () => void; copied: boolean; copyText: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 flex items-center gap-2">
        <span className="break-all">{value}</span>
        <button 
          type="button" 
          onClick={onCopy} 
          aria-label={`Copy ${label.toLowerCase()}`} 
          className="rounded p-1 hover:bg-white cursor-pointer"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        {copied && <span className="text-xs text-green-700">{copyText}</span>}
      </dd>
    </div>
  );
}
