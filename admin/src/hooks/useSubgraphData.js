import { useState, useEffect } from "react";
import { querySubgraph, QUERIES } from "../lib/subgraph.js";
import { SUBGRAPH_URL } from "../config/contracts.js";

export function useSubgraphData() {
  const [rateHistory, setRateHistory] = useState([]);
  const [volumeOrTvl, setVolumeOrTvl] = useState([]);
  const [loading, setLoading] = useState(!!SUBGRAPH_URL);
  const [error, setError] = useState(SUBGRAPH_URL ? null : "Subgraph not configured");

  useEffect(() => {
    if (!SUBGRAPH_URL) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [rateRes, volumeRes] = await Promise.all([
          querySubgraph(QUERIES.rateHistory, { first: 20 }),
          querySubgraph(QUERIES.volumeOrTvl, { first: 30 }),
        ]);
        if (cancelled) return;
        if (rateRes.error && volumeRes.error) {
          setError(rateRes.error);
          return;
        }
        setError(null);
        setRateHistory(rateRes.data?.interestRateChanges ?? []);
        setVolumeOrTvl(volumeRes.data?.dailySnapshots ?? []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Subgraph error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { rateHistory, volumeOrTvl, loading, error, configured: !!SUBGRAPH_URL };
}
