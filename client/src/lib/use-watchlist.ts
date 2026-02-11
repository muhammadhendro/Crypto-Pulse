import { useMutation, useQuery } from "@tanstack/react-query";
import { getWatchlist, saveWatchlist } from "@/lib/app-api";
import { queryClient } from "@/lib/queryClient";

const watchlistQueryKey = ["watchlist"];

export function useWatchlist() {
  const { data: watchlist = [] } = useQuery({
    queryKey: watchlistQueryKey,
    queryFn: getWatchlist,
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: (nextWatchlist: string[]) => saveWatchlist(nextWatchlist),
    onSuccess: (saved) => {
      queryClient.setQueryData(watchlistQueryKey, saved);
    },
  });

  const toggleWatchlist = async (coinId: string) => {
    const nextWatchlist = watchlist.includes(coinId)
      ? watchlist.filter((id) => id !== coinId)
      : [...watchlist, coinId];

    await saveMutation.mutateAsync(nextWatchlist);
  };

  const isInWatchlist = (coinId: string) => watchlist.includes(coinId);

  return { watchlist, toggleWatchlist, isInWatchlist, isSaving: saveMutation.isPending };
}
