"use client";

import { useGrants } from "@/hooks/useGrants";

export default function GrantsDebugger() {
  const { grants, loading, error, user } = useGrants();

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Grants Debugger</h1>

      <div className="mb-4 p-2 border rounded">
        <h2 className="font-medium">Hook State:</h2>
        <pre className="bg-gray-100 p-2 rounded mt-2">
          {JSON.stringify(
            {
              loading,
              error: error ? error.toString() : null,
              userAuthenticated: !!user,
              grantsCount: grants.length,
            },
            null,
            2
          )}
        </pre>
      </div>

      {loading && <div className="mb-4">Loading grants...</div>}

      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          Error: {error.toString()}
        </div>
      )}

      {!loading && !error && grants.length === 0 && (
        <div className="mb-4 p-2 bg-yellow-100 text-yellow-700 rounded">
          No grants found for this user.
        </div>
      )}

      {!loading && grants.length > 0 && (
        <div>
          <h2 className="font-medium mb-2">Grants ({grants.length}):</h2>
          <ul className="space-y-2">
            {grants.map((grant) => (
              <li key={grant.id} className="p-2 border rounded">
                <div>
                  <strong>ID:</strong> {grant.id}
                </div>
                <div>
                  <strong>Company:</strong> {grant.company_name}
                </div>
                <div>
                  <strong>Type:</strong> {grant.grant_type}
                </div>
                <div>
                  <strong>Shares:</strong> {grant.shares}
                </div>
                <div>
                  <strong>Vested:</strong> {grant.vested_shares} (
                  {grant.vested_percentage.toFixed(1)}%)
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
