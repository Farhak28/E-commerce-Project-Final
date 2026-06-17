"use client";



import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { AdminPageHeader, AdminStatCard, AdminTable } from "@/components/admin/admin-ui";

import { Button, Card, Input, Skeleton } from "@/components/ui";

import { useAdminI18n } from "@/lib/admin/use-admin-i18n";

import {

  createKnowledgeDocument,

  deleteKnowledgeDocument,

  getKnowledgeDocuments,

  updateKnowledgeDocument,

} from "@/lib/services/knowledge";

import type { KnowledgeDocumentDTO } from "@/lib/types";



export default function AdminFaqPage() {

  const { t } = useAdminI18n();

  const [docs, setDocs] = useState<KnowledgeDocumentDTO[]>([]);

  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<KnowledgeDocumentDTO | null>(null);

  const [form, setForm] = useState({ title: "", content: "" });



  const load = useCallback(async () => {

    setLoading(true);

    try {

      setDocs(await getKnowledgeDocuments("FAQ"));

    } catch {

      setDocs([]);

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => {

    void load();

  }, [load]);



  const save = async () => {

    if (editing) {

      await updateKnowledgeDocument(editing.id, { ...form, category: "FAQ" });

    } else {

      await createKnowledgeDocument({ ...form, category: "FAQ" });

    }

    setEditing(null);

    setForm({ title: "", content: "" });

    await load();

  };



  return (

    <div className="space-y-6">

      <AdminPageHeader

        title={t("faqTitle")}

        description={t("faqDesc")}

        actions={

          <Link href="/admin/ai/knowledge" className="text-sm font-semibold text-primary">

            {t("allKnowledgeDocs")}

          </Link>

        }

      />

      <AdminStatCard label={t("faqEntries")} value={docs.length} />

      {(editing || form.title || form.content) && (

        <Card className="space-y-3">

          <Input

            placeholder={t("placeholderQuestion")}

            value={form.title}

            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}

          />

          <textarea

            className="min-h-32 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"

            placeholder={t("placeholderAnswer")}

            value={form.content}

            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}

          />

          <div className="flex gap-2">

            <Button type="button" onClick={() => void save()}>{t("saveFaq")}</Button>

            <Button

              type="button"

              variant="ghost"

              onClick={() => {

                setEditing(null);

                setForm({ title: "", content: "" });

              }}

            >

              {t("cancel")}

            </Button>

          </div>

        </Card>

      )}

      {!editing && !form.title && !form.content && (

        <Button type="button" onClick={() => setForm({ title: "", content: "" })}>{t("addFaq")}</Button>

      )}

      {loading ? (

        <Skeleton className="h-48 w-full rounded-2xl" />

      ) : (

        <AdminTable

          columns={[t("colQuestion"), t("colUpdated"), ""]}

          rows={docs.map((d) => [

            d.title,

            new Date(d.updatedAt).toLocaleDateString(),

            <div key="a" className="flex gap-2">

              <Button

                type="button"

                variant="secondary"

                onClick={() => {

                  setEditing(d);

                  setForm({ title: d.title, content: d.content });

                }}

              >

                {t("edit")}

              </Button>

              <Button type="button" variant="ghost" onClick={() => void deleteKnowledgeDocument(d.id).then(load)}>

                {t("delete")}

              </Button>

            </div>,

          ])}

          emptyMessage={t("noFaqEntries")}

        />

      )}

    </div>

  );

}

