"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminEmptyState,
  AdminLoadingGrid,
  AdminPageHeader,
  AdminTable,
} from "@/components/admin/admin-ui";
import { Button, Card, Input } from "@/components/ui";
import { useAdminI18n } from "@/lib/admin/use-admin-i18n";
import {
  addAdminBlockedDate,
  addAdminHoliday,
  createAdminTimeSlot,
  deleteAdminBlockedDate,
  deleteAdminHoliday,
  deleteAdminTimeSlot,
  getAdminShippingConfig,
  updateAdminShippingSettings,
} from "@/lib/services/delivery";
import type { AdminShippingConfigDTO } from "@/lib/types";

export default function AdminShippingPage() {
  const { t } = useAdminI18n();
  const [config, setConfig] = useState<AdminShippingConfigDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [blockedDate, setBlockedDate] = useState("");
  const [blockedReason, setBlockedReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setConfig(await getAdminShippingConfig());
    } catch {
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveSettings = async () => {
    if (!config) return;
    setSaving(true);
    setMessage(null);
    try {
      const updated = await updateAdminShippingSettings(config.settings);
      setConfig((prev) => (prev ? { ...prev, settings: updated } : prev));
      setMessage(t("settingsSaved"));
    } catch {
      setMessage(t("couldNotLoadShipping"));
    } finally {
      setSaving(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!holidayDate || !holidayName.trim()) return;
    await addAdminHoliday({ date: holidayDate, name: holidayName.trim() });
    setHolidayDate("");
    setHolidayName("");
    await load();
  };

  const handleAddBlocked = async () => {
    if (!blockedDate) return;
    await addAdminBlockedDate({ date: blockedDate, reason: blockedReason.trim() || null });
    setBlockedDate("");
    setBlockedReason("");
    await load();
  };

  const handleAddSlot = async () => {
    await createAdminTimeSlot({
      label: "New slot",
      startTime: "09:00",
      endTime: "12:00",
      capacity: 10,
      isActive: true,
      sortOrder: (config?.timeSlots.length ?? 0) + 1,
    });
    await load();
  };

  if (loading) return <AdminLoadingGrid count={3} />;
  if (!config) return <AdminEmptyState title={t("couldNotLoadShipping")} />;

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("shippingTitle")} description={t("shippingDesc")} />
      {message ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p> : null}

      <Card className="space-y-4">
        <h2 className="section-title text-lg font-semibold">{t("schedulingSettings")}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            {t("minLeadHours")}
            <Input
              type="number"
              min={0}
              className="mt-1"
              value={config.settings.minLeadHours}
              onChange={(e) =>
                setConfig({
                  ...config,
                  settings: { ...config.settings, minLeadHours: Number(e.target.value) },
                })
              }
            />
          </label>
          <label className="text-sm">
            {t("maxScheduleDays")}
            <Input
              type="number"
              min={1}
              className="mt-1"
              value={config.settings.maxScheduleDaysAhead}
              onChange={(e) =>
                setConfig({
                  ...config,
                  settings: { ...config.settings, maxScheduleDaysAhead: Number(e.target.value) },
                })
              }
            />
          </label>
          <label className="flex items-end gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.settings.schedulingEnabled}
              onChange={(e) =>
                setConfig({
                  ...config,
                  settings: { ...config.settings, schedulingEnabled: e.target.checked },
                })
              }
            />
            {t("schedulingEnabled")}
          </label>
        </div>
        <Button type="button" onClick={saveSettings} disabled={saving}>
          {saving ? t("saving") : t("save")}
        </Button>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="section-title text-lg font-semibold">{t("timeSlots")}</h2>
          <Button type="button" onClick={handleAddSlot}>
            {t("addTimeSlot")}
          </Button>
        </div>
        <AdminTable
          columns={[t("colLabel"), t("colStart"), t("colEnd"), t("colCapacity"), t("colActive"), t("actions")]}
          rows={config.timeSlots.map((slot) => [
            slot.label,
            slot.startTime,
            slot.endTime,
            String(slot.capacity),
            slot.isActive ? t("yes") : t("no"),
            <button
              key={slot.id}
              type="button"
              className="text-sm text-accent"
              onClick={() => void deleteAdminTimeSlot(slot.id).then(load)}
            >
              {t("delete")}
            </button>,
          ])}
        />
      </Card>

      <Card>
        <h2 className="section-title mb-3 text-lg font-semibold">{t("pricingRules")}</h2>
        <p className="mb-3 text-sm text-text-muted">
          Rules are seeded from configuration. Amounts are applied by the pricing engine at checkout.
        </p>
        <AdminTable
          columns={[t("colLabel"), "Type", t("colAmount"), t("colActive")]}
          rows={config.pricingRules.map((rule) => [
            rule.label,
            rule.ruleType,
            `$${rule.amount.toFixed(2)}`,
            rule.isActive ? t("yes") : t("no"),
          ])}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="section-title text-lg font-semibold">{t("holidays")}</h2>
          <div className="flex flex-wrap gap-2">
            <Input type="date" value={holidayDate} onChange={(e) => setHolidayDate(e.target.value)} />
            <Input
              placeholder={t("colName")}
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
            />
            <Button type="button" onClick={handleAddHoliday}>
              {t("addHoliday")}
            </Button>
          </div>
          <AdminTable
            columns={[t("colDate"), t("colName"), t("actions")]}
            rows={config.holidays.map((h) => [
              h.date,
              h.name,
              <button
                key={h.id}
                type="button"
                className="text-sm text-accent"
                onClick={() => void deleteAdminHoliday(h.id).then(load)}
              >
                {t("delete")}
              </button>,
            ])}
          />
        </Card>

        <Card className="space-y-3">
          <h2 className="section-title text-lg font-semibold">{t("blockedDates")}</h2>
          <div className="flex flex-wrap gap-2">
            <Input type="date" value={blockedDate} onChange={(e) => setBlockedDate(e.target.value)} />
            <Input
              placeholder={t("colReason")}
              value={blockedReason}
              onChange={(e) => setBlockedReason(e.target.value)}
            />
            <Button type="button" onClick={handleAddBlocked}>
              {t("addBlockedDate")}
            </Button>
          </div>
          <AdminTable
            columns={[t("colDate"), t("colReason"), t("actions")]}
            rows={config.blockedDates.map((b) => [
              b.date,
              b.reason ?? "—",
              <button
                key={b.id}
                type="button"
                className="text-sm text-accent"
                onClick={() => void deleteAdminBlockedDate(b.id).then(load)}
              >
                {t("delete")}
              </button>,
            ])}
          />
        </Card>
      </div>
    </div>
  );
}
