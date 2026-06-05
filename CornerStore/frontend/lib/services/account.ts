import { apiClient } from "@/lib/services/api-client";
import type { AccountDashboardDTO } from "@/lib/types";

export async function getAccountDashboard(): Promise<AccountDashboardDTO> {
  return apiClient<AccountDashboardDTO>("/Account/dashboard");
}
