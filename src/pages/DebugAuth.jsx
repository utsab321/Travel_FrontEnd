import { useAuth } from "../context/AuthContext";
import { useAuthRequired } from "../hooks/useAuthRequired";

// ──── CONSTANTS ────
const COLORS = {
  green400: "rgb(74, 222, 128)",
  red400: "rgb(248, 113, 113)",
  yellow400: "rgb(250, 204, 21)",
  blue400: "rgb(96, 165, 250)",
};

const TEXTS = {
  title: "🔍 Auth Debug Page",
  contextHeader: "Context State (useAuth)",
  user: "User",
  token: "Token",
  userSet: "✓ SET",
  userNull: "✗ NULL",
  tokenSet: "✓ SET",
  tokenNull: "✗ NULL",
  username: "Username",
  email: "Email:",
  tokenLength: "Length",
  tokenStarts: "Starts",
  chars: "chars",
  localStorageHeader: "LocalStorage State",
  accessToken: "access_token",
  stored: "✓ STORED",
  empty: "✗ EMPTY",
  userStorage: "user",
  size: "Size",
  authReadyHeader: "Auth Ready Hook",
  isReady: "isReady",
  isAuthenticating: "isAuthenticating",
  isReadyTrue: "✓ TRUE",
  isReadyFalse: "✗ FALSE",
  isAuthTrue: "⏳ TRUE",
  isAuthFalse: "✓ FALSE",
  recommendationsHeader: "ℹ️ Recommendations",
  noUserMsg: "❌ No user found - You need to log in",
  noTokenMsg: "❌ User set but token missing - Try logging in again",
  authorizedMsg: "✅ Authenticated - You should be able to make API calls",
  authInitMsg: "⏳ Auth is initializing - Wait for isReady to become true",
  timingIssueMsg: "ℹ️ Auth hook says not ready but context is set - May be a timing issue",
};

export default function DebugAuth() {
  const { user, token } = useAuth();
  const { isReady, isAuthenticating } = useAuthRequired();
  const storedToken = localStorage.getItem("access_token");
  const storedUser = localStorage.getItem("user");

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">{TEXTS.title}</h1>
      
      <div className="space-y-6">
        {/* Context State */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">{TEXTS.contextHeader}</h2>
          <div className="space-y-2 font-mono text-sm">
            <p>{TEXTS.user}: <span className={user ? "text-green-400" : "text-red-400"}>{user ? TEXTS.userSet : TEXTS.userNull}</span></p>
            {user && (
              <>
                <p className="text-gray-400">  - {TEXTS.username}: {user.username}</p>
                <p className="text-gray-400">  - {TEXTS.email} {user.email}</p>
              </>
            )}
            <p>{TEXTS.token}: <span className={token ? "text-green-400" : "text-red-400"}>{token ? TEXTS.tokenSet : TEXTS.tokenNull}</span></p>
            {token && (
              <>
                <p className="text-gray-400">  - {TEXTS.tokenLength}: {token.length} {TEXTS.chars}</p>
                <p className="text-gray-400">  - {TEXTS.tokenStarts}: {token.substring(0, 20)}...</p>
              </>
            )}
          </div>
        </div>

        {/* Local Storage State */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">{TEXTS.localStorageHeader}</h2>
          <div className="space-y-2 font-mono text-sm">
            <p>{TEXTS.accessToken}: <span className={storedToken ? "text-green-400" : "text-red-400"}>{storedToken ? TEXTS.stored : TEXTS.empty}</span></p>
            {storedToken && (
              <p className="text-gray-400">  - {TEXTS.tokenLength}: {storedToken.length} {TEXTS.chars}</p>
            )}
            <p>{TEXTS.userStorage}: <span className={storedUser ? "text-green-400" : "text-red-400"}>{storedUser ? TEXTS.stored : TEXTS.empty}</span></p>
            {storedUser && (
              <p className="text-gray-400">  - {TEXTS.size}: {storedUser.length} {TEXTS.chars}</p>
            )}
          </div>
        </div>

        {/* Auth Ready State */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">{TEXTS.authReadyHeader}</h2>
          <div className="space-y-2 font-mono text-sm">
            <p>{TEXTS.isReady}: <span className={isReady ? "text-green-400" : "text-yellow-400"}>{isReady ? TEXTS.isReadyTrue : TEXTS.isReadyFalse}</span></p>
            <p>{TEXTS.isAuthenticating}: <span className={isAuthenticating ? "text-yellow-400" : "text-green-400"}>{isAuthenticating ? TEXTS.isAuthTrue : TEXTS.isAuthFalse}</span></p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-blue-900/30 border border-blue-500 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">{TEXTS.recommendationsHeader}</h2>
          <ul className="space-y-2 text-sm">
            {!user && !storedUser && (
              <li className="text-red-400">{TEXTS.noUserMsg}</li>
            )}
            {user && !token && !storedToken && (
              <li className="text-red-400">{TEXTS.noTokenMsg}</li>
            )}
            {user && token && (
              <li className="text-green-400">{TEXTS.authorizedMsg}</li>
            )}
            {!isReady && isAuthenticating && (
              <li className="text-yellow-400">{TEXTS.authInitMsg}</li>
            )}
            {!isReady && !isAuthenticating && user && token && (
              <li className="text-blue-400">{TEXTS.timingIssueMsg}</li>
            )}
          </ul>
        </div>

        {/* Test API Call */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Test API Call</h2>
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem("access_token");
                if (!token) {
                  alert("No token found");
                  return;
                }
                const backendUrl =
                  process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";

                const res = await fetch(`{backendUrl}/api/users/me/`, {
                  headers: { "Authorization": `Bearer ${token}` }
                });
                const data = await res.json();
                alert(`Status: ${res.status}\n\n${JSON.stringify(data, null, 2)}`);
              } catch (err) {
                alert("Error: " + err.message);
              }
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold"
          >
            Test GET /api/users/me/
          </button>
        </div>
      </div>
    </div>
  );
}
