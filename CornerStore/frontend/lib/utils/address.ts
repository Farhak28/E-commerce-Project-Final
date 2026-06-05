import type { AddressDTO, SavedAddressDTO, UpsertSavedAddressDTO } from "@/lib/types";

export const ADDRESS_NAME_PRESETS = ["Home", "Work", "Alternate"] as const;

export function emptyAddress(): AddressDTO {
  return { firstName: "", lastName: "", city: "", street: "", country: "" };
}

export function emptyUpsertAddress(name = ""): UpsertSavedAddressDTO {
  return { name, ...emptyAddress() };
}

export function isAddressComplete(address: Partial<AddressDTO>): boolean {
  return Boolean(
    address.firstName?.trim()
      && address.lastName?.trim()
      && address.city?.trim()
      && address.street?.trim()
      && address.country?.trim(),
  );
}

export function isPopulatedUpsertAddress(address: UpsertSavedAddressDTO): boolean {
  return Boolean(address.name?.trim()) && isAddressComplete(address);
}

export function savedToAddressDTO(saved: SavedAddressDTO): AddressDTO {
  return {
    firstName: saved.firstName,
    lastName: saved.lastName,
    city: saved.city,
    street: saved.street,
    country: saved.country,
  };
}

export function formatAddressLine(address: AddressDTO): string {
  return `${address.street}, ${address.city}, ${address.country}`;
}

export function defaultSaveAsName(existing: SavedAddressDTO[]): string {
  for (const preset of ADDRESS_NAME_PRESETS) {
    const count = existing.filter((a) => a.name.toLowerCase() === preset.toLowerCase()).length;
    if (count === 0) return preset;
  }
  return `Address ${existing.length + 1}`;
}
