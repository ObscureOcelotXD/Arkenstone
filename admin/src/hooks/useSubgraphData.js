import { useState, useEffect, useCallback } from "react";
import { querySubgraph, QUERIES } from "../lib/subgraph.js";
import { SUBGRAPH_URL } from "../config/contracts.js";

export function useSubgraphData() {
  const [rateHistory, setRateHistory] = useState([]);
  const [volumeOrTvl, setVolumeOrTvl] = useState([]);
  const [loading, setLoading] = useState(!!SUBGRAPH_URL);
  const [error, setError] = useState(SUBGRAPH_URL ? null : "Subgraph not configured");

  const refetch = useCallback(async () => {
    if (!SUBGRAPH_URL) return;
    setLoading(true);
    try {
      const [rateRes, tvlRes] = await Promise.all([
        querySubgraph(QUERIES.rateHistory, { first: 20 }),
        querySubgraph(QUERIES.tvlOverTime, { first: 30 }),
      ]);
      if (rateRes.error && tvlRes.error) {
        setError(rateRes.error);
        return;
      }
      setError(null);
      setRateHistory(rateRes.data?.interestRateChanges ?? []);
      setVolumeOrTvl(tvlRes.data?.tvlSnapshots ?? []);
    } catch (err) {
      setError(err.message || "Subgraph error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!SUBGRAPH_URL) {
      setLoading(false);
      return;
    }
    refetch();
  }, [refetch, SUBGRAPH_URL]);

  return { rateHistory, volumeOrTvl, loading, error, configured: !!SUBGRAPH_URL, refetch };
}
