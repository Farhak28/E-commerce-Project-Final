"use client";



import { useCallback, useEffect, useState } from "react";

import { AdminPageHeader, AdminPagination, AdminSearchBar, AdminTable } from "@/components/admin/admin-ui";

import { Button, Card, Skeleton } from "@/components/ui";

import { useAdminI18n } from "@/lib/admin/use-admin-i18n";

import { getAdminAiLogById, getAdminAiLogs } from "@/lib/services/admin-ai";

import type { AssistantInteractionLogDetailDTO, AdminAiLogsPageDTO } from "@/lib/types";



export default function AdminAiLogsPage() {

  const { t } = useAdminI18n();

  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");

  const [appliedSearch, setAppliedSearch] = useState("");

  const [data, setData] = useState<AdminAiLogsPageDTO | null>(null);

  const [detail, setDetail] = useState<AssistantInteractionLogDetailDTO | null>(null);

  const [loading, setLoading] = useState(true);

  const pageSize = 15;



  const load = useCallback(async () => {

    setLoading(true);

    try {

      setData(await getAdminAiLogs(page, pageSize, appliedSearch || undefined));

    } catch {

      setData(null);

    } finally {

      setLoading(false);

    }

  }, [appliedSearch, page]);



  useEffect(() => {

    void load();

  }, [load]);



  const openDetail = async (id: number) => {

    try {

      setDetail(await getAdminAiLogById(id));

    } catch {

      setDetail(null);

    }

  };



  return (

    <div className="space-y-6">

      <AdminPageHeader title={t("logsTitle")} description={t("logsDescExtended")} />

      <AdminSearchBar

        value={search}

        onChange={setSearch}

        onSubmit={() => {

          setPage(1);

          setAppliedSearch(search);

        }}

        placeholder={t("searchLogsPlaceholder")}

      />



      {loading ? (

        <Skeleton className="h-48 w-full rounded-2xl" />

      ) : (

        <>

          <AdminTable

            columns={[t("colUser"), t("colPrompt"), t("colTools"), t("colLatency"), t("colDate"), ""]}

            rows={(data?.items ?? []).map((log) => [

              log.userEmail ?? t("guest"),

              <span key={`p-${log.id}`} className="line-clamp-2 max-w-md">{log.userPrompt}</span>,

              log.toolCalls ? t("yes") : "—",

              `${log.latencyMs} ms`,

              new Date(log.createdAt).toLocaleString(),

              <Button key={`v-${log.id}`} type="button" variant="secondary" onClick={() => void openDetail(log.id)}>

                {t("view")}

              </Button>,

            ])}

            emptyMessage={t("noConversationLogs")}

          />

          <AdminPagination

            page={page}

            pageSize={pageSize}

            totalCount={data?.totalCount ?? 0}

            onPageChange={setPage}

          />

        </>

      )}



      {detail ? (

        <Card className="fixed inset-x-4 bottom-4 top-auto z-50 max-h-[70vh] overflow-y-auto p-4 shadow-2xl md:inset-x-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-2xl md:-translate-x-1/2 md:-translate-y-1/2">

          <div className="mb-3 flex items-start justify-between gap-3">

            <h2 className="font-semibold">{t("logNumber", { id: detail.id })}</h2>

            <Button type="button" variant="ghost" onClick={() => setDetail(null)}>{t("close")}</Button>

          </div>

          <div className="space-y-3 text-sm">

            <p><span className="text-text-muted">{t("labelUser")}</span> {detail.userEmail ?? t("guest")}</p>

            <p><span className="text-text-muted">{t("labelPrompt")}</span> {detail.userPrompt}</p>

            <p><span className="text-text-muted">{t("labelResponse")}</span> {detail.assistantResponse}</p>

            {detail.toolCalls ? (

              <pre className="overflow-x-auto rounded-lg bg-surface-2 p-3 text-xs">{detail.toolCalls}</pre>

            ) : null}

            {detail.retrievedChunks ? (

              <pre className="overflow-x-auto rounded-lg bg-surface-2 p-3 text-xs">{detail.retrievedChunks}</pre>

            ) : null}

          </div>

        </Card>

      ) : null}

    </div>

  );

}

