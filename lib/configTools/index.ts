/**
 * Return an ENV value, object if it's missing
 *
 * @param key
 */
function assertedEnvVar(key: string): string {
	const token = process.env[key];
	if (!token) {
		throw new Error(`Must set ${key}`);
	}
	return token;
}

export { assertedEnvVar };
