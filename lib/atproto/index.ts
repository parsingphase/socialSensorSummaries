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
function buildHashtagFacets(postText: string, logger?: Logger): AppBskyRichtextFacet.Main[] {
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

type Link = {
  text: string;
  uri: string;
};

/**
 * Create map of first occurrence of a given string to a paired URL. Use with care!
 * @param postText
 * @param matches
 * @param logger
 */
function buildLinkFacets(
  postText: string,
  matches: Link[],
  logger?: Logger
): AppBskyRichtextFacet.Main[] {
  const facets: AppBskyRichtextFacet.Main[] = [];
  for (const h of matches) {
    const { text, uri } = h;
    const index = postText.indexOf(text);
    const length = postText.length;

    if (index) {
      facets.push({
        index: {
          byteStart: bytesBeforeUtf8Offset(postText, index),
          byteEnd: bytesBeforeUtf8Offset(postText, index + length),
        },
        features: [
          {
            uri: uri,
            $type: "app.bsky.richtext.facet#link",
          },
        ],
      });
    }
  }

  logger?.debug({ facets });
  return facets;
}

/**
 * Post plain text to ATProto with configured client
 *
 * @param agent
 * @param text
 * @param replyRef
 * @param linkSpecs
 * @param logger
 */
async function postToAtproto(
  agent: AtpAgent,
  text: string,
  replyRef?: StrongPostRef,
  linkSpecs: Link[] = [],
  logger?: Logger
): Promise<StrongPostRef> {
  // Publish!
  const hashtags = buildHashtagFacets(text);
  let fullReplyReference = {};
  if (replyRef) {
    fullReplyReference = {
      reply: {
        root: replyRef,
        parent: replyRef,
      },
    };
  }

  const linkFacets = buildLinkFacets(text, linkSpecs, logger);

  const statusParams: Postable = {
    text: text,
    createdAt: new Date().toISOString(),
    facets: [...hashtags, ...linkFacets],
    ...fullReplyReference,
  };

  const status = await agent.post(statusParams);

  logger?.info({ status }, `Posted to ${status.uri}`);
  return status;
}

export { buildHashtagFacets, buildLinkFacets, getAtprotoAgent, postToAtproto };
export type { Link, StrongPostRef };
