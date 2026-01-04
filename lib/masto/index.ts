import type {
	CreateStatusParams,
	MastoClient,
	Status,
	StatusVisibility,
} from "../../lib/masto/types";

/**
 * Post plain string to mastodon
 *
 * @param masto
 * @param postString
 * @param postVisibility
 * @param inReplyToId
 * @param mediaIds
 */
async function postToMastodon(
	masto: MastoClient,
	postString: string,
	postVisibility: string,
	inReplyToId?: string | undefined,
	mediaIds: string[] = [],
): Promise<Status> {
	console.log(`Logged in…`);

	const statusParams: CreateStatusParams = {
		status: postString,
		visibility: postVisibility as StatusVisibility,
		...(inReplyToId ? { inReplyToId } : {}),
		...(mediaIds ? { mediaIds } : {}),
	};

	console.log({ statusParams });

	return masto.v1.statuses.create(statusParams);
}

type SimpleMastoAttachment = { id: string };

async function createAttachmentFromImageData(
	mastoClient: MastoClient,
	imageBuffer: Buffer,
	altText: string,
): Promise<SimpleMastoAttachment> {
	return mastoClient.v2.media.create({
		file: new Blob([new Uint8Array(imageBuffer)]),
		description: altText,
	});
}

export {
	postToMastodon,
	createAttachmentFromImageData,
	type SimpleMastoAttachment,
};
