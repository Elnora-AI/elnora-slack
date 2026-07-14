export default function Home() {
	const botName = process.env.BOT_NAME?.trim() || "Slack Agent";
	return (
		<main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 640, margin: "4rem auto", padding: "0 1rem" }}>
			<h1>{botName}</h1>
			<p>
				This is a two-way Slack AI agent deployed from the{" "}
				<a href="https://github.com/Elnora-AI/elnora-slack">elnora-slack</a> bot template.
			</p>
			<ul>
				<li>
					Webhook endpoint: <code>/api/webhooks/slack</code>
				</li>
				<li>
					Health probe: <a href="/api/health">/api/health</a>
				</li>
			</ul>
			<p>Talk to the bot in Slack — DM it or @-mention it in a channel.</p>
		</main>
	);
}
