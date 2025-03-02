import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

export const metadata = {
	title: "SafeCall - Personal Safety App",
	description: "AI-powered personal safety application",
	icons: {
		icon: [
			{ url: "/favicon.ico", sizes: "32x32" },
			{ url: "/SafeCall.svg", type: "image/svg+xml" }
		],
		apple: { url: "/SafeCall.svg", type: "image/svg+xml" },
	},
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body
				className={`${inter.variable} antialiased`}
			>
				{children}
				<Toaster 
					position="top-right"
					toastOptions={{
						duration: 4000,
						style: {
							background: '#1f2937',
							color: '#fff',
							border: '1px solid #374151',
						},
						success: {
							iconTheme: {
								primary: '#10b981',
								secondary: '#1f2937',
							},
						},
						error: {
							iconTheme: {
								primary: '#ef4444',
								secondary: '#1f2937',
							},
						},
						info: {
							iconTheme: {
								primary: '#3b82f6',
								secondary: '#1f2937',
							},
						},
					}}
				/>
			</body>
		</html>
	);
}
