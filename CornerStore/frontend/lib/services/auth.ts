import { apiClient, setAuthToken } from "@/lib/services/api-client";
import type {
  AddressDTO,
  LoginDTO,
  RegisterDTO,
  SavedAddressDTO,
  UpsertSavedAddressDTO,
  UserDTO,
} from "@/lib/types";

export async function login(credentials: LoginDTO): Promise<UserDTO> {
  const user = await apiClient<UserDTO>("/Authentication/Login", {
    method: "POST",
    body: JSON.stringify(credentials),
    skipAuth: true,
  });
  setAuthToken(user.token);
  return user;
}

export async function register(data: RegisterDTO): Promise<UserDTO> {
  const user = await apiClient<UserDTO>("/Authentication/Register", {
    method: "POST",
    body: JSON.stringify(data),
    skipAuth: true,
  });
  setAuthToken(user.token);
  return user;
}

export async function getCurrentUser(): Promise<UserDTO> {
  return apiClient<UserDTO>("/Authentication/CurrentUser");
}

export async function checkEmailExists(email: string): Promise<boolean> {
  return apiClient<boolean>("/Authentication/emailExists", {
    params: { email },
    skipAuth: true,
  });
}

export async function getAddress(): Promise<AddressDTO> {
  return apiClient<AddressDTO>("/Authentication/Address");
}

export async function updateAddress(address: AddressDTO): Promise<AddressDTO> {
  return apiClient<AddressDTO>("/Authentication/Address", {
    method: "PUT",
    body: JSON.stringify(address),
  });
}

export async function getAddresses(): Promise<SavedAddressDTO[]> {
  return apiClient<SavedAddressDTO[]>("/Authentication/Addresses");
}

export async function upsertAddress(address: UpsertSavedAddressDTO): Promise<SavedAddressDTO> {
  return apiClient<SavedAddressDTO>("/Authentication/Addresses", {
    method: "PUT",
    body: JSON.stringify(address),
  });
}

export async function deleteAddress(addressId: number): Promise<void> {
  await apiClient<void>(`/Authentication/Addresses/${addressId}`, {
    method: "DELETE",
  });
}

export function logoutLocal(): void {
  setAuthToken(null);
}
