/**
 * @module redux/features/conversationEndpoints
 *
 * The conversation endpoint set of §42.6 (§36 server contract, §24
 * model; UI §55). One conversation per report, created lazily at
 * the first saved turn — `GET .../chat` answers 200 with
 * `{ messages: [] }` for a report with no conversation yet. The
 * user turn posts through `POST .../chat/messages`; the AI answer
 * is appended by the server service, never by this mutation. There
 * is no delete/update endpoint (§36.3) — the conversation's
 * lifetime is the owning report's.
 *
 * The `skipReauth` marker is absent: chat is a data surface of the
 * authenticated session and 401s must enter the §42.3 chain.
 */
import { apiSlice } from "./apiSlice";

export const {
  useGetConversationQuery,
  useSendChatMessageMutation,
} = apiSlice.injectEndpoints({
  overrideExisting: false,
  endpoints: (build) => ({
    getConversation: build.query({
      query: (reportId) => ({ url: `/reports/${reportId}/chat` }),
      providesTags: (_result, _error, reportId) => [
        { type: "Conversation", id: reportId },
      ],
    }),
    sendChatMessage: build.mutation({
      query: ({ reportId, ...body }) => ({
        url: `/reports/${reportId}/chat/messages`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { reportId }) => [
        { type: "Conversation", id: reportId },
      ],
    }),
  }),
});