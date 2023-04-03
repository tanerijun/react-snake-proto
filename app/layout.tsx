import "./globals.css"

export const metadata = {
	title: "React Snake",
	description: "A snake game created with React",
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	)
}
