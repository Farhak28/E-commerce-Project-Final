"use client";

import { Input } from "@/components/ui";
import { t } from "@/lib/i18n";
import type { AddressDTO } from "@/lib/types";

type AddressFormFieldsProps = {
  value: AddressDTO;
  onChange: (next: AddressDTO) => void;
  language: "en" | "ar";
  ready: boolean;
  idPrefix?: string;
};

export function AddressFormFields({
  value,
  onChange,
  language,
  ready,
  idPrefix = "addr",
}: AddressFormFieldsProps) {
  const set = (field: keyof AddressDTO, fieldValue: string) =>
    onChange({ ...value, [field]: fieldValue });

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Input
        id={`${idPrefix}-firstName`}
        placeholder={ready ? t("firstName", language) : "First name"}
        value={value.firstName}
        onChange={(e) => set("firstName", e.target.value)}
        autoComplete="given-name"
      />
      <Input
        id={`${idPrefix}-lastName`}
        placeholder={ready ? t("lastName", language) : "Last name"}
        value={value.lastName}
        onChange={(e) => set("lastName", e.target.value)}
        autoComplete="family-name"
      />
      <Input
        id={`${idPrefix}-city`}
        placeholder={ready ? t("city", language) : "City"}
        value={value.city}
        onChange={(e) => set("city", e.target.value)}
        autoComplete="address-level2"
      />
      <Input
        id={`${idPrefix}-country`}
        placeholder={ready ? t("country", language) : "Country"}
        value={value.country}
        onChange={(e) => set("country", e.target.value)}
        autoComplete="country-name"
      />
      <Input
        id={`${idPrefix}-street`}
        placeholder={ready ? t("streetAddress", language) : "Street address"}
        className="sm:col-span-2"
        value={value.street}
        onChange={(e) => set("street", e.target.value)}
        autoComplete="street-address"
      />
    </div>
  );
}
