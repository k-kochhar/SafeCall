import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

export const metadata = {
	title: "SafeCall",
	description: "SafeCall",
	icons: {
		icon: "/SafeCall.svg",
	},
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body
				className={`${inter.variable} antialiased`}
			>
				{children}
			</body>
		</html>
	);
}
