import * as AppBskyRichtextFacet from "@atproto/api/src/client/types/app/bsky/richtext/facet";
import { Logger } from "pino";
import { AtpAgent } from "@atproto/api";
import { AppBskyFeedPost } from "@atproto/api/src/client";

type Postable = Partial<AppBskyFeedPost.Record> & Omit<AppBskyFeedPost.Record, "createdAt">;

type StrongPostRef = { uri: string; cid: string };

/**
 * Convert a utf8 character offset in a string to the equivalent offset in bytes
 * @param text
 * @param offset
 */
function bytesBeforeUtf8Offset(text: string, offset: number): number {
  const substring = text.substring(0, offset);
  const bytes = Buffer.from(substring);
  return bytes.length;
}

/**
 * Get a logged-in AtpAgent
 * @param serverBaseUrl
 * @param username
 * @param password
 * @param logger
 */
async function getAtprotoAgent(
  serverBaseUrl: string,
  username: string,
  password: string,
  logger?: Logger
): Promise<AtpAgent> {
  logger?.info(`Logging in…`);
  const agent = new AtpAgent({
    service: serverBaseUrl,
  });
  await agent.login({
    identifier: username,
    password: password,
  });

  logger?.info(`Logged in…`);
  return agent;
}

/**
 * Create map of hashtags from string
 * @param postText
 * @param logger
 */
function buildHashtagMap(postText: string, logger?: Logger): AppBskyRichtextFacet.Main[] {
  const hashtags = [...postText.matchAll(/#\w+/g)].map((h) => {
    return {
      index: {
        byteStart: bytesBeforeUtf8Offset(postText, h.index!),
        byteEnd: bytesBeforeUtf8Offset(postText, h.index! + h[0].length),
      },
      features: [
        {
          tag: h[0].substring(1),
          $type: "app.bsky.richtext.facet#tag",
        },
      ],
    };
  });

  logger?.debug({ hashtags });
  return hashtags;
}

/**
 * Post plain text to ATProto with configured client
 *
 * @param agent
 * @param text
 * @param replyRef
 * @param logger
 */
async function postToAtproto(
  agent: AtpAgent,
  text: string,
  replyRef?: StrongPostRef,
  logger?: Logger
): Promise<StrongPostRef> {
  // Publish!
  const hashtags = buildHashtagMap(text);
  let fullReplyReference = {};
  if (replyRef) {
    fullReplyReference = {
      reply: {
        root: replyRef,
        parent: replyRef,
      },
    };
  }

  const statusParams: Postable = {
    text: text,
    createdAt: new Date().toISOString(),
    facets: hashtags,
    ...fullReplyReference,
  };

  const status = await agent.post(statusParams);

  logger?.info({ status }, `Posted to ${status.uri}`);
  return status;
}

export { buildHashtagMap, getAtprotoAgent, postToAtproto };
export type { StrongPostRef };
