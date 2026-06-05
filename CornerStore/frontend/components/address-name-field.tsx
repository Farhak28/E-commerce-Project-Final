"use client";

import { Input } from "@/components/ui";
import { t } from "@/lib/i18n";
import { ADDRESS_NAME_PRESETS } from "@/lib/utils/address";

type AddressNameFieldProps = {
  value: string;
  onChange: (name: string) => void;
  language: "en" | "ar";
  ready: boolean;
  id?: string;
};

export function AddressNameField({
  value,
  onChange,
  language,
  ready,
  id = "address-name",
}: AddressNameFieldProps) {
  return (
    <div className="space-y-2">
      <Input
        id={id}
        placeholder={ready ? t("addressNamePlaceholder", language) : "Address name (e.g. Home, Office)"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {ADDRESS_NAME_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              value.toLowerCase() === preset.toLowerCase()
                ? "bg-primary text-white"
                : "bg-surface-2 text-text-muted hover:bg-surface"
            }`}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
