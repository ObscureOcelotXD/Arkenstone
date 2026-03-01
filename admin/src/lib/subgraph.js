import { SUBGRAPH_URL } from "../config/contracts.js";

/**
 * Run a GraphQL query against the Arkenstone subgraph.
 * Returns { data, error }. When SUBGRAPH_URL is not set, returns { data: null, error: 'Subgraph not configured' }.
 */
export async function querySubgraph(query, variables = {}) {
  if (!SUBGRAPH_URL) {
    return { data: null, error: "Subgraph not configured" };
  }
  try {
    const res = await fetch(SUBGRAPH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors?.length) {
      return { data: null, error: json.errors[0].message || "GraphQL error" };
    }
    return { data: json.data, error: null };
  } catch (err) {
    return { data: null, error: err.message || "Network error" };
  }
}

/**
 * Queries match the subgraph in subgraph/ (schema: Protocol, InterestRateChange, EthDeposit, etc.).
 * See subgraph/schema.graphql and docs/THE_GRAPH.md.
 */
export const QUERIES = {
  rateHistory: `
    query RateHistory($first: Int!) {
      interestRateChanges(first: $first, orderBy: timestamp, orderDirection: desc) {
        id
        timestamp
        pool
        oldBps
        newBps
      }
    }
  `,
  protocol: `
    query Protocol {
      protocol(id: "global") {
        totalEthStaked
        totalArknStaked
        currentInterestRateBps
        currentArknInterestRateBps
        updatedAtTimestamp
      }
    }
  `,
  tvlOverTime: `
    query TvlOverTime($first: Int!) {
      tvlSnapshots(first: $first, orderBy: timestamp, orderDirection: desc) {
        id
        totalEthStaked
        totalArknStaked
        timestamp
      }
    }
  `,
};
