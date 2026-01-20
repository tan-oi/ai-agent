"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
// import { useState } from "react";
// import {
//   Loader2,
//   CheckCircle2,
//   XCircle,
//   ChevronUp,
//   ChevronDown,
// } from "lucide-react";

// export default function ChatInterface() {
//   const [input, setInput] = useState("");
//   const [showTechnicalDetails, setShowTechnicalDetails] = useState(true);
//   const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>(
//     {}
//   );

//   const { messages, status, error, sendMessage } = useChat({
//     transport: new DefaultChatTransport({
//       api: "/api/generate",
//     }),
//   });

//   const isLoading = status === "submitted" || status === "streaming";

//   const toggleToolExpansion = (messageId: string, toolIndex: number) => {
//     const key = `${messageId}-${toolIndex}`;
//     setExpandedTools((prev) => ({ ...prev, [key]: !prev[key] }));
//   };

//   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!input.trim()) return;
//     sendMessage({
//       role: "user",
//       parts: [{ type: "text", text: input }],
//     });
//     setInput("");
//   };

//   const safeStringify = (v: unknown) =>
//     typeof v === "string" ? v : JSON.stringify(v, null, 2);

//   return (
//     <div className="flex flex-col h-screen max-w-6xl mx-auto bg-gray-50">
//       {/* HEADER */}
//       <div className="p-4 border-b bg-black shadow-sm flex justify-between items-center">
//         <div>
//           <h1 className="text-2xl font-bold text-white">
//             Google Workspace Agent
//           </h1>
//           <p className="text-sm text-gray-400">
//             Your AI assistant for Gmail and Google Docs
//           </p>
//         </div>
//         <label className="flex items-center gap-2 text-sm cursor-pointer">
//           <input
//             type="checkbox"
//             checked={showTechnicalDetails}
//             onChange={(e) => setShowTechnicalDetails(e.target.checked)}
//           />
//           <span className="font-medium text-gray-200">
//             Show technical details
//           </span>
//         </label>
//       </div>

//       <div className="flex-1 overflow-y-auto p-6 space-y-6">
//         {messages.map((message) => {
//           return (
//             <div key={message.id}>
//               {message.role === "user" && (
//                 <div className="flex justify-end">
//                   <div className="max-w-[70%] rounded-2xl px-4 py-3 bg-blue-600 text-white">
//                     {message.parts.map((part, idx) =>
//                       part.type === "text" ? (
//                         <div
//                           key={`${message.id}-${idx}`}
//                           className="whitespace-pre-wrap"
//                         >
//                           {part.text}
//                         </div>
//                       ) : null
//                     )}
//                   </div>
//                 </div>
//               )}

//               {message.role === "assistant" && (
//                 <div className="flex justify-start">
//                   <div className="max-w-[85%] space-y-3">
//                     {message.parts.map((part, idx) => {
//                       const key = `${message.id}-${idx}`;

//                       if (part.type === "text") {
//                         return (
//                           <div
//                             key={key}
//                             className="bg-black border border-purple-800 rounded-xl p-4"
//                             style={{ color: "white" }}
//                           >
//                             <div className="text-sm whitespace-pre-wrap">
//                               {part.text}
//                             </div>
//                           </div>
//                         );
//                       }

//                       if (
//                         part.type === "tool-readEmail" ||
//                         part.type === "tool-sendEmail" ||
//                         part.type === "tool-createDocs"
//                       ) {
//                         return (
//                           <>
//                             <div key={Math.random()}>
//                               <p className="text-black">
//                                 {JSON.stringify(part.input)}
//                                 <p>im done here.</p>
//                                 <p>{part.type}</p>
//                                 {JSON.stringify(part.toolCallId)}
//                                 <p>gave id before</p>
//                                 {JSON.stringify(part.output)}
//                                 <p>id next</p>
//                                 {JSON.stringify(part.toolCallId)}
//                                 <p>{part.state}</p>
//                                 <p>{part.type}</p>
//                               </p>
//                             </div>
//                           </>
//                         );
//                       }

//                       return null;
//                     })}
//                   </div>
//                 </div>
//               )}
//             </div>
//           );
//         })}

//         {isLoading && (
//           <div className="flex">
//             <div className="flex items-center gap-2 text-sm text-gray-600">
//               <div className="animate-spin border rounded-full w-4 h-4 border-t-transparent" />
//               <div>Agent is thinking…</div>
//             </div>
//           </div>
//         )}

//         {error && (
//           <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
//             {error.message}
//           </div>
//         )}
//       </div>

//       {/* INPUT */}
//       <div className="p-4 border-t bg-white">
//         <form onSubmit={handleSubmit} className="flex gap-3">
//           <input
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             disabled={isLoading}
//             placeholder="Ask me to read emails, send messages, create docs..."
//             className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//           <button
//             type="submit"
//             disabled={isLoading || !input.trim()}
//             className="px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
//           >
//             Send
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

import { useState } from "react";

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(true);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>(
    {}
  );

  const { messages, status, error, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/generate",
    }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Check if there's a permission error
  const hasPermissionError =
    error?.message?.includes("insufficient") ||
    error?.message?.includes("scope") ||
    error?.message?.includes("permission");

  const toggleToolExpansion = (messageId: string, toolIndex: number) => {
    const key = `${messageId}-${toolIndex}`;
    setExpandedTools((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({
      role: "user",
      parts: [{ type: "text", text: input }],
    });
    setInput("");
  };

  const renderToolCall = (part: any, messageId: string, idx: number) => {
    const key = `${messageId}-${idx}`;
    const isExpanded = expandedTools[key];

    // SEND EMAIL - Show confirmation UI
    if (part.type === "tool-sendEmail") {
      return (
        <div
          key={key}
          className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">📧</span>
            <span className="font-semibold text-orange-700">Send Email</span>
            {part.state === "call" && (
              <span className="ml-auto text-xs bg-orange-200 text-orange-700 px-2 py-1 rounded-full font-medium">
                Awaiting Confirmation
              </span>
            )}
            {part.state === "result" && (
              <span className="ml-auto text-xs bg-green-200 text-green-700 px-2 py-1 rounded-full font-medium">
                ✓ Sent
              </span>
            )}
          </div>

          {part.state === "call" && part.input && (
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3 border border-orange-200">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">To:</span>
                    <span className="ml-2 text-gray-900">{part.input.to}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">
                      Subject:
                    </span>
                    <span className="ml-2 text-gray-900">
                      {part.input.emailSubject}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">
                      Message:
                    </span>
                    <div className="mt-1 p-3 bg-gray-50 rounded border border-gray-200">
                      <pre className="text-gray-900 whitespace-pre-wrap text-sm font-sans">
                        {part.input.emailBody}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    sendMessage({
                      role: "user",
                      parts: [{ type: "text", text: "Yes, send the email." }],
                    });
                  }}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <span>✓</span> Confirm & Send
                </button>
                <button
                  onClick={() => {
                    sendMessage({
                      role: "user",
                      parts: [{ type: "text", text: "No, cancel the email." }],
                    });
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <span>✗</span> Cancel
                </button>
              </div>
            </div>
          )}

          {part.state === "result" && part.output && (
            <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
              Email sent successfully!
            </div>
          )}

          {showTechnicalDetails && (
            <button
              onClick={() => toggleToolExpansion(messageId, idx)}
              className="mt-3 text-xs text-orange-600 hover:text-orange-800 font-medium"
            >
              {isExpanded ? "Hide" : "Show"} technical details
            </button>
          )}

          {showTechnicalDetails && isExpanded && (
            <div className="mt-2 p-3 bg-orange-100 rounded text-xs font-mono text-gray-700 space-y-1">
              <div>Tool Call ID: {part.toolCallId}</div>
              <div>State: {part.state}</div>
              {part.output && <div>Output: {JSON.stringify(part.output)}</div>}
            </div>
          )}
        </div>
      );
    }

    // OTHER TOOLS - Simple display
    if (
      part.type === "tool-readEmail" ||
      part.type === "tool-createDocs" ||
      part.type === "tool-readDocs" ||
      part.type === "tool-createSheet" ||
      part.type === "tool-readSheet"
    ) {
      const toolName = part.type.replace("tool-", "");
      const icon = part.type.includes("Email") ? "📬" : "📄";

      return (
        <div
          key={key}
          className="bg-blue-50 border border-blue-300 rounded-xl p-4"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <span className="font-semibold text-blue-700">{toolName}</span>
            {part.state === "result" && (
              <span className="ml-auto text-xs bg-green-200 text-green-700 px-2 py-1 rounded-full">
                ✓ Complete
              </span>
            )}
          </div>

          {showTechnicalDetails && (
            <button
              onClick={() => toggleToolExpansion(messageId, idx)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              {isExpanded ? "Hide" : "Show"} details
            </button>
          )}

          {showTechnicalDetails && isExpanded && (
            <div className="mt-3 space-y-2">
              <div className="p-2 bg-blue-100 rounded text-xs font-mono">
                <div className="font-semibold mb-1">Input:</div>
                <pre className="text-gray-700">
                  {JSON.stringify(part.input, null, 2)}
                </pre>
              </div>
              {part.output && (
                <div className="p-2 bg-blue-100 rounded text-xs font-mono">
                  <div className="font-semibold mb-1">Output:</div>
                  <pre className="text-gray-700">
                    {JSON.stringify(part.output, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto bg-gray-50">
      {/* HEADER */}
      <div className="p-4 border-b bg-black shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Google Workspace Agent
          </h1>
          <p className="text-sm text-gray-400">
            Your AI assistant for Gmail and Google Docs
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showTechnicalDetails}
            onChange={(e) => setShowTechnicalDetails(e.target.checked)}
          />
          <span className="font-medium text-gray-200">
            Show technical details
          </span>
        </label>
      </div>

      {/* PERMISSION ERROR DIALOG */}
      {hasPermissionError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 shadow-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-bold text-yellow-800">
                Permission Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  The agent needs additional Google Workspace permissions to
                  complete this action.
                </p>
                <p className="mt-1 font-medium">
                  Please grant the required scopes to continue.
                </p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    // You'll handle the OAuth flow here
                    window.location.href = "/api/auth/google";
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium shadow-sm"
                >
                  Grant Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => {
          return (
            <div key={message.id}>
              {message.role === "user" && (
                <div className="flex justify-end">
                  <div className="max-w-[70%] rounded-2xl px-4 py-3 bg-blue-600 text-white">
                    {message.parts.map((part, idx) =>
                      part.type === "text" ? (
                        <div
                          key={`${message.id}-${idx}`}
                          className="whitespace-pre-wrap"
                        >
                          {part.text}
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {message.role === "assistant" && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] space-y-3">
                    {message.parts.map((part, idx) => {
                      if (part.type === "text") {
                        return (
                          <div
                            key={`${message.id}-${idx}`}
                            className="bg-black border border-purple-800 rounded-xl p-4 text-white"
                          >
                            <div className="text-sm whitespace-pre-wrap">
                              {part.text}
                            </div>
                          </div>
                        );
                      }

                      return renderToolCall(part, message.id, idx);
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin border-2 border-blue-600 rounded-full w-4 h-4 border-t-transparent" />
              <div>Agent is thinking…</div>
            </div>
          </div>
        )}

        {error && !hasPermissionError && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
            {error.message}
          </div>
        )}
      </div>

      {/* INPUT */}
      <div className="p-4 border-t bg-black">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask me to read emails, send messages, create docs..."
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors font-medium"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
