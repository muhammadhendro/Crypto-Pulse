import { useMutation, useQuery } from "@tanstack/react-query";
import { getSettings, saveSettings, type AppSettings } from "@/lib/app-api";
import { queryClient } from "@/lib/queryClient";

const queryKey = ["app-settings"];

export function useAppSettings() {
  const settingsQuery = useQuery({
    queryKey,
    queryFn: getSettings,
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: AppSettings) => saveSettings(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    isSaving: saveMutation.isPending,
    saveSettings: saveMutation.mutateAsync,
  };
}
